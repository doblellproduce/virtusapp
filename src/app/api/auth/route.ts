
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/lib/firebase/admin';
import type { UserProfile } from '@/lib/types';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);


export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Authenticate the user with client SDK first to verify password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    
    // Verify the token on the admin side to get claims and proceed securely
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Log the activity
    const userDocSnap = await adminDB.collection('users').doc(uid).get();
    if (!userDocSnap.exists) {
        return NextResponse.json({ error: 'User profile not found in database.' }, { status: 404 });
    }
    const userProfile = userDocSnap.data() as UserProfile;

    await adminDB.collection('activityLogs').add({
        timestamp: new Date().toISOString(),
        user: userProfile.name || userProfile.email,
        action: 'Login',
        entityType: 'Auth',
        entityId: uid,
        details: `User ${userProfile.name} logged in.`,
        tenantId: userProfile.tenantId,
    });
    
    const response = NextResponse.json({ success: true, message: 'Authentication successful.' });

    // Set the token in a secure, httpOnly cookie on the response
    response.cookies.set('firebaseIdToken', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Error handling auth request:', error);
     let errorMessage = "An unexpected error occurred.";
       // Robust handling of common Firebase Auth errors
       switch (error.code) {
         case 'auth/user-not-found':
         case 'auth/wrong-password':
         case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please try again.';
            break;
         case 'auth/too-many-requests':
            errorMessage = 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
            break;
         default:
            errorMessage = error.message || "An unexpected error occurred during login.";
            break;
       }
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }
}


export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
    
    // Clear the authentication cookie upon logout
    response.cookies.delete('firebaseIdToken');
    
    return response;

  } catch (error) {
    console.error('Error clearing auth cookie:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
