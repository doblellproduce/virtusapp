import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Correctly access cookies from the request object in Middleware
  const token = request.cookies.get('firebaseIdToken');
  const { pathname } = request.nextUrl;

  // If the user is trying to access a protected page but is already authenticated
  // and is on the root, redirect them to the dashboard.
  if (token && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If the user is trying to access the login page but is already authenticated,
  // redirect them to the dashboard.
  if (token && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the user is trying to access a protected admin route and is not authenticated,
  // redirect them to the login page.
  const protectedPaths = ['/dashboard', '/calendar', '/documents', '/expenses', '/invoices', '/logs', '/maintenance', '/reservations', '/smart-reply', '/users', '/vehicles'];
  if (!token && protectedPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url));
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
     * - / (the public homepage, handled separately in the logic)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|robots.txt|vehiculo/.*|contrato|login).*)',
    '/', 
  ],
};
