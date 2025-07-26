
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NOTE: We cannot use firebase-admin in the middleware as it's not compatible with the Edge Runtime.
// We will just check for the presence of the cookie here. The actual token verification
// will happen in Server Components or API routes that use the token.

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const tokenCookie = request.cookies.get('firebaseIdToken');

    const isPublicPage = ['/', '/login'].some(p => pathname.startsWith(p)) || pathname.startsWith('/vehiculo/');
    const isAdminAsset = !isPublicPage;

    // Allow public pages and API routes to be accessed without checks
    if (isPublicPage || pathname.startsWith('/api/')) {
        return NextResponse.next();
    }
    
    // If the path is a protected route, check for a token
    if (isAdminAsset) {
      if (!tokenCookie?.value) {
          console.log(`No token found for protected route: ${pathname}. Redirecting to login.`);
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('redirectedFrom', pathname);
          return NextResponse.redirect(loginUrl);
      }
    }

    // Token exists, or it's not a route we need to protect at the middleware level.
    // Let the request proceed. Server-side logic will handle verification if needed.
    return NextResponse.next();
}

// Matcher to apply the middleware to all paths except for static assets
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
