import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { EurekaRole, RoleManager, Portal } from './lib/eureka-roles';

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

// Portal-specific route mapping
const PORTAL_ROUTES = {
  [Portal.BRAND]: [
    '/dashboard/brand',
    '/campaigns',
    '/analytics/brand',
    '/billing',
    '/team-management',
  ],
  [Portal.ADMIN]: [
    '/dashboard/admin',
    '/admin',
    '/system-config',
    '/user-management',
    '/platform-analytics',
    '/support-tickets',
  ],
  [Portal.PUBLISHER]: [
    '/dashboard/publisher',
    '/dashboard', // Default dashboard for streamers
    '/campaigns/browse',
    '/analytics/publisher',
    '/earnings',
    '/profile-settings',
  ],
};

/**
 * Map legacy role to Eureka role
 */
function mapToEurekaRole(role: string): EurekaRole {
  if (Object.values(EurekaRole).includes(role as EurekaRole)) {
    return role as EurekaRole;
  }
  
  switch (role.toLowerCase()) {
    case 'streamer':
      return EurekaRole.STREAMER_INDIVIDUAL;
    case 'brand':
      return EurekaRole.CAMPAIGN_MANAGER;
    case 'admin':
      return EurekaRole.ADMIN_EXCHANGE;
    default:
      return EurekaRole.STREAMER_INDIVIDUAL;
  }
}

/**
 * Check if user has access to a specific route based on their portal
 */
function hasRouteAccess(pathname: string, userPortal: Portal): boolean {
  // Allow access to common routes
  if (pathname === '/dashboard' || pathname.startsWith('/settings') || pathname.startsWith('/profile')) {
    return true;
  }

  // Check portal-specific routes
  const allowedRoutes = PORTAL_ROUTES[userPortal];
  return allowedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Get default redirect route for user's portal
 */
function getDefaultRoute(userPortal: Portal): string {
  switch (userPortal) {
    case Portal.BRAND:
      return '/dashboard/brand';
    case Portal.ADMIN:
      return '/dashboard/admin';
    case Portal.PUBLISHER:
      return '/dashboard/publisher';
    default:
      return '/dashboard';
  }
}

/**
 * Enhanced Middleware with Role-Based Access Control
 * - For auth routes: Pass through to NextAuth
 * - For API routes: Add authentication headers 
 * - For protected pages: Redirect to login if not authenticated
 * - For role-based routing: Redirect to appropriate portal or deny access
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Get session token
  const token = await getToken({ 
    req: request,
    secret: SECRET,
  });

  // For API routes, add authentication headers
  if (pathname.startsWith('/api/')) {
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
  if (!token) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Role-based routing for authenticated users
  if (token.user?.role) {
    const userRole = mapToEurekaRole(token.user.role as string);
    const userPortal = RoleManager.getPortal(userRole);

    // Check if user is accessing a route outside their portal
    if (!hasRouteAccess(pathname, userPortal)) {
      // If user is trying to access wrong portal, redirect to their default route
      if (pathname.startsWith('/dashboard/') && pathname !== '/dashboard') {
        const defaultRoute = getDefaultRoute(userPortal);
        const url = new URL(defaultRoute, request.url);
        return NextResponse.redirect(url);
      }
      
      // For other unauthorized routes, show access denied
      const url = new URL('/access-denied', request.url);
      url.searchParams.set('reason', 'portal-mismatch');
      url.searchParams.set('requiredPortal', userPortal);
      return NextResponse.redirect(url);
    }

    // If user accesses generic /dashboard, redirect to their portal-specific dashboard
    if (pathname === '/dashboard') {
      const defaultRoute = getDefaultRoute(userPortal);
      const url = new URL(defaultRoute, request.url);
      return NextResponse.redirect(url);
    }
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