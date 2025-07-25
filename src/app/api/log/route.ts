
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/lib/firebase/server/admin';
import type { ActivityLog } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('firebaseIdToken')?.value;
    let decodedToken;
    let userName = 'Anonymous';

    if (token) {
        decodedToken = await adminAuth.verifyIdToken(token);
        const userDoc = await adminDB.collection('users').doc(decodedToken.uid).get();
        if(userDoc.exists) {
            userName = userDoc.data()?.name || decodedToken.email || 'Unknown User';
        }
    }
    
    const { action, entityType, entityId, details } = (await request.json()) as Omit<ActivityLog, 'id' | 'timestamp' | 'user'>;

    if (!action || !entityType || !entityId || !details) {
      return NextResponse.json({ error: 'Missing required log fields.' }, { status: 400 });
    }

    await adminDB.collection('activityLogs').add({
        timestamp: new Date().toISOString(),
        user: userName,
        action,
        entityType,
        entityId,
        details,
    });

    return NextResponse.json({ success: true, message: 'Activity logged.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error in log API route:', error);
    let errorMessage = "An internal error occurred while logging.";
    if(error.code === 'auth/id-token-expired') {
        errorMessage = "Authentication token expired."
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
