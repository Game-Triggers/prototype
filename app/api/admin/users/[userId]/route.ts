import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params;

    // Forward the request to the backend
    const backendResponse = await fetch(`${API_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      console.error('Backend user fetch error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        error: errorData,
      });

      return NextResponse.json(
        { 
          error: 'Failed to fetch user',
          details: errorData || backendResponse.statusText 
        },
        { status: backendResponse.status }
      );
    }

    const userData = await backendResponse.json();
    return NextResponse.json(userData);

  } catch (error) {
    console.error('Admin user GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params;
    const body = await request.json();

    // Forward the request to the backend
    const backendResponse = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      console.error('Backend user update error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        error: errorData,
      });

      return NextResponse.json(
        { 
          error: 'Failed to update user',
          details: errorData || backendResponse.statusText 
        },
        { status: backendResponse.status }
      );
    }

    const userData = await backendResponse.json();
    return NextResponse.json(userData);

  } catch (error) {
    console.error('Admin user PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params;

    // Forward the request to the backend
    const backendResponse = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      console.error('Backend user delete error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        error: errorData,
      });

      return NextResponse.json(
        { 
          error: 'Failed to delete user',
          details: errorData || backendResponse.statusText 
        },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Admin user DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
