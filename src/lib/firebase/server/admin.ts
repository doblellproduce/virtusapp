
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Correctly format the private key by replacing \\n with \n
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let adminApp: App;
let adminAuth: Auth;
let adminDB: Firestore;
let adminStorage: Storage;

if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: `${serviceAccount.projectId}.appspot.com`,
    });
} else {
    adminApp = getApps()[0];
}

adminAuth = getAuth(adminApp);
adminDB = getFirestore(adminApp);
adminStorage = getStorage(adminApp);

export { adminApp, adminAuth, adminDB, adminStorage };
