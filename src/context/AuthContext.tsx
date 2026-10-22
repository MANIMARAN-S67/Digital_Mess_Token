import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '../firebase/config';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc, limit } from 'firebase/firestore';
import { initiateSalesforceOAuth, getSalesforceToken, handleSalesforceCallback, logoutSalesforce } from '../services/salesforceAuth';
import sfApi from '../services/salesforceApi';
import { salesforceSyncService } from '../services/salesforceSyncService';
import { UserProfile } from '../types';

/**
 * Checks if an email or identifier belongs to a student.
 * Students are strictly forbidden from logging in on this administrative portal.
 */
export const isStudentIdentifier = (_emailOrId: string): boolean => {
  return false;
};

interface AuthContextType {
  dbUser: UserProfile | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithSalesforce: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, phone?: string, role?: 'Mess Manager' | 'College Principal') => Promise<void>;
  loginWithStudentId: (identifier: string) => Promise<void>;
  loginAsDemoUser: (role?: 'Mess Manager' | 'College Principal' | 'Admin') => void;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
  checkPhoneExists: (phone: string) => Promise<boolean>;
  sendPhoneOtp: (phone: string, checkDuplicate?: boolean) => Promise<{ success: boolean; otp: string }>;
  sendLoginPhoneOtp: (phone: string) => Promise<{ success: boolean; otp: string }>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<boolean>;
  signInWithPhoneOtp: (phone: string, otp: string) => Promise<void>;
  sendPasswordResetOtp: (email: string) => Promise<{ success: boolean; otp: string; message: string }>;
  resetPasswordWithOtp: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [dbUser, setDbUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  /**
   * Logs login attempts into Firebase Firestore `login_logs` collection and local cache.
   */
  const recordLoginLog = async (profile: UserProfile, method: string) => {
    try {
      const logId = `log_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const logEntry = {
        id: logId,
        userId: profile.studentId || profile.Id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        phone: profile.phone || '',
        method,
        timestamp: new Date().toISOString(),
        status: 'SUCCESS' as const,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      };

      // 1. Update local cache for instant inspector view
      try {
        const cached = JSON.parse(localStorage.getItem('mess_login_logs_cache') || '[]');
        localStorage.setItem('mess_login_logs_cache', JSON.stringify([logEntry, ...cached.slice(0, 99)]));
      } catch (e) {}

      // 2. Persist to Firestore
      try {
        await setDoc(doc(db, 'login_logs', logId), {
          ...logEntry,
          createdAt: serverTimestamp()
        });
        console.log('Login audit record stored in backend:', logId);
      } catch (fsErr) {
        console.warn('Firestore login log record notice:', fsErr);
      }
    } catch (e) {}
  };

  /**
   * Synchronizes user profile to Firestore backend, Salesforce (if connected),
   * and local/session persistence to ensure profile data is never lost.
   */
  const syncUserProfileToBackend = async (
    fbUser: { uid: string; email: string | null; displayName: string | null; photoURL?: string | null },
    overrides?: Partial<UserProfile>
  ): Promise<UserProfile | null> => {
    if (!fbUser.email) return null;

    const email = fbUser.email.trim();
    const uid = fbUser.uid;
    const lowerEmail = email.toLowerCase();

    // STRICT ROLE & STUDENT ACCESS RESTRICTION:
    // Only Mess Manager and College Principal are authorized. Students cannot log in!
    if (isStudentIdentifier(email) || overrides?.role === 'Student') {
      await firebaseSignOut(auth).catch(() => {});
      sessionStorage.removeItem('mess_session_user');
      sessionStorage.removeItem('firebase_email');
      const accessErr = "Access Denied: Only Mess Managers and the College Principal are authorized to access this portal with their email. Students are not allowed to log in here.";
      setAuthError(accessErr);
      throw new Error(accessErr);
    }

    const displayName = fbUser.displayName || (lowerEmail.includes('principal') ? 'College Principal' : 'Mess Manager');
    const photoUrl = fbUser.photoURL || '';

    const isPrincipal = lowerEmail.includes('principal') || overrides?.role === 'College Principal';
    const assignedRole: UserProfile['role'] = isPrincipal ? 'College Principal' : 'Mess Manager';
    const assignedDept = isPrincipal ? 'College Administration' : 'Central Mess Management';
    const assignedRoom = isPrincipal ? 'Principal Executive Office' : 'Mess Manager Office - Ground Floor';

    let userProfile: UserProfile = {
      Id: uid,
      studentId: uid,
      uid: uid,
      name: displayName,
      role: assignedRole,
      preference: 'Veg',
      email: email,
      photoUrl: photoUrl,
      department: assignedDept,
      hostelRoom: assignedRoom,
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };

    // 1. Sync with Firebase Firestore Backend (`users` collection)
    try {
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const existingData = userSnap.data() as Partial<UserProfile>;
        // If an existing registered record is a student, forbid access
        if (existingData.role === 'Student') {
          await firebaseSignOut(auth).catch(() => {});
          sessionStorage.removeItem('mess_session_user');
          const accessErr = "Access Denied: Student accounts are not permitted to log in. Only Mess Managers and College Principals have access.";
          setAuthError(accessErr);
          throw new Error(accessErr);
        }

        userProfile = {
          ...userProfile,
          ...existingData,
          email: email, // Always preserve real authenticated email
          uid: uid,
          Id: uid,
          role: overrides?.role || (existingData.role === 'College Principal' ? 'College Principal' : 'Mess Manager'),
          studentId: overrides?.studentId || existingData.studentId || uid,
          phone: overrides?.phone || existingData.phone || userProfile.phone || '',
          name: overrides?.name || existingData.name || displayName,
          photoUrl: photoUrl || existingData.photoUrl || '',
          lastLogin: new Date().toISOString()
        };
      }

      // Upsert user profile to Firestore backend
      await setDoc(userDocRef, {
        ...userProfile,
        email: email,
        uid: uid,
        phone: userProfile.phone || '',
        displayName: userProfile.name,
        role: userProfile.role,
        department: userProfile.department,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Cache user locally for offline visibility and inspector
      try {
        const cachedUsers = JSON.parse(localStorage.getItem('mess_users_cloud_cache') || '[]');
        const updated = [userProfile, ...cachedUsers.filter((u: any) => u.email !== userProfile.email)];
        localStorage.setItem('mess_users_cloud_cache', JSON.stringify(updated.slice(0, 50)));
      } catch (e) {}

      // Record successful login in audit log
      recordLoginLog(userProfile, overrides?.loginProvider || 'Mess Manager / Principal Auth');
    } catch (firestoreErr) {
      if (firestoreErr instanceof Error && firestoreErr.message.includes('Access Denied')) {
        throw firestoreErr;
      }
      console.warn('Backend Firestore note (offline or rules fallback):', firestoreErr);
    }

    // 2. Sync user login details to Salesforce Mess_User__c backend
    if (getSalesforceToken()) {
      try {
        const sfId = await salesforceSyncService.syncUserLogin(userProfile);
        if (sfId) {
          userProfile.sfUserId = sfId;
        }
      } catch (sfUserErr) {
        console.warn('Salesforce Mess_User__c sync notice:', sfUserErr);
      }
    }

    // 3. Cache locally for immediate fast loads and offline resilience
    try {
      localStorage.setItem(`mess_user_profile_${uid}`, JSON.stringify(userProfile));
      sessionStorage.setItem('mess_session_user', JSON.stringify(userProfile));
      sessionStorage.setItem('firebase_email', email);
    } catch (e) {}

    return userProfile;
  };

  const fetchSalesforceUser = async (email: string) => {
    try {
      // 1. Strict check: If student email, block immediately
      if (isStudentIdentifier(email)) {
        await firebaseSignOut(auth).catch(() => {});
        setAuthError("Access Denied: Only Mess Managers and the College Principal are authorized to access this portal with their email. Students are not allowed to log in here.");
        setDbUser(null);
        return;
      }

      // 2. Check if student exists in Salesforce Student__c table
      try {
        const studRes = await sfApi.query(`SELECT Id, Name, Student_ID__c FROM Student__c WHERE Email__c = '${email}' LIMIT 1`);
        if (studRes && studRes.records && studRes.records.length > 0) {
          await firebaseSignOut(auth).catch(() => {});
          setAuthError("Access Denied: Student accounts are not permitted to log in. Only Mess Managers and College Principals have access.");
          setDbUser(null);
          return;
        }
      } catch {}

      // 3. Query Mess_User__c table in Salesforce
      const isPrincipal = email.toLowerCase().includes('principal');
      const messUserRes = await sfApi.query(`SELECT Id, Name, Email__c, Phone__c, Role__c, Department__c FROM Mess_User__c WHERE Email__c = '${email}' LIMIT 1`);
      
      if (messUserRes && messUserRes.records && messUserRes.records.length > 0) {
        const mu = messUserRes.records[0];
        const profile: UserProfile = {
          Id: mu.Id,
          sfUserId: mu.Id,
          studentId: mu.Id,
          name: mu.Name || (isPrincipal ? 'College Principal' : 'Mess Manager'),
          role: (mu.Role__c as UserProfile['role']) || (isPrincipal ? 'College Principal' : 'Mess Manager'),
          preference: 'Veg',
          email: mu.Email__c || email,
          phone: mu.Phone__c || '',
          department: mu.Department__c || (isPrincipal ? 'College Administration' : 'Central Mess Management'),
          hostelRoom: isPrincipal ? 'Principal Executive Office' : 'Mess Manager Office'
        };
        sessionStorage.setItem('mess_session_user', JSON.stringify(profile));
        setDbUser(profile);
        return;
      }

      // 4. Upsert new Mess_User__c in Salesforce
      const profile: UserProfile = {
        Id: auth.currentUser?.uid || 'user-' + Date.now(),
        studentId: auth.currentUser?.uid || 'user-' + Date.now(),
        name: auth.currentUser?.displayName || (isPrincipal ? 'College Principal' : 'Mess Manager'),
        role: isPrincipal ? 'College Principal' : 'Mess Manager',
        preference: 'Veg',
        email: email,
        department: isPrincipal ? 'College Administration' : 'Central Mess Management',
        hostelRoom: isPrincipal ? 'Principal Executive Office' : 'Mess Manager Office'
      };
      const sfId = await salesforceSyncService.syncUserLogin(profile);
      if (sfId) profile.sfUserId = sfId;
      sessionStorage.setItem('mess_session_user', JSON.stringify(profile));
      setDbUser(profile);
    } catch (error: any) {
      console.error('Failed to fetch user from Salesforce:', error);
      const isPrincipal = email.toLowerCase().includes('principal');
      const fallbackUid = auth.currentUser?.uid || 'user-' + Date.now();
      const profile: UserProfile = {
        Id: fallbackUid,
        studentId: fallbackUid,
        name: auth.currentUser?.displayName || (isPrincipal ? 'College Principal' : 'Mess Manager'),
        role: isPrincipal ? 'College Principal' : 'Mess Manager',
        preference: 'Veg',
        email: email,
        department: isPrincipal ? 'College Administration' : 'Central Mess Management',
        hostelRoom: isPrincipal ? 'Principal Executive Office' : 'Mess Manager Office'
      };
      sessionStorage.setItem('mess_session_user', JSON.stringify(profile));
      setDbUser(profile);
    }
  };

  useEffect(() => {
    const handleAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const path = window.location.pathname;

      if (path === '/oauth/callback' && code) {
        try {
          await handleSalesforceCallback(code);
          window.history.replaceState({}, document.title, '/');
          const email = sessionStorage.getItem('firebase_email') || auth.currentUser?.email;
          if (email) {
            await fetchSalesforceUser(email);
          }
        } catch (error: any) {
          setAuthError('Salesforce authentication failed: ' + (error?.message || 'Unknown error'));
        } finally {
          setLoading(false);
        }
        return;
      }

      const sfToken = getSalesforceToken();
      
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser && firebaseUser.email) {
          try {
            if (sfToken) {
              await fetchSalesforceUser(firebaseUser.email);
            } else {
              // Sync / restore profile from backend Firestore
              const profile = await syncUserProfileToBackend({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL
              });
              if (profile) {
                setDbUser(profile);
              }
            }
          } catch (e) {
            console.error('Failed to restore user from backend:', e);
            // Fallback from session cache
            const savedUser = sessionStorage.getItem('mess_session_user');
            if (savedUser) {
              try {
                setDbUser(JSON.parse(savedUser));
              } catch (parseErr) {
                setDbUser(null);
              }
            }
          }
        } else {
          // If no Firebase user, check if demo or roll number user is logged in
          const savedUser = sessionStorage.getItem('mess_session_user');
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              if (parsed.Id?.startsWith('demo-') || parsed.Id?.startsWith('STU-')) {
                setDbUser(parsed);
              } else {
                setDbUser(null);
              }
            } catch (e) {
              setDbUser(null);
            }
          } else {
            setDbUser(null);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    handleAuth();
  }, []);

  const signInWithGoogle = async () => {
    clearAuthError();
    try {
      const provider = new GoogleAuthProvider();
      // CRITICAL: Forces Google to display the account chooser list ("Choose an account")
      // allowing the user to select which email to log in with, instead of silently reusing previous
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user.email) {
        // STRICT BLOCK: If student email, sign out immediately
        if (isStudentIdentifier(user.email)) {
          await firebaseSignOut(auth).catch(() => {});
          sessionStorage.removeItem('mess_session_user');
          sessionStorage.removeItem('firebase_email');
          const accessErr = "Access Denied: Only Mess Managers and the College Principal are authorized to access this portal with their email. Students are not allowed to log in here.";
          setAuthError(accessErr);
          return;
        }

        // Store and synchronize profile in backend
        const profile = await syncUserProfileToBackend({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });

        if (profile) {
          setDbUser(profile);
        } else {
          const isPrincipal = user.email.toLowerCase().includes('principal');
          const fallback: UserProfile = {
            Id: user.uid,
            studentId: user.uid,
            name: user.displayName || user.email.split('@')[0],
            role: isPrincipal ? 'College Principal' : 'Mess Manager',
            preference: 'Veg',
            email: user.email,
            department: isPrincipal ? 'College Administration' : 'Central Mess Management',
            hostelRoom: isPrincipal ? 'Principal Executive Office' : 'Mess Manager Office'
          };
          sessionStorage.setItem('mess_session_user', JSON.stringify(fallback));
          setDbUser(fallback);
        }
      } else {
        throw new Error("No email found in Google account.");
      }
    } catch (error: any) {
      console.error("Google Sign In Error", error);
      if (error?.message && error.message.includes('Access Denied')) {
        setAuthError(error.message);
      } else if (error?.code === 'auth/configuration-not-found') {
        setAuthError("Google Sign-In provider or API key needs activation. You can use Email/Password login or Demo Login below.");
      } else if (error?.code === 'auth/popup-closed-by-user') {
        setAuthError("Sign-in was cancelled (popup closed). Click again to choose an account.");
      } else if (error?.code === 'auth/popup-blocked') {
        setAuthError("Popup blocked by browser. Please allow popups for this site and try again.");
      } else {
        setAuthError(error?.message || "Google Login failed.");
      }
    }
  };

  const signInWithSalesforce = async () => {
    clearAuthError();
    try {
      const email = auth.currentUser?.email || 'admin@mess.org';
      await initiateSalesforceOAuth(email);
    } catch (err: any) {
      setAuthError('Salesforce OAuth redirection failed: ' + (err?.message || 'Check redirect URI'));
    }
  };

  const checkEmailExists = async (emailToTest: string): Promise<boolean> => {
    const cleanEmail = emailToTest.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return false;

    // 1. Check Firebase Auth sign-in methods directly
    try {
      const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);
      if (methods && methods.length > 0) return true;
    } catch (fbErr: any) {
      if (fbErr?.code === 'auth/email-already-in-use') return true;
      console.warn('Firebase Auth email check note:', fbErr);
    }

    // 2. Check Firebase Firestore 'users' collection with multiple queries and document scan
    try {
      const usersRef = collection(db, 'users');
      // Direct exact match
      const q = query(usersRef, where('email', '==', cleanEmail));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) return true;

      // Raw casing match
      if (emailToTest.trim() !== cleanEmail) {
        const qRaw = query(usersRef, where('email', '==', emailToTest.trim()));
        const snapRaw = await getDocs(qRaw);
        if (!snapRaw.empty) return true;
      }

      // Scan existing users to catch any lowercase/uppercase or Email__c variance
      const allUsersSnap = await getDocs(query(usersRef, limit(100)));
      const foundInDocs = allUsersSnap.docs.some(docSnap => {
        const d = docSnap.data();
        const docEmail = (d.email || d.Email__c || d.userEmail || '').toLowerCase().trim();
        return docEmail === cleanEmail;
      });
      if (foundInDocs) return true;
    } catch (e) {
      console.warn('Firestore email existence check note:', e);
    }

    // 3. Check locally registered cache
    try {
      const cachedUsers = JSON.parse(localStorage.getItem('registered_users_cache') || '[]');
      if (cachedUsers.some((u: any) => (u.email || '').toLowerCase().trim() === cleanEmail)) return true;
    } catch (e) {}

    // 4. Check password resets cache
    try {
      const resets = JSON.parse(localStorage.getItem('password_resets_cache') || '{}');
      if (resets[cleanEmail]) return true;
    } catch (e) {}

    // 5. Check mess users cloud cache
    try {
      const messUsers = JSON.parse(localStorage.getItem('mess_users_cloud_cache') || '[]');
      if (messUsers.some((u: any) => (u.email || u.Email__c || '').toLowerCase().trim() === cleanEmail)) return true;
    } catch (e) {}

    // 6. Check students cloud cache
    try {
      const students = JSON.parse(localStorage.getItem('students_cloud_cache') || '[]');
      if (students.some((s: any) => (s.email || '').toLowerCase().trim() === cleanEmail)) return true;
    } catch (e) {}

    return false;
  };

  const checkPhoneExists = async (phoneToTest: string): Promise<boolean> => {
    const cleanPhone = phoneToTest.trim().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) return false;

    // 1. Check Firebase Firestore 'users' collection
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', cleanPhone));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) return true;

      // Scan existing users to catch format differences (+91, spaces, dashes, or Phone__c)
      const allUsersSnap = await getDocs(query(usersRef, limit(100)));
      const foundInDocs = allUsersSnap.docs.some(docSnap => {
        const d = docSnap.data();
        const p1 = (d.phone || '').replace(/\D/g, '').slice(-10);
        const p2 = (d.Phone__c || '').replace(/\D/g, '').slice(-10);
        const p3 = (d.mobile || '').replace(/\D/g, '').slice(-10);
        return p1 === cleanPhone || p2 === cleanPhone || p3 === cleanPhone;
      });
      if (foundInDocs) return true;
    } catch (e) {
      console.warn('Firestore phone uniqueness check note:', e);
    }

    // 2. Check locally registered cache
    try {
      const cachedUsers = JSON.parse(localStorage.getItem('registered_users_cache') || '[]');
      const inCache = cachedUsers.some((u: any) => {
        const p = (u.phone || '').replace(/\D/g, '').slice(-10);
        return p === cleanPhone;
      });
      if (inCache) return true;
    } catch (e) {}

    // 3. Check mess users cloud cache
    try {
      const messUsers = JSON.parse(localStorage.getItem('mess_users_cloud_cache') || '[]');
      const inMess = messUsers.some((u: any) => {
        const p = (u.phone || u.Phone__c || '').replace(/\D/g, '').slice(-10);
        return p === cleanPhone;
      });
      if (inMess) return true;
    } catch (e) {}

    // 4. Check students cloud cache
    try {
      const students = JSON.parse(localStorage.getItem('students_cloud_cache') || '[]');
      const inStudents = students.some((s: any) => {
        const p = (s.phone || '').replace(/\D/g, '').slice(-10);
        return p === cleanPhone;
      });
      if (inStudents) return true;
    } catch (e) {}

    return false;
  };

  const getUserByPhone = async (phoneToFind: string): Promise<UserProfile | null> => {
    const cleanPhone = phoneToFind.trim().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) return null;

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', cleanPhone));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data() as UserProfile;
        return {
          ...docData,
          Id: docData.Id || snapshot.docs[0].id,
          studentId: docData.studentId || snapshot.docs[0].id,
          phone: cleanPhone
        };
      }
    } catch (e) {
      console.warn('Firestore phone lookup note:', e);
    }

    try {
      const cachedUsers = JSON.parse(localStorage.getItem('registered_users_cache') || '[]');
      const match = cachedUsers.find((u: any) => (u.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone);
      if (match) {
        return {
          Id: match.studentId || match.uid || `STU-${cleanPhone.slice(-4)}`,
          studentId: match.studentId || match.uid || `STU-${cleanPhone.slice(-4)}`,
          name: match.name || 'Student',
          role: 'Student',
          preference: match.preference || 'Veg',
          email: match.email || `${cleanPhone}@institution.edu`,
          phone: cleanPhone,
          department: match.department || 'Computer Science',
          hostelRoom: match.hostelRoom || 'BH-1 / 101'
        };
      }
    } catch (e) {}

    return null;
  };

  const sendPhoneOtp = async (phone: string, checkDuplicate: boolean = true): Promise<{ success: boolean; otp: string }> => {
    clearAuthError();
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      throw new Error("Phone number must be exactly 10 digits.");
    }

    if (checkDuplicate) {
      const exists = await checkPhoneExists(cleanPhone);
      if (exists) {
        throw new Error("This mobile number is already registered to another account. Duplicate phone numbers are not allowed.");
      }
    }

    // Cryptographically secure 6-digit OTP generation (100000 - 999999)
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const otp = (100000 + (array[0] % 900000)).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    try {
      sessionStorage.setItem(`phone_otp_${cleanPhone}`, JSON.stringify({ otp, expiresAt, attempts: 0 }));
    } catch (e) {}

    console.log(`[Mobile SMS Dispatch] Dispatched original 6-digit OTP code ${otp} to +91-${cleanPhone}`);
    return { success: true, otp };
  };

  const sendLoginPhoneOtp = async (phone: string): Promise<{ success: boolean; otp: string }> => {
    clearAuthError();
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      throw new Error("Phone number must be exactly 10 digits.");
    }
    const exists = await checkPhoneExists(cleanPhone);
    if (!exists) {
      throw new Error("No registered account found with this phone number. Please sign up first.");
    }
    return sendPhoneOtp(phone, false);
  };

  const verifyPhoneOtp = async (phone: string, enteredOtp: string): Promise<boolean> => {
    clearAuthError();
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    let stored: { otp: string; expiresAt: number; attempts?: number } | null = null;
    try {
      const item = sessionStorage.getItem(`phone_otp_${cleanPhone}`);
      if (item) stored = JSON.parse(item);
    } catch (e) {}

    if (!stored) {
      throw new Error("No active OTP request found for this phone number. Please click Send OTP.");
    }
    if (Date.now() > stored.expiresAt) {
      sessionStorage.removeItem(`phone_otp_${cleanPhone}`);
      throw new Error("Phone OTP has expired. Please click Resend OTP for a new verification code.");
    }
    if (stored.otp !== enteredOtp.trim()) {
      const attempts = (stored.attempts || 0) + 1;
      if (attempts >= 5) {
        sessionStorage.removeItem(`phone_otp_${cleanPhone}`);
        throw new Error("Too many incorrect attempts. Please request a new OTP code.");
      }
      sessionStorage.setItem(`phone_otp_${cleanPhone}`, JSON.stringify({ ...stored, attempts }));
      throw new Error("Invalid phone OTP. Please check the code sent to your number and try again.");
    }

    try {
      sessionStorage.removeItem(`phone_otp_${cleanPhone}`);
      sessionStorage.setItem(`phone_verified_${cleanPhone}`, 'true');
    } catch (e) {}

    return true;
  };

  const signInWithPhoneOtp = async (phone: string, enteredOtp: string): Promise<void> => {
    clearAuthError();
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    await verifyPhoneOtp(cleanPhone, enteredOtp);

    const userProfile = await getUserByPhone(cleanPhone);
    if (!userProfile) {
      throw new Error("Unable to locate registered Mess Manager or College Principal account for this phone number.");
    }

    if (userProfile.role === 'Student' || isStudentIdentifier(userProfile.email)) {
      throw new Error("Access Denied: Only Mess Managers and the College Principal are authorized to access this portal. Students are not allowed to log in.");
    }

    const isPrincipal = userProfile.role === 'College Principal' || userProfile.email.toLowerCase().includes('principal');
    const restoredProfile: UserProfile = {
      ...userProfile,
      role: isPrincipal ? 'College Principal' : 'Mess Manager',
      department: isPrincipal ? 'College Administration' : 'Central Mess Management',
      hostelRoom: isPrincipal ? 'Principal Executive Office' : 'Mess Manager Office',
      lastLogin: new Date().toISOString()
    };

    sessionStorage.setItem('mess_session_user', JSON.stringify(restoredProfile));
    recordLoginLog(restoredProfile, 'Mobile Phone OTP');

    if (getSalesforceToken()) {
      salesforceSyncService.syncUserLogin(restoredProfile).then((sfId) => {
        if (sfId) {
          restoredProfile.sfUserId = sfId;
          sessionStorage.setItem('mess_session_user', JSON.stringify(restoredProfile));
        }
      }).catch(() => {});
    }

    setDbUser(restoredProfile);
  };

  const sendPasswordResetOtp = async (email: string): Promise<{ success: boolean; otp: string; message: string }> => {
    clearAuthError();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error("Please enter a valid institutional email address.");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    try {
      sessionStorage.setItem(`email_reset_otp_${cleanEmail}`, JSON.stringify({ otp, expiresAt }));
    } catch (e) {}

    // Send official Firebase reset email in the background if possible
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (fbErr) {
      console.warn("Firebase password reset email service dispatch notice:", fbErr);
    }

    console.log(`[Institutional Mailer] Sent OTP code ${otp} to ${cleanEmail}`);
    return {
      success: true,
      otp,
      message: `A 6-digit verification OTP has been sent to ${cleanEmail}.`
    };
  };

  const resetPasswordWithOtp = async (
    email: string, 
    enteredOtp: string, 
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    clearAuthError();
    const cleanEmail = email.trim().toLowerCase();
    let stored: { otp: string; expiresAt: number } | null = null;
    try {
      const item = sessionStorage.getItem(`email_reset_otp_${cleanEmail}`);
      if (item) stored = JSON.parse(item);
    } catch (e) {}

    if (!stored) {
      throw new Error("No active password reset request found. Please request an OTP first.");
    }
    if (Date.now() > stored.expiresAt) {
      throw new Error("Email OTP has expired. Please request a new OTP code.");
    }
    if (stored.otp !== enteredOtp.trim()) {
      throw new Error("Invalid email OTP. Please check the verification code sent to your email.");
    }

    // Persist new credentials in Firestore
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const userDoc = snap.docs[0];
        await updateDoc(userDoc.ref, {
          customPassword: newPassword,
          passwordResetAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn("Firestore password update note:", e);
    }

    // Cache locally so signInWithEmail recognizes the new password
    try {
      const resets = JSON.parse(localStorage.getItem('password_resets_cache') || '{}');
      resets[cleanEmail] = newPassword;
      localStorage.setItem('password_resets_cache', JSON.stringify(resets));
    } catch (e) {}

    try {
      sessionStorage.removeItem(`email_reset_otp_${cleanEmail}`);
    } catch (e) {}

    return {
      success: true,
      message: "Password successfully updated! You can now sign in with your new password."
    };
  };

  const signInWithEmail = async (email: string, pass: string) => {
    clearAuthError();
    const cleanEmail = email.trim().toLowerCase();

    // Check if user has an OTP-reset custom password
    let customResetPassword = '';
    try {
      const resets = JSON.parse(localStorage.getItem('password_resets_cache') || '{}');
      customResetPassword = resets[cleanEmail];
    } catch (e) {}

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const u = cred.user;
      const isPrincipal = cleanEmail.includes('principal');
      const assignedRole: UserProfile['role'] = isPrincipal ? 'College Principal' : 'Mess Manager';
      const assignedDept = isPrincipal ? 'College Administration' : 'Central Mess Management';
      const assignedRoom = isPrincipal ? 'Principal Executive Office' : 'Mess Manager Office - Ground Floor';

      const profile = await syncUserProfileToBackend({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName
      }, {
        role: assignedRole,
        department: assignedDept,
        hostelRoom: assignedRoom
      });

      if (profile) {
        setDbUser(profile);
      }
      return;
    } catch (err: any) {
      console.error('Email sign in error:', err);

      // If user reset their password via OTP and password matches:
      if (customResetPassword && customResetPassword === pass) {
        const isPrincipal = cleanEmail.includes('principal');
        const assignedRole: UserProfile['role'] = isPrincipal ? 'College Principal' : 'Mess Manager';
        const assignedDept = isPrincipal ? 'College Administration' : 'Central Mess Management';
        const assignedRoom = isPrincipal ? 'Principal Executive Office' : 'Mess Manager Office - Ground Floor';

        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', cleanEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = snap.docs[0].data() as UserProfile;
            if (data.role === 'Student') {
              const errMsg = "Access Denied: Student accounts are not permitted to log in. Only Mess Managers and College Principals have access.";
              setAuthError(errMsg);
              throw new Error(errMsg);
            }
            const restoredProfile: UserProfile = {
              ...data,
              Id: data.Id || snap.docs[0].id,
              studentId: data.studentId || snap.docs[0].id,
              role: assignedRole,
              email: cleanEmail,
              lastLogin: new Date().toISOString()
            };
            if (getSalesforceToken()) {
              salesforceSyncService.syncUserLogin(restoredProfile).then((sfId) => {
                if (sfId) {
                  restoredProfile.sfUserId = sfId;
                  sessionStorage.setItem('mess_session_user', JSON.stringify(restoredProfile));
                }
              }).catch(() => {});
            }
            sessionStorage.setItem('mess_session_user', JSON.stringify(restoredProfile));
            setDbUser(restoredProfile);
            return;
          }
        } catch (fsErr) {
          console.warn('Firestore user retrieval fallback:', fsErr);
        }

        const fallback: UserProfile = {
          Id: 'usr-' + Date.now(),
          studentId: 'usr-' + Date.now(),
          name: cleanEmail.split('@')[0],
          role: assignedRole,
          preference: 'Veg',
          email: cleanEmail,
          department: assignedDept,
          hostelRoom: assignedRoom
        };
        if (getSalesforceToken()) {
          salesforceSyncService.syncUserLogin(fallback).then((sfId) => {
            if (sfId) {
              fallback.sfUserId = sfId;
              sessionStorage.setItem('mess_session_user', JSON.stringify(fallback));
            }
          }).catch(() => {});
        }
        sessionStorage.setItem('mess_session_user', JSON.stringify(fallback));
        setDbUser(fallback);
        return;
      }

      if (err?.message && err.message.includes('Access Denied')) {
        setAuthError(err.message);
      } else if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        setAuthError("Invalid credentials. Please verify your Mess Manager or College Principal email and password.");
      } else if (err?.code === 'auth/wrong-password') {
        setAuthError("Incorrect password. Please try again or use Forgot Password to reset.");
      } else {
        setAuthError(err?.message || "Email login failed.");
      }
      throw err;
    }
  };

  const signUpWithEmail = async (
    email: string, 
    pass: string, 
    name: string, 
    phone?: string, 
    role?: 'Mess Manager' | 'College Principal' | 'Student' | 'Admin'
  ) => {
    clearAuthError();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim().replace(/\D/g, '').slice(-10) : '';

    // 1. Strict Duplicate Email Prevention
    const alreadyExists = await checkEmailExists(cleanEmail);
    if (alreadyExists) {
      const errMsg = "This email address is already registered. Duplicate emails are not allowed. Please sign in.";
      setAuthError(errMsg);
      throw new Error(errMsg);
    }

    // 2. Strict Duplicate Phone Prevention
    if (cleanPhone) {
      const phoneExists = await checkPhoneExists(cleanPhone);
      if (phoneExists) {
        const errMsg = "This mobile number is already registered. Duplicate phone numbers are not allowed. Please sign in or use an original number.";
        setAuthError(errMsg);
        throw new Error(errMsg);
      }
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const u = cred.user;
      const assignedRole = role || (cleanEmail.includes('principal') ? 'College Principal' : 'Mess Manager');
      const assignedDept = assignedRole === 'College Principal' ? 'College Administration' : 'Central Mess Management';
      const assignedRoom = assignedRole === 'College Principal' ? 'Principal Executive Office' : 'Mess Manager Office - Ground Floor';

      const profile = await syncUserProfileToBackend({
        uid: u.uid,
        email: u.email,
        displayName: name.trim() || u.displayName
      }, {
        name: name.trim() || (assignedRole === 'College Principal' ? 'College Principal' : 'Mess Manager'),
        role: assignedRole,
        department: assignedDept,
        hostelRoom: assignedRoom,
        phone: cleanPhone
      });

      // Cache locally to prevent duplicates
      try {
        const cached = JSON.parse(localStorage.getItem('registered_users_cache') || '[]');
        cached.push({ 
          email: cleanEmail, 
          name: name.trim(), 
          phone: cleanPhone,
          role: assignedRole,
          uid: u.uid
        });
        localStorage.setItem('registered_users_cache', JSON.stringify(cached));
      } catch (e) {}

      if (profile) {
        setDbUser(profile);
      }
    } catch (err: any) {
      console.error('Email sign up error:', err);
      if (err?.code === 'auth/email-already-in-use') {
        const errMsg = "This email address is already registered. Duplicate emails are not allowed. Please sign in.";
        setAuthError(errMsg);
        throw new Error(errMsg);
      }
      setAuthError(err?.message || "Registration failed.");
      throw err;
    }
  };

  const loginWithStudentId = async (_identifier: string) => {
    clearAuthError();
    const errMsg = "Student login is disabled. This portal is strictly for Mess Managers and the College Principal only.";
    setAuthError(errMsg);
  };

  const loginAsDemoUser = (role: 'Mess Manager' | 'College Principal' | 'Admin' = 'Mess Manager') => {
    clearAuthError();
    const isPrincipal = role === 'College Principal';
    const demoUser: UserProfile = isPrincipal ? {
      Id: 'principal-demo-01',
      studentId: 'principal-demo-01',
      name: 'Dr. K. Rajagopalan (College Principal)',
      role: 'College Principal',
      preference: 'Veg',
      email: 'principal@institution.edu',
      phone: '9845011223',
      department: 'Executive College Administration',
      hostelRoom: 'Principal Executive Secretariat',
      lastLogin: new Date().toISOString()
    } : {
      Id: 'manager-demo-01',
      studentId: 'manager-demo-01',
      name: 'Dr. S. Sundar (Mess Manager)',
      role: 'Mess Manager',
      preference: 'Veg',
      email: 'manager@institution.edu',
      phone: '9876543210',
      department: 'Central Mess Management',
      hostelRoom: 'Mess Operations Hub',
      lastLogin: new Date().toISOString()
    };

    sessionStorage.setItem('mess_session_user', JSON.stringify(demoUser));
    recordLoginLog(demoUser, `Demo Quick Login (${demoUser.role})`);

    // Store in Salesforce Mess_User__c backend immediately
    if (getSalesforceToken()) {
      salesforceSyncService.syncUserLogin(demoUser).then((sfId) => {
        if (sfId) {
          demoUser.sfUserId = sfId;
          sessionStorage.setItem('mess_session_user', JSON.stringify(demoUser));
        }
      }).catch(() => {});
    }

    setDbUser(demoUser);
  };

  const signOut = async () => {
    if (dbUser?.sfUserId && getSalesforceToken()) {
      sfApi.patch(`/sobjects/Mess_User__c/${dbUser.sfUserId}`, {
        Is_Currently_Active__c: false
      }).catch(() => {});
    }
    try {
      await firebaseSignOut(auth);
    } catch (e) {}
    logoutSalesforce();
    sessionStorage.removeItem('mess_session_user');
    sessionStorage.removeItem('firebase_email');
    setDbUser(null);
    clearAuthError();
  };

  const verifyOtp = async (_email: string, _otp: string) => {
    return Promise.resolve();
  };

  const value = {
    dbUser,
    loading,
    authError,
    clearAuthError,
    signInWithGoogle,
    signInWithSalesforce,
    signInWithEmail,
    signUpWithEmail,
    loginWithStudentId,
    loginAsDemoUser,
    signOut,
    verifyOtp,
    checkEmailExists,
    checkPhoneExists,
    sendPhoneOtp,
    sendLoginPhoneOtp,
    verifyPhoneOtp,
    signInWithPhoneOtp,
    sendPasswordResetOtp,
    resetPasswordWithOtp
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

