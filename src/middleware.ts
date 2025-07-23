
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebaseIdToken');

  // If the user is not authenticated and is trying to access a protected route,
  // redirect them to the login page.
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is authenticated and tries to access the login page, redirect to dashboard
  if (token && request.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow the request to proceed if the user is authenticated
  return NextResponse.next();
}

// The matcher now explicitly targets only the routes that should be protected.
// This is a more robust and readable approach than using negative lookaheads.
// It ensures that essential static files (_next/static, etc.) are never blocked.
export const config = {
  matcher: [
    '/dashboard',
    '/calendar',
    '/documents',
    '/expenses',
    '/invoices',
    '/logs',
    '/maintenance',
    '/reservations',
    '/smart-reply',
    '/users',
    '/vehicles',
  ],
};
