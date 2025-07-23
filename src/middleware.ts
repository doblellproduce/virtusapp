
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/contrato'];
const publicApiPaths = ['/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebaseIdToken')?.value;

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path)) || pathname === '/';
  const isPublicApiPath = publicApiPaths.some(path => pathname.startsWith(path));

  // If accessing a public path or public API, allow the request
  if (isPublicPath || isPublicApiPath) {
    // But if they are logged in and trying to access /login, redirect to dashboard
    if (token && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // For all other paths, a token is required
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If a token exists, we will assume it's valid for now.
  // The API routes themselves can perform finer-grained verification if needed.
  // The main purpose here is to protect routes from unauthenticated access.
  return NextResponse.next();
}

// Matcher to apply the middleware to all paths except for Next.js internal assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
