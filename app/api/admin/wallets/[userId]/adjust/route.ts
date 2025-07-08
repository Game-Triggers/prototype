import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for admin wallet adjustment
 * Handles POST /api/admin/wallets/[userId]/adjust
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log(`API route: POST /api/admin/wallets/${params.userId}/adjust request received`);
    
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    console.log('Token:', token ? 'Present' : 'Not present');
    
    // Admin endpoint requires authentication and admin role
    if (!token?.accessToken) {
      console.log('No access token found, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (token.role !== 'admin') {
      console.log('User is not admin, returning 403');
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    console.log('Request body:', body);

    // Forward request to NestJS backend
    const backendUrl = `${API_URL}/admin/wallets/${params.userId}/adjust`;
    console.log('Forwarding to backend URL:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Backend response status:', response.status);
    console.log('Backend response data:', data);

    if (!response.ok) {
      return NextResponse.json(
        data,
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in admin wallet adjust proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
