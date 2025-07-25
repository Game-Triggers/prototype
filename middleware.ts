import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Configuration
const SECRET = process.env.NEXTAUTH_SECRET;

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/api/auth',
  '/api/login',
  '/api/register',
  '/api/overlay', // Allow public access to overlay endpoints
  '/auth',
  '/_next',
  '/favicon.ico',
  '/api/status-check',
  '/', // Allow access to homepage
];

/**
 * Middleware to handle authentication for Next.js routes
 * - For auth routes: Pass through to NextAuth
 * - For API routes: Add authentication headers 
 * - For protected pages: Redirect to login if not authenticated
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // For API routes, add authentication headers
  if (pathname.startsWith('/api/')) {
    // Get session token
    const token = await getToken({ 
      req: request,
      secret: SECRET,
    });
    
    // If token exists, add it as Authorization header
    if (token?.accessToken) {
      // Add authorization header
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('Authorization', `Bearer ${token.accessToken}`);
      
      // Create a new request with the added headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    
    // If this is an authenticated route but no token, return 401
    return new NextResponse(
      JSON.stringify({ 
        success: false,
        message: 'Authentication required'
      }),
      { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // For protected page routes (not API), redirect to login if not authenticated
  const token = await getToken({ req: request, secret: SECRET });
  if (!token) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Default: Continue to the next middleware or the request handler
  return NextResponse.next();
}

// Configure which paths this middleware will run on
export const config = {
  matcher: [
    // Match all API routes except explicitly public ones
    '/api/:path*',
    // Match all dashboard routes
    '/dashboard/:path*',
    // Exclude Next.js assets and API routes that don't need auth
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};