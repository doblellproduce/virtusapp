
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage, Storage } from 'firebase-admin/storage';

let adminApp: App | null = null;

function initializeAdminApp(): App {
    // Check if the app is already initialized to avoid re-initialization
    const existingApp = getApps().find(app => app.name === 'firebase-admin-app');
    if (existingApp) {
        return existingApp;
    }

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
            return initializeApp({
                credential: cert(serviceAccount),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            }, 'firebase-admin-app'); // Name the app to prevent conflicts
        } catch (error: any) {
            console.error("Firebase Admin SDK Initialization Error:", error.message);
            // Throw a more specific error to be caught by server actions
            throw new Error(`Firebase Admin SDK Initialization Failed: ${error.message}`);
        }
    } else {
        // This is a critical configuration error.
        console.error("Firebase Admin credentials are not fully set in environment variables.");
        throw new Error("Firebase Admin credentials are not fully set. Ensure FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL are configured in your Vercel project settings.");
    }
}

function getAdminApp(): App {
    if (!adminApp) {
        adminApp = initializeAdminApp();
    }
    return adminApp;
}

export function getDb(): Firestore {
    return getFirestore(getAdminApp());
}

export function getAuth(): Auth {
    return getAdminAuth(getAdminApp());
}

export function getStorage(): Storage {
    return getAdminStorage(getAdminApp());
}
