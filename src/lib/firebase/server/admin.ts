
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;
let adminAuth: Auth;
let adminDB: Firestore;
let adminStorage: Storage;

// Correctly format the private key by replacing \\n with \n, and handle if it's undefined.
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (getApps().length === 0) {
  if (privateKey && clientEmail && projectId) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    // For local development or environments where server-side auth isn't needed,
    // you might want to initialize without credentials, though this will limit functionality.
    // Or throw an error to ensure config is always present.
    console.warn("Firebase Admin credentials are not fully set in environment variables. Server-side auth will be limited.");
    // As a fallback for the app not to crash during build, but it will fail on auth requests
    adminApp = initializeApp();
  }
} else {
    adminApp = getApps()[0];
}

adminAuth = getAuth(adminApp);
adminDB = getFirestore(adminApp);
adminStorage = getStorage(adminApp);

export { adminApp, adminAuth, adminDB, adminStorage };
