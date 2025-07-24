
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let adminApp: App;
let adminAuth: Auth;
let adminDB: Firestore;
let adminStorage: Storage;

try {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
  } else {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: `${serviceAccount.projectId}.appspot.com`,
    });
  }

  adminAuth = getAuth(adminApp);
  adminDB = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);

} catch (error) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Firebase Admin SDK not initialized. This is expected in a client-side context.');
  } else {
    console.error("Firebase Admin SDK initialization error:", error);
  }
  // Set to any to avoid type errors in modules that import them
  adminApp = {} as any;
  adminAuth = {} as any;
  adminDB = {} as any;
  adminStorage = {} as any;
}

export { adminApp, adminAuth, adminDB, adminStorage };
