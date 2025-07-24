
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that do not require authentication
const publicPaths = ['/login', '/contrato', '/home'];
// API paths that do not require authentication
const publicApiPaths = ['/api/auth', '/api/smart-reply']; 
// Protected admin area for staff
const adminPaths = [
    '/dashboard', '/reservations', '/customers', '/vehicles', 
    '/documents', '/invoices', '/expenses', '/maintenance', '/calendar',
    '/smart-reply', '/reports', '/logs', '/users', '/reviews'
];


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get('firebaseIdToken');

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path)) || pathname === '/' || pathname.startsWith('/vehiculo');
  const isPublicApiPath = publicApiPaths.some(path => pathname.startsWith(path));

  // 1. Allow access to public paths and public APIs without a token
  if (isPublicPath || isPublicApiPath) {
    return NextResponse.next();
  }

  // 2. If no token, redirect to login for any other protected route
  // The actual token verification will happen on the server-side components/API routes
  // that need it. The middleware's job is just to protect routes from unauthenticated access.
  if (!tokenCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // 3. If a token cookie exists, let the request proceed.
  // The server-side logic in pages or API routes will handle the actual verification and role checking.
  return NextResponse.next();
}

// Matcher to apply the middleware to all paths except for Next.js internal assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
