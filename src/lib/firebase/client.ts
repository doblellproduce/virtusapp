
// This file is intended for client-side Firebase initialization and exports.
// It should NOT contain any server-side code, like the Firebase Admin SDK.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// This is the public Firebase config for the client-side
const firebaseConfig = {
  "projectId": "virtus-vehicle-vision",
  "appId": "1:279152122801:web:4462583277d2e5b92a7b90",
  "storageBucket": "virtus-vehicle-vision.firebasestorage.app",
  "apiKey": "AIzaSyDP17qEn4eiVR5vxLcv1BP7RckFDULT5ZI",
  "authDomain": "virtus-vehicle-vision.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "279152122801"
};

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
