
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Explicitly check for environment variables at the start.
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// The replace call is crucial for converting the escaped newlines from the environment variable.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const serviceAccount = {
  projectId,
  clientEmail,
  privateKey,
};

let adminApp: App;

// Singleton pattern to ensure Firebase Admin is initialized only once.
if (!getApps().length) {
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin SDK is not configured. Please check your environment variables: " +
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are required."
    );
  }
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: `${projectId}.appspot.com`,
  });
} else {
  adminApp = getApps()[0];
}

// Export the initialized services
export const adminAuth = getAuth(adminApp);
export const adminDB = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
