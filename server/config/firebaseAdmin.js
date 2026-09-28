import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In production, we'd use a service account key environment variable containing the JSON.
// For local dev, we try to read serviceAccountKey.json from the project root.
const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase admin init error from ENV:', error);
  }
} else if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized from serviceAccountKey.json');
  } catch (error) {
    console.error('Firebase admin init error from file:', error);
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
