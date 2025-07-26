
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage, Storage } from 'firebase-admin/storage';

let adminApp: App | undefined;

function initializeAdminApp(): App {
    if (adminApp) {
        return adminApp;
    }

    // Check if the app is already initialized by Firebase's internal mechanism
    const existingApp = getApps().find(app => app.name === 'firebase-admin-app');
    if (existingApp) {
        adminApp = existingApp;
        return adminApp;
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    // A single, clear check for all required environment variables.
    if (!privateKey || !clientEmail || !projectId) {
        throw new Error(
            "Firebase Admin credentials are not fully set in environment variables. " +
            "Please check FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and NEXT_PUBLIC_FIREBASE_PROJECT_ID."
        );
    }

    try {
        const serviceAccount = {
            projectId,
            clientEmail,
            // Vercel and other platforms often escape newlines. 
            // This line ensures the private key is correctly formatted by replacing '\\n' with '\n'.
            privateKey: privateKey.replace(/\\n/g, '\n'),
        };

        adminApp = initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        }, 'firebase-admin-app'); // Name the app to prevent conflicts

        return adminApp;

    } catch (error: any) {
        // This catch block will now primarily handle errors from malformed credentials.
        console.error("Firebase Admin SDK Initialization Error:", error.message);
        throw new Error(`Failed to initialize Firebase Admin SDK. This is likely due to malformed credentials. Details: ${error.message}`);
    }
}

// Initialize the app right away to catch any configuration errors on startup.
try {
    initializeAdminApp();
} catch (error) {
    console.error("CRITICAL: Firebase Admin App could not be initialized.", error);
    // Depending on the deployment strategy, you might want to handle this differently.
    // For now, we log it critically. The functions below will fail if `adminApp` is not set.
}


// These getter functions are now simplified. They assume `initializeAdminApp` has been called.
// If initialization failed, `adminApp` will be undefined, and these will throw a clear error.
function getInitializedAdminApp(): App {
    if (!adminApp) {
        throw new Error("Firebase Admin SDK has not been initialized. Check server startup logs for credential errors.");
    }
    return adminApp;
}

export function getDb(): Firestore {
    return getFirestore(getInitializedAdminApp());
}

export function getAuth(): Auth {
    return getAdminAuth(getInitializedAdminApp());
}

export function getStorage(): Storage {
    return getAdminStorage(getInitializedAdminApp());
}
