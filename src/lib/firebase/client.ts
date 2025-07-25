
// This file is intended for client-side Firebase initialization and exports.
// It should NOT contain any server-side code, like the Firebase Admin SDK.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// This is the public Firebase config for the client-side
// It is read from environment variables to ensure the correct configuration is used in different environments (local vs. Vercel).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Explicitly check for missing variables to provide a clear error message.
// This helps debug issues like the 400 Bad Request from Identity Toolkit.
Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (!value) {
        throw new Error(`Firebase client configuration error: Missing environment variable NEXT_PUBLIC_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
    }
});


// Initialize Firebase on the client-side
let app: FirebaseApp;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
