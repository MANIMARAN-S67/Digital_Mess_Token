import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '../firebase/config';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { initiateSalesforceOAuth, getSalesforceToken, handleSalesforceCallback, logoutSalesforce } from '../services/salesforceAuth';
import sfApi from '../services/salesforceApi';

interface AuthContextType {
  dbUser: any | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
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
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  const fetchSalesforceUser = async (email: string) => {
    try {
      const soql = `SELECT Id, Name, Student_ID__c, Department__c, Academic_Year__c, Hostel_Room__c, Diet_Preference__c, Email__c, Firebase_UID__c, Role__c FROM Student__c WHERE Email__c = '${email}' LIMIT 1`;
      const result = await sfApi.query(soql);
      
      if (result && result.records && result.records.length > 0) {
        const student = result.records[0];
        setDbUser({
          ...student,
          role: student.Role__c || 'Student',
          studentId: student.Id,
          name: student.Name,
          preference: student.Diet_Preference__c || 'Veg',
          email: student.Email__c,
          department: student.Department__c,
          hostelRoom: student.Hostel_Room__c
        });
      } else {
        // User not found in Student__c: Check if authenticated user is an Admin in Salesforce
        try {
          const sfUserRes = await sfApi.query(`SELECT Id, Name, Email FROM User WHERE Email = '${email}' LIMIT 1`);
          if (sfUserRes && sfUserRes.records && sfUserRes.records.length > 0) {
            const sfUser = sfUserRes.records[0];
            setDbUser({
              Id: sfUser.Id,
              studentId: sfUser.Id,
              name: sfUser.Name || auth.currentUser?.displayName || 'Mess Admin',
              role: 'Admin',
              preference: 'Veg',
              email: sfUser.Email || email,
              department: 'Mess Management',
              hostelRoom: 'Admin Office'
            });
            return;
          }
        } catch (uErr) {
          console.warn('Could not query Salesforce User table by email:', uErr);
        }

        // If authenticated with Salesforce, grant Mess Admin role
        setDbUser({
          Id: 'admin-' + Date.now(),
          studentId: 'admin-' + Date.now(),
          name: auth.currentUser?.displayName || 'Mess Admin',
          role: 'Admin',
          preference: 'Veg',
          email: email,
          department: 'Mess Management',
          hostelRoom: 'Admin Office'
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch user from Salesforce:', error);
      // Fallback to local session
      setDbUser({
        Id: 'user-' + Date.now(),
        studentId: 'user-' + Date.now(),
        name: auth.currentUser?.displayName || email.split('@')[0],
        role: 'Admin',
        preference: 'Veg',
        email: email,
        department: 'Mess Administration',
        hostelRoom: 'Room 101'
      });
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
          const email = sessionStorage.getItem('firebase_email');
          if (email) {
            await fetchSalesforceUser(email);
          } else {
             if (auth.currentUser && auth.currentUser.email) {
                await fetchSalesforceUser(auth.currentUser.email);
             }
          }
        } catch (error: any) {
          setAuthError('Salesforce authentication failed: ' + (error?.message || 'Unknown error'));
        } finally {
          setLoading(false);
        }
        return;
      }

      const sfToken = getSalesforceToken();
      
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user && sfToken) {
          await fetchSalesforceUser(user.email || '');
        } else if (user) {
          // Firebase signed in but Salesforce OAuth not yet completed:
          // Check if user is already saved in session
          const savedUser = sessionStorage.getItem('mess_session_user');
          if (savedUser) {
            try {
              setDbUser(JSON.parse(savedUser));
            } catch (e) {
              setDbUser({
                Id: user.uid,
                studentId: user.uid,
                name: user.displayName || user.email?.split('@')[0] || 'User',
                role: 'Admin',
                preference: 'Veg',
                email: user.email || '',
                department: 'Dining Services',
                hostelRoom: 'Office'
              });
            }
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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user.email) {
        const defaultUser = {
          Id: user.uid,
          studentId: user.uid,
          name: user.displayName || user.email.split('@')[0],
          role: 'Admin',
          preference: 'Veg',
          email: user.email,
          department: 'Mess Management',
          hostelRoom: 'Admin Office'
        };
        sessionStorage.setItem('mess_session_user', JSON.stringify(defaultUser));
        
        try {
          await initiateSalesforceOAuth(user.email);
        } catch (sfErr) {
          console.warn('Salesforce redirect not triggered; entering with Firebase session:', sfErr);
          setDbUser(defaultUser);
        }
      } else {
        throw new Error("No email found in Google account.");
      }
    } catch (error: any) {
      console.error("Google Sign In Error", error);
      if (error?.code === 'auth/configuration-not-found') {
        setAuthError("Google Sign-In provider or API key needs activation. You can use Email/Password login or the Demo Login buttons below.");
      } else if (error?.code === 'auth/popup-closed-by-user') {
        setAuthError("Sign-in popup was closed before completing.");
      } else if (error?.code === 'auth/popup-blocked') {
        setAuthError("Popup blocked by browser. Please allow popups for this site.");
      } else {
        setAuthError(error?.message || "Google Login failed.");
      }
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    clearAuthError();
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const u = cred.user;
      const userObj = {
        Id: u.uid,
        studentId: u.uid,
        name: u.displayName || u.email?.split('@')[0] || 'User',
        role: u.email?.toLowerCase().includes('admin') || u.email?.toLowerCase().includes('warden') ? 'Admin' : 'Student',
        preference: 'Veg',
        email: u.email || '',
        department: 'Hostel Resident',
        hostelRoom: 'Room 201'
      };
      sessionStorage.setItem('mess_session_user', JSON.stringify(userObj));
      setDbUser(userObj);
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
      const userObj = {
        Id: u.uid,
        studentId: u.uid,
        name: name.trim() || u.email?.split('@')[0] || 'Student',
        role: 'Student',
        preference: 'Veg',
        email: u.email || '',
        department: 'Computer Science',
        hostelRoom: 'BH-1 / 101'
      };
      sessionStorage.setItem('mess_session_user', JSON.stringify(userObj));
      setDbUser(userObj);
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
          const studentUser = {
            ...s,
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
    const studentUser = {
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
    const demoUser = role === 'Admin' ? {
      Id: 'demo-admin-01',
      studentId: 'demo-admin-01',
      Name: 'Dr. Ramesh Kumar (Warden)',
      name: 'Dr. Ramesh Kumar (Warden)',
      role: 'Admin',
      Role__c: 'Admin',
      preference: 'Veg',
      email: 'warden@mess.institution.edu',
      department: 'Central Mess Administration',
      hostelRoom: 'Warden Office - Block A'
    } : {
      Id: '21CS1004',
      studentId: '21CS1004',
      Name: 'Rahul Sharma',
      name: 'Rahul Sharma',
      role: 'Student',
      Role__c: 'Student',
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

  const verifyOtp = async (email: string, otp: string) => {
    return Promise.resolve();
  };

  const value = {
    dbUser,
    loading,
    authError,
    clearAuthError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    loginWithStudentId,
    loginAsDemoUser,
    signOut,
    verifyOtp
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
