import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for admin wallet freeze
 * Handles POST /api/admin/wallets/[userId]/freeze
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log(`API route: POST /api/admin/wallets/${params.userId}/freeze request received`);
    
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Admin endpoint requires authentication and admin role
    if (!token?.accessToken || token.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Forward request to NestJS backend
    const backendUrl = `${API_URL}/admin/wallets/${params.userId}/freeze`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in admin wallet freeze proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
