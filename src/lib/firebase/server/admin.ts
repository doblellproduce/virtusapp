
'use server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage, Storage } from 'firebase-admin/storage';

const initializeAdminApp = (): App => {
    const existingApp = getApps().find(app => app.name === 'firebase-admin-app');
    if (existingApp) {
        return existingApp;
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
        throw new Error("Firebase Admin credentials are not fully set in environment variables.");
    }

    try {
        return initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        }, 'firebase-admin-app');
    } catch (error) {
        console.error("Failed to initialize Firebase Admin SDK:", error);
        throw new Error("Could not initialize Firebase Admin SDK. See server logs for details.");
    }
};

export function getDb(): Firestore {
    const app = initializeAdminApp();
    return getFirestore(app);
}

export function getAuth(): Auth {
    const app = initializeAdminApp();
    return getAdminAuth(app);
}

export function getStorage(): Storage {
    const app = initializeAdminApp();
    return getAdminStorage(app);
}
