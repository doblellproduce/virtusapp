
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;

// Use a singleton pattern to initialize the app only once.
if (!getApps().length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    // Check if all required environment variables are present.
    if (privateKey && clientEmail && projectId) {
        adminApp = initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'), // Ensure newlines are correctly formatted.
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
    } else {
        // This warning is crucial for debugging in production environments like Vercel.
        console.warn(
            "Firebase Admin credentials are not fully set in environment variables. " +
            "Server-side Firebase functionality will be disabled. " +
            "Ensure FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set."
        );
    }
} else {
    adminApp = getApps()[0];
}


// These functions will now check if the adminApp was successfully initialized.
// If not, they will throw a clear error, which can be caught by our server actions.
function getInitializedAdminApp(): App {
    if (!adminApp) {
        throw new Error("Firebase Admin SDK is not initialized. Check server logs and Vercel environment variables for credentials.");
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
