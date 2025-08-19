import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for notifications - forwards requests to the NestJS backend
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Create headers for the backend request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if token exists
    if (token?.accessToken) {
      headers['Authorization'] = `Bearer ${token.accessToken}`;
    }

    // Extract query parameters from the request URL
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const backendUrl = `${API_URL}/notifications${queryString ? `?${queryString}` : ''}`;
    
    // Forward request to the backend with query parameters
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Notifications GET request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch notifications', message: errorText },
        { status: response.status }
      );
    }
    
    // Return the backend response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying GET /notifications:', error);
    return NextResponse.json(
      { error: 'Error processing notifications request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Create notification endpoint requires authentication
    if (!token?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const body = await request.json();
    
    // Forward request to the backend
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Notifications POST request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to create notification', message: errorText },
        { status: response.status }
      );
    }
    
    // Return the backend response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying POST /notifications:', error);
    return NextResponse.json(
      { error: 'Error processing notification creation request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
