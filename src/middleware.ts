
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebaseIdToken');
  const { pathname } = request.nextUrl;

  // If trying to access a protected route without a token, redirect to login
  if (!token && !pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If logged in and trying to access login page, redirect to dashboard
  if (token && pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// This matcher protects all routes under the / (app) group,
// except for the ones that should be public.
// It explicitly allows all necessary Next.js and static files.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the public root page)
     * - /vehiculo (public vehicle detail pages)
     * - /contrato (public contract page)
     * - /login (the login page itself)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|vehiculo|contrato|login|$).*)',
  ],
};
