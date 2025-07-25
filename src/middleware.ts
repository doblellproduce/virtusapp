
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NOTE: We cannot use firebase-admin in the middleware as it's not compatible with the Edge Runtime.
// We will just check for the presence of the cookie here. The actual token verification
// will happen in Server Components or API routes that use the token.

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const tokenCookie = request.cookies.get('firebaseIdToken');

    const isPublicPage = ['/', '/login', '/vehiculo'].some(p => pathname.startsWith(p) || p === pathname);
    
    // Allow public pages and API routes to be accessed
    if (isPublicPage || pathname.startsWith('/api/')) {
        return NextResponse.next();
    }
    
    const loginUrl = new URL('/login', request.url);
    
    // If there's no token and the path is protected, redirect to login
    if (!tokenCookie?.value) {
        console.log(`No token found for protected route: ${pathname}. Redirecting to login.`);
        loginUrl.searchParams.set('redirectedFrom', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Token exists, let the request proceed. 
    // Server-side logic in pages/api routes will handle the actual verification.
    return NextResponse.next();
}

// Matcher to apply the middleware to all paths except for static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
