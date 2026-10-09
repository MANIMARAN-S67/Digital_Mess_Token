import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBKEXZK9rPC0ZN56AyFkzuZ72-032wg89k",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "digitalmesstoken.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "digitalmesstoken",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "digitalmesstoken.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "915641419226",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:915641419226:web:0847228764329df98cece3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9C7ZSX3Y7X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth };
