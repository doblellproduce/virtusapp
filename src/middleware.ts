
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

const publicPaths = ['/login', '/contrato'];
const publicApiPaths = ['/api/auth']; // API for login/logout is public

// Helper function to decode the token and get the role
async function getUserRoleFromToken(token: string): Promise<string | null> {
    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        return decodedToken.role || null;
    } catch (error) {
        // This can happen if the token is expired or invalid
        console.error("Token verification failed in middleware:", error);
        return null;
    }
}


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
  
  // Role-based access control for super-admin route
  if (pathname.startsWith('/super-admin')) {
      const role = await getUserRoleFromToken(token);
      if (role !== 'SuperAdmin') {
          // If not a SuperAdmin, redirect to their own dashboard
          console.warn(`Non-SuperAdmin user with role '${role}' attempted to access ${pathname}. Redirecting.`);
          return NextResponse.redirect(new URL('/dashboard', request.url));
      }
  }

  return NextResponse.next();
}

// Matcher to apply the middleware to all paths except for Next.js internal assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
