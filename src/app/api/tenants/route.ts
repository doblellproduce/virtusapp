
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/lib/firebase/server/admin';
import { UserRole } from '@/lib/types';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authentication & Authorization of the requester
    const token = request.cookies.get('firebaseIdToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const requestingUserDoc = await adminDB.collection('users').doc(decodedToken.uid).get();
    
    if (!requestingUserDoc.exists || requestingUserDoc.data()?.role !== 'SuperAdmin') {
         return NextResponse.json({ error: 'Forbidden: You do not have permission to create tenants.' }, { status: 403 });
    }

    // 2. Validate Input
    const { tenantName, adminEmail, adminName } = await request.json();
    if (!tenantName || !adminEmail || !adminName) {
      return NextResponse.json({ error: 'Missing required fields: tenantName, adminEmail, adminName.' }, { status: 400 });
    }

    const batch = adminDB.batch();

    // 3. Create Tenant Document
    const tenantRef = adminDB.collection('tenants').doc(); // Auto-generate ID
    batch.set(tenantRef, {
        name: tenantName,
        createdAt: new Date().toISOString(),
        status: 'active',
    });
    
    // 4. Create the Admin User for the new Tenant
    const newAdminUser = await adminAuth.createUser({
        email: adminEmail,
        displayName: adminName,
        emailVerified: false,
    });

    // 5. Create the User Profile for the new Admin in Firestore
    const userProfileRef = adminDB.collection('users').doc(newAdminUser.uid);
    batch.set(userProfileRef, {
        name: adminName,
        email: adminEmail,
        role: 'Admin' as UserRole,
        photoURL: '',
        tenantId: tenantRef.id, // Assign the new tenant's ID
    });

    // 6. Log the SuperAdmin's activity
    const logRef = adminDB.collection('activityLogs').doc();
    batch.set(logRef, {
        timestamp: new Date().toISOString(),
        user: requestingUserDoc.data()?.name || 'SuperAdmin',
        action: 'Create',
        entityType: 'Tenant',
        entityId: tenantRef.id,
        details: `Created new tenant '${tenantName}' and admin user '${adminName}'.`,
        tenantId: requestingUserDoc.data()?.tenantId, // The SuperAdmin's own tenantId
    });
    
    // 7. Commit all operations atomically
    await batch.commit();
    
    // Optionally, generate and send an invitation email here via a mail service
    // For now, we'll just return a success message.
    
    return NextResponse.json({ 
        success: true, 
        message: `Tenant '${tenantName}' and admin user '${adminName}' created successfully.`,
        tenantId: tenantRef.id,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating new tenant:', error);

    let errorMessage = "An internal error occurred.";
    let statusCode = 500;

    if (error.code === 'auth/email-already-exists') {
      errorMessage = "This email address is already in use by another account.";
      statusCode = 409;
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "The email address provided is not valid.";
      statusCode = 400;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
