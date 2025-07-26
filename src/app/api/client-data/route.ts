
import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getDb } from '@/lib/firebase/server/admin';
import type { Reservation, Review } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuth();
    const db = getDb();
    
    // 1. Verify Authentication from session cookie
    const token = request.cookies.get('firebaseIdToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No session cookie.' }, { status: 401 });
    }
    
    const decodedToken = await auth.verifySessionCookie(token, true);
    const uid = decodedToken.uid;

    // 2. Fetch reservations for the logged-in user
    const reservationsQuery = query(collection(db, 'reservations'), where('customerId', '==', uid), orderBy('pickupDate', 'desc'));
    const reviewsQuery = query(collection(db, 'reviews'), where('customerId', '==', uid));

    const [reservationsSnapshot, reviewsSnapshot] = await Promise.all([
        getDocs(reservationsQuery),
        getDocs(reviewsQuery)
    ]);
    
    const reservations = reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
    const reviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));

    // 3. Return the data
    return NextResponse.json({ reservations, reviews });

  } catch (error: any) {
    console.error('Error fetching client data:', error);
    if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/session-cookie-revoked') {
         return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch client data' }, { status: 500 });
  }
}

// Re-export query and other functions to avoid duplicate imports in consumers
import { query, collection, where, orderBy, getDocs } from 'firebase/firestore';
