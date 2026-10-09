import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '../firebase/config';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { initiateSalesforceOAuth, getSalesforceToken, handleSalesforceCallback, logoutSalesforce } from '../services/salesforceAuth';
import sfApi from '../services/salesforceApi';

interface AuthContextType {
  dbUser: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
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

  const fetchSalesforceUser = async (email: string) => {
    try {
      const soql = `SELECT Id, Name, Student_ID__c, Department__c, Academic_Year__c, Hostel_Room__c, Diet_Preference__c, Email__c, Firebase_UID__c, Role__c FROM Student__c WHERE Email__c = '${email}' LIMIT 1`;
      const result = await sfApi.query(soql);
      
      if (result && result.records && result.records.length > 0) {
        const student = result.records[0];
        setDbUser({
          ...student,
          role: student.Role__c || 'Student', // Map for frontend
          studentId: student.Id,
          name: student.Name,
          preference: student.Diet_Preference__c,
          email: student.Email__c,
          department: student.Department__c,
          hostelRoom: student.Hostel_Room__c
        });
      } else {
        // Try checking if it's an admin (just check if email is admin for this prototype, or querying a different object)
        // For simplicity, if not a student, we will just reject per user requirements
        throw new Error('Your account is not registered in the mess system. Please contact the administrator.');
      }
    } catch (error: any) {
      console.error('Failed to fetch user from Salesforce:', error);
      logoutSalesforce();
      await firebaseSignOut(auth);
      setDbUser(null);
      alert(error.message || 'Error fetching user profile');
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
             // Try getting user from firebase directly if it was fast enough
             if (auth.currentUser && auth.currentUser.email) {
                await fetchSalesforceUser(auth.currentUser.email);
             }
          }
        } catch (error: any) {
          alert('Salesforce authentication failed. Please try again.');
          console.error(error);
        } finally {
          setLoading(false);
        }
        return;
      }

      const sfToken = getSalesforceToken();
      
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user && sfToken) {
          await fetchSalesforceUser(user.email || '');
        } else {
          setDbUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    handleAuth();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user.email) {
        await initiateSalesforceOAuth(user.email);
      } else {
        throw new Error("No email found in Google account.");
      }
    } catch (error: any) {
      console.error("Google Sign In Error", error);
      alert("Google Login failed. " + error.message);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    logoutSalesforce();
    setDbUser(null);
  };

  const verifyOtp = async (email: string, otp: string) => {
    // Mock implementation for TwoFactorScreen
    return Promise.resolve();
  };

  const value = {
    dbUser,
    loading,
    signInWithGoogle,
    signOut,
    verifyOtp
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
