import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for admin financial dashboard
 * Handles GET /api/admin/dashboard/financial
 */
export async function GET(request: NextRequest) {
  try {
    console.log('API route: GET /api/admin/dashboard/financial request received');
    
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    console.log('Token details:', {
      exists: !!token,
      accessToken: !!token?.accessToken,
      role: token?.role || token?.user?.role,
      email: token?.email || token?.user?.email,
      userId: token?.sub || token?.userId,
      tokenKeys: token ? Object.keys(token) : 'none'
    });
    
    // Check if user is authenticated and has admin role
    if (!token || !token.accessToken) {
      console.log('No valid session token or access token');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = token.role || token.user?.role;
    if (userRole !== 'admin') {
      console.log('User is not admin:', { userRole, expected: 'admin' });
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Forward request to NestJS backend
    const backendUrl = `${API_URL}/admin/dashboard/financial`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in admin financial dashboard proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
