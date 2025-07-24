
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
    
    const userDocRef = adminDB.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();
    
    let userProfile = null;
    if (userDocSnap.exists) {
        userProfile = userDocSnap.data();
    } else {
        // If the user document doesn't exist, it might be a new client registration.
        // We can create a default profile here if needed, or just assign a client role.
        // For this app, non-staff users are 'Client' by default.
        // No doc creation needed for clients.
    }
    
    const userRole = userProfile?.role || 'Client';

    // Set custom claim for role-based access in middleware or server components
    await adminAuth.setCustomUserClaims(uid, { role: userRole });
    
    const userNameForLog = userProfile?.name || decodedToken.email || 'Unknown User';
    
    const isNewUser = decodedToken.auth_time === decodedToken.iat;
    if (!isNewUser && userProfile) { 
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

    // Set the session cookie
    response.cookies.set('firebaseIdToken', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      sameSite: 'lax',
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
    return NextResponse.json({ error: errorMessage, code: error.code }, { status: 401 });
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
