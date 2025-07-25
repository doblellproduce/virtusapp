
'use server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage, Storage } from 'firebase-admin/storage';

// Store singleton instances in the global scope to prevent re-initialization.
let adminApp: App | null = null;

function initializeAdminApp(): App {
    if (adminApp) {
        return adminApp;
    }
    
    // Check if an app is already initialized (e.g., by another module)
    const existingApp = getApps().find(app => app.name === 'firebase-admin-app');
    if (existingApp) {
        adminApp = existingApp;
        return adminApp;
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
        console.error("Firebase Admin credentials are not fully set in environment variables.");
        throw new Error("Firebase Admin credentials are not fully set in environment variables. Server cannot connect to Firebase.");
    }

    try {
        const credential = cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        });

        adminApp = initializeApp({
            credential,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        }, 'firebase-admin-app');
        
        return adminApp;
    } catch (error) {
        console.error("Failed to initialize Firebase Admin SDK:", error);
        throw new Error("Could not initialize Firebase Admin SDK. See server logs for details.");
    }
};

// Initialize on module load
const app = initializeAdminApp();
const db = getFirestore(app);
const auth = getAdminAuth(app);
const storage = getAdminStorage(app);

export function getDb(): Firestore {
    return db;
}

export function getAuth(): Auth {
    return auth;
}

export function getStorage(): Storage {
    return storage;
}
