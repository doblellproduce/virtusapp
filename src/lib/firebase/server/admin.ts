
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
                // Vercel and other platforms often escape newlines. This line ensures the private key is correctly formatted.
                privateKey: privateKey.replace(/\\n/g, '\n'),
            };
            return initializeApp({
                credential: cert(serviceAccount),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            }, 'firebase-admin-app'); // Name the app to prevent conflicts
        } catch (error: any) {
            // Log a more descriptive error but don't crash the server.
            console.error("Firebase Admin SDK Initialization Error:", "Could not initialize Firebase Admin SDK. This is likely due to malformed credentials.", error.message);
            throw new Error(`Admin App initialization failed due to malformed credentials. Details: ${error.message}`);
        }
    } 
    
    // This is a common case in development or incomplete CI/CD setups.
    // Warn the developer but don't throw a fatal error.
    console.warn("Firebase Admin credentials are not fully set in environment variables. Server-side functionality will be disabled.");
    // Return a dummy app object to prevent downstream crashes
    throw new Error("Admin App initialization failed because environment variables are not set.");
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

// Defensive getters: These functions will attempt to get the service, but will fail gracefully
// if the admin app itself could not be initialized.

export function getDb(): Firestore {
    try {
        const app = getAdminApp();
        return getFirestore(app);
    } catch (error) {
        console.error("Failed to get Firestore instance. Admin App might not be initialized.");
        throw error;
    }
}

export function getAuth(): Auth {
    try {
        const app = getAdminApp();
        return getAdminAuth(app);
    } catch (error) {
        console.error("Failed to get Auth instance. Admin App might not be initialized.");
        throw error;
    }
}

export function getStorage(): Storage {
    try {
        const app = getAdminApp();
        return getAdminStorage(app);
    } catch (error) {
        console.error("Failed to get Storage instance. Admin App might not be initialized.");
        throw error;
    }
}
