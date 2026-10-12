import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAeI-aNP79FSumBPgC7VfmWmRFKFzgNGpU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "digitalmesstoken.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "digitalmesstoken",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "digitalmesstoken.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "915641419226",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:915641419226:web:0847228764329df98cece3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9C7ZSX3Y7X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let analytics: any = null;
if (typeof window !== "undefined") {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };

