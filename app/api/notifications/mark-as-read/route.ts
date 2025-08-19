import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for marking notifications as read - forwards requests to the NestJS backend
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Mark as read endpoint requires authentication
    if (!token?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const body = await request.json();
    
    // Forward request to the backend
    const response = await fetch(`${API_URL}/notifications/mark-as-read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Mark notifications as read request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to mark notifications as read', message: errorText },
        { status: response.status }
      );
    }
    
    // Return the backend response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying PATCH /notifications/mark-as-read:', error);
    return NextResponse.json(
      { error: 'Error processing mark as read request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
