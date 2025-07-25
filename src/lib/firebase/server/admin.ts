
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;

if (!getApps().length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
        throw new Error("Firebase Admin credentials are not fully set in environment variables.");
    }

    adminApp = initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
} else {
    adminApp = getApps()[0];
}

const db = getFirestore(adminApp);
const auth = getAdminAuth(adminApp);
const storage = getAdminStorage(adminApp);

export function getDb(): Firestore {
    return db;
}

export function getAuth(): Auth {
    return auth;
}

export function getStorage(): Storage {
    return storage;
}
