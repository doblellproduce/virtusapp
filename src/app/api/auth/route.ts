
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/lib/firebase/server/admin';
import type { UserProfile } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }
    
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
         case 'auth/id-token-expired':
            errorMessage = 'Your session has expired. Please log in again.';
            break;
         case 'auth/argument-error':
            errorMessage = 'The ID token provided is not valid.';
            break;
         default:
            errorMessage = error.message || "An unexpected error occurred during session creation.";
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
