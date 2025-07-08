import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function POST(request: NextRequest) {
  try {
    console.log('API route: POST /api/payments/create-intent request received');
    
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

    // Get request body
    const body = await request.json();
    
    const backendUrl = `${API_URL}/payments/create-intent`;
    console.log('Forwarding to backend URL:', backendUrl);

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
        'User-ID': String(userId),
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error response:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to create payment intent' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Payment create-intent API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
