
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This is a simplified example. In a real-world scenario, you might want
// to verify the token with Firebase Admin SDK here for added security
// on routes that perform sensitive operations based on the cookie.

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Set the token in a secure, httpOnly cookie.
    // This cookie will now be sent with every request to the server,
    // making it accessible to your middleware.
    cookies().set('firebaseIdToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'Authentication successful.' });
  } catch (error) {
    console.error('Error setting auth cookie:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


export async function DELETE() {
  try {
    // Clear the authentication cookie upon logout.
    cookies().delete('firebaseIdToken');
    return NextResponse.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Error clearing auth cookie:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
