
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;
let adminAuth: Auth;
let adminDB: Firestore;
let adminStorage: Storage;

// Correctly format the private key by replacing \\n with \n.
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const serviceAccount = {
  projectId,
  clientEmail,
  privateKey,
};

if (getApps().length === 0) {
  // Ensure all credentials are present before trying to initialize
  if (privateKey && clientEmail && projectId) {
    adminApp = initializeApp({
      // Use the cert() helper to robustly create the credential object
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    // Warn if credentials are not set, which will cause runtime errors for auth-dependent server actions.
    console.warn("Firebase Admin credentials are not fully set in environment variables. Server-side functionality will be limited.");
    // Initialize without credentials as a fallback to prevent build crashes, though auth will fail.
    adminApp = initializeApp();
  }
} else {
    adminApp = getApps()[0];
}

adminAuth = getAuth(adminApp);
adminDB = getFirestore(adminApp);
adminStorage = getStorage(adminApp);

export { adminApp, adminAuth, adminDB, adminStorage };
