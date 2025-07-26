
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
            // Log a more descriptive error but don't crash the server.
            console.error("Firebase Admin SDK Initialization Error:", "Could not initialize Firebase Admin SDK. This is likely due to malformed credentials. Server-side functionality will be limited.", error.message);
        }
    } else {
        // This is a common case in development or incomplete CI/CD setups.
        // Warn the developer but don't throw a fatal error.
        console.warn("Firebase Admin credentials are not fully set in environment variables. Server-side functionality (like session management) will be disabled.");
    }
    
    // If initialization fails or creds are missing, we fall back to a "no-op" or default app state if possible,
    // but in this case, we must acknowledge that server features requiring auth will fail.
    // We throw here to make it clear in logs that the app is misconfigured.
    throw new Error("Firebase Admin SDK could not be initialized. Check server logs for details.");
}

function getAdminApp(): App {
    if (!adminApp) {
        try {
            adminApp = initializeAdminApp();
        } catch (error) {
             console.error("Critical: Could not retrieve Firebase Admin App instance.", error);
             // Re-throw so that calling functions know initialization failed.
             throw error;
        }
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
