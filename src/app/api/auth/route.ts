
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
    
    const userProfile = userDocSnap.exists ? userDocSnap.data() : null;

    // Set custom claim for role-based access in middleware
    await adminAuth.setCustomUserClaims(uid, { role: userProfile?.role || 'Client' });
    
    // Log activity only if profile exists, otherwise use email as a fallback.
    // This prevents the "User undefined logged in" error.
    const userNameForLog = userProfile?.name || decodedToken.email || 'Unknown User';
    
    // Check if the log is for a login or a new registration to avoid double logging
    const isNewUser = decodedToken.auth_time === decodedToken.iat;
    if (!isNewUser && userProfile) { // Only log if it's an existing user with a profile
        await adminDB.collection('activityLogs').add({
            timestamp: new Date().toISOString(),
            user: userNameForLog,
            action: 'Login',
            entityType: 'Auth',
            entityId: uid,
            details: `User ${userNameForLog} logged in.`
        });
    }
    
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
