
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/server/admin';

const publicPaths = ['/login', '/contrato'];
const publicApiPaths = ['/api/auth']; // API for login/logout is public

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebaseIdToken')?.value;

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path)) || pathname === '/';
  const isPublicApiPath = publicApiPaths.some(path => pathname.startsWith(path));

  // Allow access to public paths and public APIs
  if (isPublicPath || isPublicApiPath) {
    // But if they are logged in and trying to access /login, redirect to dashboard
    if (token && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // For all other protected paths, a token is required
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Verify the token to ensure it's still valid
  try {
    await adminAuth.verifyIdToken(token);
  } catch (error) {
    // If token verification fails, redirect to login and clear the invalid cookie
    console.error("Token verification failed in middleware:", error);
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('firebaseIdToken');
    return response;
  }

  // If the user has a valid token, allow the request to proceed
  return NextResponse.next();
}

// Matcher to apply the middleware to all paths except for Next.js internal assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
