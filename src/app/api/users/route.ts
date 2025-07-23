
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/lib/firebase/admin';
import type { UserRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authentication & Authorization
    const token = request.cookies.get('firebaseIdToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const requestingUid = decodedToken.uid;
    
    const userDoc = await adminDB.collection('users').doc(requestingUid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'Admin') {
         return NextResponse.json({ error: 'Forbidden: You do not have permission to create users.' }, { status: 403 });
    }

    // 2. Validate Input
    const { email, displayName, role, tenantId } = (await request.json()) as { email: string; displayName: string, role: UserRole, tenantId: string };
    if (!email || !displayName || !role || !tenantId) {
      return NextResponse.json({ error: 'Missing required fields: email, displayName, role, tenantId.' }, { status: 400 });
    }
    
    // **SECURITY FIX**: Prevent creating another admin via the API
    if (role === 'Admin') {
        return NextResponse.json({ error: 'Forbidden: Cannot create an Admin user via this API.' }, { status: 403 });
    }


    // 3. Create User in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: email,
      displayName: displayName,
      emailVerified: false, 
    });

    // 4. Create User Profile in Firestore
    const userDocRef = adminDB.collection("users").doc(userRecord.uid);
    await userDocRef.set({
      name: displayName,
      email: email,
      role: role,
      photoURL: "",
      tenantId: tenantId,
    });

    // 5. Generate Password Reset Link (acts as an invite)
    const link = await adminAuth.generatePasswordResetLink(email);
    
    await adminDB.collection('activityLogs').add({
        timestamp: new Date().toISOString(),
        user: userDoc.data()?.name || 'Admin',
        action: 'Create',
        entityType: 'User',
        entityId: userRecord.uid,
        details: `Invited new user: ${displayName} with role ${role}`,
        tenantId: tenantId,
    });


    return NextResponse.json({ 
        success: true, 
        message: `User ${displayName} created. An invitation/password reset link could be sent to ${email}.`,
        uid: userRecord.uid,
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

    