
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';

// Explicitly check for environment variables at the start.
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Firebase Admin SDK is not configured. Please check your environment variables: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are required."
  );
}

const serviceAccount = {
  projectId,
  clientEmail,
  // The replace call is crucial for converting the escaped newlines from the environment variable.
  privateKey: privateKey.replace(/\\n/g, '\n'),
};

let adminApp: App | null = null;

export function getFirebaseAdminApp() {
  if (adminApp) {
    return adminApp;
  }

  // Ensure we don't initialize the app multiple times
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }
  
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: `${projectId}.appspot.com`,
  });

  return adminApp;
}
