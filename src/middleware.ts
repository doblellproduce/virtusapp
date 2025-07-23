import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebaseIdToken');
  const { pathname } = request.nextUrl;

  // If the user is trying to access the login page but is already authenticated,
  // redirect them to the dashboard.
  if (token && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the user is trying to access a protected admin route and is not authenticated,
  // redirect them to the login page.
  if (!token && pathname.startsWith('/(app)')) {
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
     * - / (the public homepage)
     * - /vehiculo/* (public vehicle detail pages)
     * - /contrato (public contract page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|robots.txt|vehiculo/.*|contrato).*)',
    '/', // Also apply to the root to handle redirect if logged in
  ],
};
