
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/server/admin';

// Paths that do not require authentication
const publicPaths = ['/login', '/contrato'];
// API paths that do not require authentication
const publicApiPaths = ['/api/auth', '/api/smart-reply']; // Allow smart-reply for unauth use if needed
// Protected admin area for staff
const adminPaths = [
    '/dashboard', '/reservations', '/customers', '/vehicles', 
    '/documents', '/invoices', '/expenses', '/maintenance', '/calendar',
    '/smart-reply', '/reports', '/logs', '/users', '/reviews'
];


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebaseIdToken')?.value;

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path)) || pathname === '/' || pathname.startsWith('/vehiculo');
  const isPublicApiPath = publicApiPaths.some(path => pathname.startsWith(path));

  // 1. Allow access to public paths and public APIs without a token
  if (isPublicPath || isPublicApiPath) {
    return NextResponse.next();
  }

  // 2. If no token, redirect to login for any other protected route
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // 3. Verify token and user role
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const role = decodedToken.role;

    // If a user has a role (i.e., they are staff), allow access to admin paths.
    if (role && adminPaths.some(p => pathname.startsWith(p))) {
        return NextResponse.next();
    }
    
    // If a user with a valid token tries to access something they shouldn't,
    // or if a user has no role, redirect them to the main page.
    return NextResponse.redirect(new URL('/', request.url));

  } catch (error) {
    console.error("Token verification failed in middleware:", error);
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    // Clear the invalid cookie
    response.cookies.delete('firebaseIdToken');
    return response;
  }
}

// Matcher to apply the middleware to all paths except for Next.js internal assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
