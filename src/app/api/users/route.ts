import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/lib/firebase/admin';
import type { UserRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authentication & Authorization
    // In API Routes, get the cookie directly from the request object.
    const token = request.cookies.get('firebaseIdToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const requestingUid = decodedToken.uid;
    
    // Check if the requesting user is an Admin
    const userDoc = await adminDB.collection('users').doc(requestingUid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'Admin') {
         return NextResponse.json({ error: 'Forbidden: You do not have permission to create users.' }, { status: 403 });
    }

    // 2. Validate Input
    const { email, displayName, role } = (await request.json()) as { email: string; displayName: string, role: UserRole };
    if (!email || !displayName || !role) {
      return NextResponse.json({ error: 'Missing required fields: email, displayName, role.' }, { status: 400 });
    }

    // 3. Create User in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: email,
      displayName: displayName,
      emailVerified: false, // User will verify via password reset link
    });

    // 4. Create User Profile in Firestore
    const userDocRef = adminDB.collection("users").doc(userRecord.uid);
    await userDocRef.set({
      name: displayName,
      email: email,
      role: role,
      photoURL: "",
    });

    // 5. Generate Password Reset Link (acts as an invite)
    const link = await adminAuth.generatePasswordResetLink(email);
    // TODO: In a real production app, you would use an email service (e.g., SendGrid, Mailgun)
    // to send a formatted invitation email containing this link.
    // For now, the link is not sent, but the user is created.

    return NextResponse.json({ 
        success: true, 
        message: `User ${displayName} created. An invitation/password reset link could be sent to ${email}.`,
        uid: userRecord.uid,
        // In a real app, you would not send the link back in the response for security reasons.
        // verificationLink: link 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error creating new user:', error);

    let errorMessage = "An internal error occurred.";
    let statusCode = 500;

    if (error.code === 'auth/email-already-exists') {
      errorMessage = "This email address is already in use by another account.";
      statusCode = 409; // Conflict
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "The email address provided is not valid.";
      statusCode = 400;
    } else if (error.code === 'auth-argument-error') {
       errorMessage = "Authentication token is invalid or expired. Please log in again.";
       statusCode = 401;
    }

    return NextResponse.json({ error: errorMessage, details: error.message }, { status: statusCode });
  }
}
