
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// Define the service account credentials from environment variables.
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // The replace call is crucial for converting the escaped newlines from the environment variable.
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// A function to get the initialized Firebase Admin app.
// This implements the Singleton pattern to ensure the app is initialized only once.
function getFirebaseAdminApp(): App {
  // If an app is already initialized, return it.
  if (getApps().length > 0) {
    // This check is for Next.js dev mode which can cause multiple initializations.
    // In production, getApps() should be empty on first run.
    const existingApp = getApps().find(app => app.name === '[DEFAULT]');
    if (existingApp) {
        return existingApp;
    }
  }

  // Check if all required environment variables are present.
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error(
      "Firebase Admin SDK is not configured. Please check your environment variables: " +
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are required."
    );
  }

  // Initialize the Firebase Admin app.
  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: `${serviceAccount.projectId}.appspot.com`,
  });
}

// Export the admin app and its services.
// By calling the function here, we ensure that any module importing these
// will get a properly initialized service.
const adminApp: App = getFirebaseAdminApp();

export const adminAuth: Auth = getAuth(adminApp);
export const adminDB: Firestore = getFirestore(adminApp);
export const adminStorage