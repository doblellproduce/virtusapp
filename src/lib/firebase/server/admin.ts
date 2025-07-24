
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// Prepare service account credentials
// This replaces escaped newlines in the private key with actual newlines
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let adminApp: App;
let adminAuth: Auth;
let adminDB: Firestore;
let adminStorage: Storage;

// A unique name for the admin app to avoid conflicts if multiple apps are initialized.
const adminAppName = 'firebase-admin-app-server-nodegit';

// Initialize the app only if it doesn't already exist to prevent re-initialization errors.
if (getApps().some(app => app.name === adminAppName)) {
    adminApp = getApps().find(app => app.name === adminAppName)!;
} else {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: `${serviceAccount.projectId}.appspot.com`,
    }, adminAppName);
}

// Export the initialized services for use in server-side functions and API routes.
adminAuth = getAuth(adminApp);
adminDB = getFirestore(adminApp);
adminStorage = getStorage(adminApp);

export { adminApp, adminAuth, adminDB, adminStorage };
