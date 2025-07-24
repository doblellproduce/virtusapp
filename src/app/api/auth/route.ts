

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/lib/firebase/server/admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const userDocSnap = await adminDB.collection('users').doc(uid).get();
    if (!userDocSnap.exists) {
        return NextResponse.json({ error: 'User profile not found in database.' }, { status: 404 });
    }
    const userProfile = userDocSnap.data();

    // Set custom claim for role-based access in middleware
    await adminAuth.setCustomUserClaims(uid, { role: userProfile?.role });
    
    await adminDB.collection('activityLogs').add({
        timestamp: new Date().toISOString(),
        user: userProfile?.name || userProfile?.email,
        action: 'Login',
        entityType: 'Auth',
        entityId: uid,
        details: `User ${userProfile?.name} logged in.`
    });
    
    const response = NextResponse.json({ success: true, message: 'Authentication successful.' });

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
    
    response.cookies.delete('firebaseIdToken');
    
    return response;

  } catch (error) {
    console.error('Error clearing auth cookie:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
