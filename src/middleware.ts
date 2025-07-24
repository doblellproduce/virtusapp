

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/server/admin';

// Paths that do not require authentication
const publicPaths = ['/login', '/contrato'];
// API paths that do not require authentication
const publicApiPaths = ['/api/auth'];
// Paths exclusively for authenticated clients
const clientPaths = ['/client-dashboard'];
// Paths for admin area (all roles except Client)
const adminPaths = [
    '/dashboard', '/reservations', '/customers', '/vehicles', 
    '/documents', '/invoices', '/expenses', '/maintenance', '/calendar',
    '/smart-reply', '/reports', '/logs', '/users', '/reviews'
];


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebaseIdToken')?.value;

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path)) || pathname === '/';
  const isPublicApiPath = publicApiPaths.some(path => pathname.startsWith(path));

  // 1. Allow access to public paths and public APIs
  if (isPublicPath || isPublicApiPath) {
    return NextResponse.next();
  }

  // 2. If no token, redirect to login for any protected route
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // 3. Verify token and user role
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const role = decodedToken.role || 'Client'; // Default to Client if role isn't set in custom claims

    // User is a Client
    if (role === 'Client') {
        // Allow access to client-specific paths
        if (clientPaths.some(p => pathname.startsWith(p))) {
            return NextResponse.next();
        }
        // If a client tries to access an admin path, redirect them to their dashboard
        if (adminPaths.some(p => pathname.startsWith(p))) {
             return NextResponse.redirect(new URL('/client-dashboard', request.url));
        }
    } 
    // User is an Admin/Supervisor/Secretary
    else {
        // Allow access to admin paths
        if (adminPaths.some(p => pathname.startsWith(p))) {
            return NextResponse.next();
        }
        // If an admin tries to access a client path, redirect them to their dashboard
        if (clientPaths.some(p => pathname.startsWith(p))) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }
    
    // Fallback for any other authenticated route, just let it pass
    return NextResponse.next();

  } catch (error) {
    console.error("Token verification failed in middleware:", error);
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
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
