
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

const protectedPaths = ['/dashboard', '/reservations', '/customers', '/vehicles', '/documents', '/invoices', '/expenses', '/maintenance', '/calendar', '/smart-reply', '/reports', '/logs', '/users', '/super-admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebaseIdToken')?.value;
  
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isProtectedPath) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('Authorization', `Bearer ${token}`);
      
      // Check for super admin access
      if (pathname.startsWith('/super-admin')) {
          const userDoc = await adminAuth.getUser(decodedToken.uid);
          // This relies on custom claims, which is more secure for role checks on the server.
          // Let's assume the user document has the role for now, as implemented in the app.
          // In a production SaaS, custom claims are preferred.
          if ((userDoc.customClaims as any)?.role !== 'SuperAdmin') {
             return NextResponse.redirect(new URL('/dashboard', request.url));
          }
      }
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

    } catch (error) {
      console.error('Token verification failed:', error);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('sessionExpired', 'true');
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('firebaseIdToken'); // Clean up invalid cookie
      return response;
    }
  }

  // If logged in and trying to access login page, redirect to dashboard
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|contrato).*)',
  ],
};

    