import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check both token.role and token.user.role for admin access
    const userRole = token.role || token.user?.role;
    if (userRole !== 'admin') {
      console.log('DEBUG: Access denied - user role:', userRole);
      return NextResponse.json(
        { error: 'Admin access required', currentRole: userRole },
        { status: 403 }
      );
    }

    // Extract query parameters from the request URL
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Forward the request to the backend with admin authentication
    const backendResponse = await fetch(
      `${API_URL}/users${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.accessToken}`,
        },
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      console.error('Backend user fetch error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        error: errorData,
      });

      return NextResponse.json(
        { 
          error: 'Failed to fetch users',
          details: errorData || backendResponse.statusText 
        },
        { status: backendResponse.status }
      );
    }

    const userData = await backendResponse.json();
    return NextResponse.json(userData);

  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check both token.role and token.user.role for admin access
    const userRole = token.role || token.user?.role;
    if (userRole !== 'admin') {
      console.log('DEBUG: Access denied - user role:', userRole);
      return NextResponse.json(
        { error: 'Admin access required', currentRole: userRole },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();

    // Forward the request to the backend with admin authentication
    const backendResponse = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      console.error('Backend user creation error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        error: errorData,
      });

      return NextResponse.json(
        { 
          error: 'Failed to create user',
          details: errorData || backendResponse.statusText 
        },
        { status: backendResponse.status }
      );
    }

    const userData = await backendResponse.json();
    return NextResponse.json(userData);

  } catch (error) {
    console.error('Admin user creation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
