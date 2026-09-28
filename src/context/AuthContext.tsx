import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebaseConfig';
import api from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  dbUser: any | null; // Salesforce User
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string) => Promise<void>;
  resetPassword: (e: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDbUser = async (token: string) => {
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDbUser(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user from DB:', error);
      setDbUser(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const token = await user.getIdToken();
        localStorage.setItem('auth_token', token);
        await fetchDbUser(token);
      } else {
        localStorage.removeItem('auth_token');
        setDbUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      localStorage.setItem('auth_token', token);
      await fetchDbUser(token);
    } catch (error) {
      console.error('Google Sign In Error', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    const token = await result.user.getIdToken();
    localStorage.setItem('auth_token', token);
    await fetchDbUser(token);
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const token = await result.user.getIdToken();
    localStorage.setItem('auth_token', token);
    await fetchDbUser(token);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    localStorage.removeItem('auth_token');
    setDbUser(null);
  };

  const value = {
    currentUser,
    dbUser,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
