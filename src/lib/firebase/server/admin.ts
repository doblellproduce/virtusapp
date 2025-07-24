
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

const serviceAccount = {
  projectId,
  clientEmail,
  privateKey,
};

if (getApps().length === 0) {
  if (privateKey && clientEmail && projectId) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    console.warn("Firebase Admin credentials are not fully set in environment variables. Server-side functionality will be limited.");
    adminApp = initializeApp();
  }
} else {
    adminApp = getApps()[0];
}

adminAuth = getAuth(adminApp);
adminDB = getFirestore(adminApp);
adminStorage = getStorage(adminApp);

export { adminApp, adminAuth, adminDB, adminStorage };
