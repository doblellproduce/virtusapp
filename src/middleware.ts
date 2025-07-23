import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebaseIdToken');
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login');
  const isProtectedPage = [
    '/dashboard', '/calendar', '/documents', '/expenses', 
    '/invoices', '/logs', '/maintenance', '/reservations', 
    '/smart-reply', '/users', '/vehicles'
  ].some(p => pathname.startsWith(p));

  // If user is authenticated
  if (token) {
    // If they try to access the login page, redirect to dashboard
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } 
  // If user is not authenticated
  else {
    // If they try to access a protected page, redirect to login
    if (isProtectedPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Allow the request to proceed if none of the above conditions are met.
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     * - robots.txt (SEO file)
     * - vehiculo/* (public vehicle detail pages)
     * - contrato (public contract page)
     * - / (the public homepage is allowed)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|robots.txt|vehiculo/.*|contrato).*)',
  ],
};
