
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;
let adminAuth: Auth;
let adminDB: Firestore;
let adminStorage: Storage;

function initializeAdminApp() {
    // Check if the app is already initialized to prevent re-initialization
    if (getApps().some(app => app.name === 'firebase-admin-app')) {
        return getApps().find(app => app.name === 'firebase-admin-app')!;
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
        console.warn("Firebase Admin credentials are not fully set in environment variables. Server-side Firebase functionality will be limited.");
        // Return a dummy/uninitialized app or handle as needed
        // For this case, we will let the functions that use it fail gracefully if called.
        return null;
    }
    
    try {
        const serviceAccount = {
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        };

        return initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        }, 'firebase-admin-app'); // Give the app a name
    } catch (error) {
        console.error("Failed to initialize Firebase Admin SDK:", error);
        return null;
    }
}

const initializedApp = initializeAdminApp();

if (initializedApp) {
    adminApp = initializedApp;
    adminAuth = getAuth(adminApp);
    adminDB = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);
} else {
    // Set to null or handle the uninitialized state as per your app's requirements.
    // This example will cause downstream errors if the SDK is used without being initialized,
    // which is desirable to quickly identify configuration issues.
    console.error("Firebase Admin SDK not initialized. Calls to adminAuth, adminDB, or adminStorage will fail.");
}


export { adminApp, adminAuth, adminDB, adminStorage };
