import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '../firebase/config';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithStudentId: (identifier: string) => Promise<void>;
  loginAsDemoUser: (role?: 'Admin' | 'Student') => void;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
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

  const signInWithEmail = async (email: string, pass: string) => {
    clearAuthError();
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
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
    } catch (err: any) {
      console.error('Email sign in error:', err);
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        setAuthError("Invalid email or password. You can also sign up or use Demo Login.");
      } else if (err?.code === 'auth/wrong-password') {
        setAuthError("Incorrect password. Please try again.");
      } else {
        setAuthError(err?.message || "Email login failed.");
      }
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    clearAuthError();
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const u = cred.user;
      const profile = await syncUserProfileToBackend({
        uid: u.uid,
        email: u.email,
        displayName: name.trim() || u.displayName
      }, {
        name: name.trim() || u.email?.split('@')[0] || 'Student',
        role: 'Student',
        department: 'Computer Science',
        hostelRoom: 'BH-1 / 101'
      });

      if (profile) {
        setDbUser(profile);
      }
    } catch (err: any) {
      console.error('Email sign up error:', err);
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
    verifyOtp
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

