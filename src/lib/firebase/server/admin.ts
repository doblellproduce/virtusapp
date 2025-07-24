
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;
let adminAuth: Auth;
let adminDB: Firestore;
let adminStorage: Storage;

const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Check if all required service account details are available
if (privateKey && clientEmail && projectId) {
  // Initialize app only if it hasn't been initialized yet
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    adminApp = getApps()[0];
  }
} else {
  // If credentials are not available, log a warning and use a default app instance
  // This might limit server-side capabilities but prevents the app from crashing.
  console.warn("Firebase Admin credentials are not fully set in environment variables. Server-side Firebase functionality will be limited.");
  if (getApps().length === 0) {
      adminApp = initializeApp();
  } else {
      adminApp = getApps()[0];
  }
}

adminAuth = getAuth(adminApp);
adminDB = getFirestore(adminApp);
adminStorage = getStorage(adminApp);

export { adminApp, adminAuth, adminDB, adminStorage };
