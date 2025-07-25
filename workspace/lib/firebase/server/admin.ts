
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDBInstance: Firestore | null = null;
let adminStorageInstance: Storage | null = null;

function initializeAdminApp() {
    if (getApps().some(app => app.name === 'firebase-admin-app')) {
        adminApp = getApps().find(app => app.name === 'firebase-admin-app')!;
    } else {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        if (privateKey && clientEmail && projectId) {
            try {
                const serviceAccount = {
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                };
                adminApp = initializeApp({
                    credential: cert(serviceAccount),
                    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                }, 'firebase-admin-app');
            } catch (error) {
                console.error("Failed to initialize Firebase Admin SDK:", error);
                adminApp = null;
            }
        } else {
             console.warn("Firebase Admin credentials are not fully set. Server-side functionality will be limited.");
        }
    }

    if (adminApp) {
        adminAuthInstance = getAuth(adminApp);
        adminDBInstance = getFirestore(adminApp);
        adminStorageInstance = getStorage(adminApp);
    }
}

// Ensure the app is initialized when this module is loaded on the server.
initializeAdminApp();

export function getDb(): Firestore {
    if (!adminDBInstance) {
        initializeAdminApp(); // Attempt to re-initialize if not available
        if (!adminDBInstance) {
            throw new Error("Firebase Admin DB could not be initialized. Check server credentials.");
        }
    }
    return adminDBInstance;
}

export function getAuth(): Auth {
    if (!adminAuthInstance) {
        initializeAdminApp();
        if (!adminAuthInstance) {
            throw new Error("Firebase Admin Auth is not initialized.");
        }
    }
    return adminAuthInstance;
}

export function getStorage(): Storage {
    if (!adminStorageInstance) {
        initializeAdminApp();
        if (!adminStorageInstance) {
            throw new Error("Firebase Admin Storage is not initialized.");
        }
    }
    return adminStorageInstance;
}

export const adminAuth = getAuth;
export const adminDB = getDb();
export const adminStorage = getStorage;
