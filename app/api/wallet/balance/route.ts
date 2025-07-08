import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for wallet balance - forwards requests to the NestJS backend
 * Handles GET /api/wallet/balance
 */
export async function GET(request: NextRequest) {
  try {
    console.log('API route: GET /api/wallet/balance request received');
    
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    console.log('Token:', token ? 'Present' : 'Not present');
    
    // Wallet balance endpoint requires authentication
    if (!token?.accessToken) {
      console.log('No access token found, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract user ID from token
    const userId = token.sub || token.userId;
    console.log('User ID from token:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in token' },
        { status: 400 }
      );
    }

    // Forward request to NestJS backend
    const backendUrl = `${API_URL}/wallet/balance`;
    console.log('Forwarding to backend URL:', backendUrl);

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
        'User-ID': String(userId),
      },
    });

    console.log('Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error response:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to fetch wallet balance' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log('Successful wallet balance fetch');

    return NextResponse.json(data);

  } catch (error) {
    console.error('Wallet balance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
