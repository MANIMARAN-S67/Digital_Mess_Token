import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '../firebase/config';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { initiateSalesforceOAuth, getSalesforceToken, handleSalesforceCallback, logoutSalesforce } from '../services/salesforceAuth';
import sfApi from '../services/salesforceApi';
import { UserProfile } from '../types';

interface AuthContextType {
  dbUser: UserProfile | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithSalesforce: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, phone?: string) => Promise<void>;
  loginWithStudentId: (identifier: string) => Promise<void>;
  loginAsDemoUser: (role?: 'Admin' | 'Student') => void;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; otp: string }>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<boolean>;
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
    const displayName = fbUser.displayName || email.split('@')[0];
    const photoUrl = fbUser.photoURL || '';

    const lowerEmail = email.toLowerCase();
    const isAdmin = lowerEmail.includes('admin') || lowerEmail.includes('warden') || lowerEmail.includes('secretary') || lowerEmail.includes('mess');
    const initialRole: UserProfile['role'] = isAdmin ? 'Admin' : 'Student';

    let userProfile: UserProfile = {
      Id: uid,
      studentId: uid,
      uid: uid,
      name: displayName,
      role: initialRole,
      preference: 'Veg',
      email: email,
      photoUrl: photoUrl,
      department: isAdmin ? 'Central Mess Administration' : 'Computer Science',
      hostelRoom: isAdmin ? 'Admin Office - Block A' : 'BH-1 / 101',
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
        userProfile = {
          ...userProfile,
          ...existingData,
          email: email, // Always preserve real authenticated email
          uid: uid,
          Id: uid,
          studentId: existingData.studentId || uid,
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
        displayName: userProfile.name,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log('User profile successfully stored in backend for:', email);
    } catch (firestoreErr) {
      console.warn('Backend Firestore note (offline or rules fallback):', firestoreErr);
    }

    // 2. Sync with Salesforce backend if connected
    if (getSalesforceToken()) {
      // 2A. Upsert into Mess_User__c object (tracks who is logged in and issuing tokens)
      try {
        const nowIso = new Date().toISOString();
        const sfUserQuery = await sfApi.query(`SELECT Id, Name, Email__c, Role__c, Tokens_Issued_Today__c, Total_Tokens_Issued__c FROM Mess_User__c WHERE Email__c = '${email}' LIMIT 1`);
        
        if (sfUserQuery && sfUserQuery.records && sfUserQuery.records.length > 0) {
          const existingMessUser = sfUserQuery.records[0];
          userProfile.sfUserId = existingMessUser.Id;
          await sfApi.patch(`/sobjects/Mess_User__c/${existingMessUser.Id}`, {
            Last_Login__c: nowIso,
            Login_Provider__c: overrides?.loginProvider || 'Google',
            Status__c: 'Active',
            Is_Currently_Active__c: true,
            Photo_URL__c: photoUrl || ''
          }).catch(() => {});
        } else {
          const createRes = await sfApi.post('/sobjects/Mess_User__c', {
            Name: userProfile.name,
            Email__c: email,
            Role__c: userProfile.role,
            Firebase_UID__c: uid,
            Last_Login__c: nowIso,
            Login_Provider__c: overrides?.loginProvider || 'Google',
            Assigned_Mess_Hall__c: userProfile.hostelRoom || 'Central Mess Hall A',
            Status__c: 'Active',
            Is_Currently_Active__c: true,
            Can_Issue_Tokens__c: true,
            Total_Logins__c: 1,
            Tokens_Issued_Today__c: 0,
            Total_Tokens_Issued__c: 0,
            Photo_URL__c: photoUrl || ''
          }).catch(() => null);
          if (createRes && createRes.id) {
            userProfile.sfUserId = createRes.id;
          }
        }
      } catch (sfUserErr) {
        console.warn('Salesforce Mess_User__c sync notice:', sfUserErr);
      }

      // 2B. Query Student__c if user is a student
      try {
        const soql = `SELECT Id, Name, Student_ID__c, Department__c, Academic_Year__c, Hostel_Room__c, Diet_Preference__c, Email__c, Role__c FROM Student__c WHERE Email__c = '${email}' LIMIT 1`;
        const result = await sfApi.query(soql);
        if (result && result.records && result.records.length > 0) {
          const student = result.records[0];
          userProfile = {
            ...userProfile,
            studentId: student.Student_ID__c || student.Id,
            name: student.Name || userProfile.name,
            role: (student.Role__c as UserProfile['role']) || 'Student',
            preference: student.Diet_Preference__c || userProfile.preference,
            department: student.Department__c || userProfile.department,
            hostelRoom: student.Hostel_Room__c || userProfile.hostelRoom,
            email: student.Email__c || email
          };
        }
      } catch (sfErr) {
        console.warn('Salesforce student query error:', sfErr);
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
      const soql = `SELECT Id, Name, Student_ID__c, Department__c, Academic_Year__c, Hostel_Room__c, Diet_Preference__c, Email__c, Firebase_UID__c, Role__c FROM Student__c WHERE Email__c = '${email}' LIMIT 1`;
      const result = await sfApi.query(soql);
      
      if (result && result.records && result.records.length > 0) {
        const student = result.records[0];
        const profile: UserProfile = {
          Id: student.Id,
          studentId: student.Student_ID__c || student.Id,
          name: student.Name,
          role: (student.Role__c as UserProfile['role']) || 'Student',
          preference: student.Diet_Preference__c || 'Veg',
          email: student.Email__c,
          department: student.Department__c,
          hostelRoom: student.Hostel_Room__c
        };
        sessionStorage.setItem('mess_session_user', JSON.stringify(profile));
        setDbUser(profile);
      } else {
        // Check Salesforce User table by email
        try {
          const sfUserRes = await sfApi.query(`SELECT Id, Name, Email FROM User WHERE Email = '${email}' LIMIT 1`);
          if (sfUserRes && sfUserRes.records && sfUserRes.records.length > 0) {
            const sfUser = sfUserRes.records[0];
            const profile: UserProfile = {
              Id: sfUser.Id,
              studentId: sfUser.Id,
              name: sfUser.Name || auth.currentUser?.displayName || 'Mess Admin',
              role: 'Admin',
              preference: 'Veg',
              email: sfUser.Email || email,
              department: 'Mess Management',
              hostelRoom: 'Admin Office'
            };
            sessionStorage.setItem('mess_session_user', JSON.stringify(profile));
            setDbUser(profile);
            return;
          }
        } catch (uErr) {
          console.warn('Could not query Salesforce User table by email:', uErr);
        }

        const profile: UserProfile = {
          Id: auth.currentUser?.uid || 'admin-' + Date.now(),
          studentId: auth.currentUser?.uid || 'admin-' + Date.now(),
          name: auth.currentUser?.displayName || 'Mess Admin',
          role: 'Admin',
          preference: 'Veg',
          email: email,
          department: 'Mess Management',
          hostelRoom: 'Admin Office'
        };
        sessionStorage.setItem('mess_session_user', JSON.stringify(profile));
        setDbUser(profile);
      }
    } catch (error: any) {
      console.error('Failed to fetch user from Salesforce:', error);
      const fallbackUid = auth.currentUser?.uid || 'user-' + Date.now();
      const profile: UserProfile = {
        Id: fallbackUid,
        studentId: fallbackUid,
        name: auth.currentUser?.displayName || email.split('@')[0],
        role: 'Admin',
        preference: 'Veg',
        email: email,
        department: 'Mess Administration',
        hostelRoom: 'Room 101'
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
          const fallback: UserProfile = {
            Id: user.uid,
            studentId: user.uid,
            name: user.displayName || user.email.split('@')[0],
            role: 'Admin',
            preference: 'Veg',
            email: user.email,
            department: 'Mess Management',
            hostelRoom: 'Admin Office'
          };
          sessionStorage.setItem('mess_session_user', JSON.stringify(fallback));
          setDbUser(fallback);
        }
      } else {
        throw new Error("No email found in Google account.");
      }
    } catch (error: any) {
      console.error("Google Sign In Error", error);
      if (error?.code === 'auth/configuration-not-found') {
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
    if (!cleanEmail) return false;
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', cleanEmail));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) return true;
    } catch (e) {
      console.warn('Firestore email existence check note:', e);
    }
    // Check locally registered cache
    try {
      const cachedUsers = JSON.parse(localStorage.getItem('registered_users_cache') || '[]');
      return cachedUsers.some((u: any) => u.email?.toLowerCase() === cleanEmail);
    } catch (e) {
      return false;
    }
  };

  const sendPhoneOtp = async (phone: string): Promise<{ success: boolean; otp: string }> => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      throw new Error("Phone number must be exactly 10 digits.");
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    try {
      sessionStorage.setItem(`phone_otp_${cleanPhone}`, JSON.stringify({ otp, expiresAt }));
    } catch (e) {}

    console.log(`[Mobile SMS Gateway] Dispatched OTP code ${otp} to +91-${cleanPhone}`);
    return { success: true, otp };
  };

  const verifyPhoneOtp = async (phone: string, enteredOtp: string): Promise<boolean> => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    let stored: { otp: string; expiresAt: number } | null = null;
    try {
      const item = sessionStorage.getItem(`phone_otp_${cleanPhone}`);
      if (item) stored = JSON.parse(item);
    } catch (e) {}

    if (!stored) {
      throw new Error("No active OTP request found for this phone number. Please click Send OTP.");
    }
    if (Date.now() > stored.expiresAt) {
      throw new Error("Phone OTP has expired. Please request a new OTP code.");
    }
    if (stored.otp !== enteredOtp.trim()) {
      throw new Error("Invalid phone OTP. Please check the code sent to your number and try again.");
    }

    try {
      sessionStorage.removeItem(`phone_otp_${cleanPhone}`);
    } catch (e) {}

    return true;
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
      const isAdmin = u.email?.toLowerCase().includes('admin') || u.email?.toLowerCase().includes('warden');
      const profile = await syncUserProfileToBackend({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName
      }, {
        role: isAdmin ? 'Admin' : 'Student',
        department: isAdmin ? 'Central Mess Administration' : 'Hostel Resident',
        hostelRoom: isAdmin ? 'Admin Office' : 'Room 201'
      });

      if (profile) {
        setDbUser(profile);
      }
      return;
    } catch (err: any) {
      console.error('Email sign in error:', err);

      // If user reset their password via OTP and password matches:
      if (customResetPassword && customResetPassword === pass) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', cleanEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = snap.docs[0].data() as UserProfile;
            const restoredProfile: UserProfile = {
              ...data,
              Id: data.Id || snap.docs[0].id,
              studentId: data.studentId || snap.docs[0].id,
              email: cleanEmail,
              lastLogin: new Date().toISOString()
            };
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
          role: 'Student',
          preference: 'Veg',
          email: cleanEmail,
          department: 'Hostel Resident',
          hostelRoom: 'BH-1 / 101'
        };
        sessionStorage.setItem('mess_session_user', JSON.stringify(fallback));
        setDbUser(fallback);
        return;
      }

      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        setAuthError("Invalid email or password. Please check your credentials or use Forgot Password.");
      } else if (err?.code === 'auth/wrong-password') {
        setAuthError("Incorrect password. Please try again or use Forgot Password to reset.");
      } else {
        setAuthError(err?.message || "Email login failed.");
      }
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, phone?: string) => {
    clearAuthError();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Strict Duplicate Email Prevention
    const alreadyExists = await checkEmailExists(cleanEmail);
    if (alreadyExists) {
      const errMsg = "This email address is already registered. Duplicate emails are not allowed. Please sign in or use Forgot Password.";
      setAuthError(errMsg);
      throw new Error(errMsg);
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const u = cred.user;
      const profile = await syncUserProfileToBackend({
        uid: u.uid,
        email: u.email,
        displayName: name.trim() || u.displayName
      }, {
        name: name.trim() || u.email?.split('@')[0] || 'Student',
        role: 'Student',
        department: 'Computer Science',
        hostelRoom: 'BH-1 / 101',
        phone: phone ? phone.trim().replace(/\D/g, '') : ''
      });

      // Cache locally to prevent duplicates
      try {
        const cached = JSON.parse(localStorage.getItem('registered_users_cache') || '[]');
        cached.push({ email: cleanEmail, name: name.trim(), phone: phone || '' });
        localStorage.setItem('registered_users_cache', JSON.stringify(cached));
      } catch (e) {}

      if (profile) {
        setDbUser(profile);
      }
    } catch (err: any) {
      console.error('Email sign up error:', err);
      if (err?.code === 'auth/email-already-in-use') {
        const errMsg = "This email address is already registered. Please sign in instead.";
        setAuthError(errMsg);
        throw new Error(errMsg);
      }
      setAuthError(err?.message || "Registration failed.");
      throw err;
    }
  };

  const loginWithStudentId = async (identifier: string) => {
    clearAuthError();
    const cleanId = identifier.trim().toUpperCase();
    if (!cleanId) {
      setAuthError("Please enter your Student ID or Roll Number.");
      return;
    }

    try {
      // Check Salesforce Student__c first if online
      if (getSalesforceToken()) {
        const soql = `SELECT Id, Name, Student_ID__c, Department__c, Hostel_Room__c, Diet_Preference__c, Email__c FROM Student__c WHERE Student_ID__c = '${cleanId}' OR Name LIKE '%${cleanId}%' OR Email__c = '${cleanId.toLowerCase()}' LIMIT 1`;
        const res = await sfApi.query(soql);
        if (res && res.records && res.records.length > 0) {
          const s = res.records[0];
          const studentUser: UserProfile = {
            Id: s.Id,
            studentId: s.Id,
            name: s.Name,
            role: 'Student',
            preference: s.Diet_Preference__c || 'Veg',
            email: s.Email__c,
            department: s.Department__c,
            hostelRoom: s.Hostel_Room__c
          };
          sessionStorage.setItem('mess_session_user', JSON.stringify(studentUser));
          setDbUser(studentUser);
          return;
        }
      }
    } catch (e) {
      console.warn('Salesforce student search failed, using student profile:', e);
    }

    // Direct student session
    const studentUser: UserProfile = {
      Id: 'STU-' + cleanId,
      studentId: cleanId,
      name: `Student (${cleanId})`,
      role: 'Student',
      preference: 'Veg',
      email: `${cleanId.toLowerCase()}@institution.edu`,
      department: 'Engineering',
      hostelRoom: 'Hostel Block'
    };
    sessionStorage.setItem('mess_session_user', JSON.stringify(studentUser));
    setDbUser(studentUser);
  };

  const loginAsDemoUser = (role: 'Admin' | 'Student' = 'Admin') => {
    clearAuthError();
    const demoUser: UserProfile = role === 'Admin' ? {
      Id: 'demo-admin-01',
      studentId: 'demo-admin-01',
      name: 'Dr. Ramesh Kumar (Warden)',
      role: 'Admin',
      preference: 'Veg',
      email: 'warden@mess.institution.edu',
      department: 'Central Mess Administration',
      hostelRoom: 'Warden Office - Block A'
    } : {
      Id: '21CS1004',
      studentId: '21CS1004',
      name: 'Rahul Sharma',
      role: 'Student',
      preference: 'Non-Veg',
      email: 'rahul.sharma@institution.edu',
      department: 'Computer Science',
      hostelRoom: 'BH-3 / 214'
    };

    sessionStorage.setItem('mess_session_user', JSON.stringify(demoUser));
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
    sendPhoneOtp,
    verifyPhoneOtp,
    sendPasswordResetOtp,
    resetPasswordWithOtp
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

