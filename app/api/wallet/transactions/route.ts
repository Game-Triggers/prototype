import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function GET(request: NextRequest) {
  try {
    console.log('API route: GET /api/wallet/transactions request received');
    
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = token.sub || token.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in token' },
        { status: 400 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const backendUrl = `${API_URL}/wallet/transactions${queryString ? `?${queryString}` : ''}`;
    console.log('Forwarding to backend URL:', backendUrl);

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
        'User-ID': String(userId),
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error response:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Wallet transactions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
