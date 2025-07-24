
// This file is intended for client-side Firebase initialization and exports.
// It should NOT contain any server-side code, like the Firebase Admin SDK.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// This is the public Firebase config for the client-side
const firebaseConfig = {
  apiKey: "AIzaSyDP17qEn4eiVR5vxLcv1BP7RckFDULT5ZI",
  authDomain: "virtus-vehicle-vision.firebaseapp.com",
  projectId: "virtus-vehicle-vision",
  storageBucket: "virtus-vehicle-vision.appspot.com",
  messagingSenderId: "279152122801",
  appId: "1:279152122801:web:4462583277d2e5b92a7b90"
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
