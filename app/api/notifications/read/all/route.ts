import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for mark all as read - forwards requests to the NestJS backend
 */
export async function PUT(request: NextRequest) {
  try {
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Mark all as read endpoint requires authentication
    if (!token?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Forward request to the backend
    const response = await fetch(`${API_URL}/notifications/read/all`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Mark all as read request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to mark all notifications as read', message: errorText },
        { status: response.status }
      );
    }
    
    // Return the backend response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying PUT /notifications/read/all:', error);
    return NextResponse.json(
      { error: 'Error processing mark all as read request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
