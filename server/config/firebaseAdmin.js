import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// In production, we'd use a service account key file path or environment variables containing the JSON.
// For now, let's just initialize using GOOGLE_APPLICATION_CREDENTIALS if available, or fake it for local dev.
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase admin init error:', error);
  }
} else {
  // Try to initialize without credentials to allow it to pick up default application credentials
  try {
    admin.initializeApp();
  } catch(e) {
    console.warn("Could not initialize Firebase Admin automatically.");
  }
}

export default admin;
