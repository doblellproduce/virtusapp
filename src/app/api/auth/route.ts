
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
    let userRole = 'Client'; // Default role

    if (userDocSnap.exists) {
        userProfile = userDocSnap.data();
        userRole = userProfile?.role || 'Client';
    } else {
        // This is a new user, create a default profile for them.
        // This is especially important for client users who sign up but don't have a pre-made profile.
        const newUserProfile = {
            email: decodedToken.email,
            name: decodedToken.name || 'New Client',
            role: 'Client',
            photoURL: decodedToken.picture || '',
        };
        await userDocRef.set(newUserProfile);
        userProfile = newUserProfile;
        userRole = 'Client';
    }
    
    // Set custom claim for role-based access in middleware or server components
    await adminAuth.setCustomUserClaims(uid, { role: userRole });
    
    const userNameForLog = userProfile?.name || decodedToken.email || 'Unknown User';
    
    // Log only if it's not the user's very first authentication
    if (decodedToken.auth_time < decodedToken.iat - 5) { // Check if auth_time is reasonably before issuance time
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
