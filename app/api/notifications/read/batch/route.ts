import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for batch read operations - forwards requests to the NestJS backend
 */
export async function PUT(request: NextRequest) {
  try {
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Batch read endpoint requires authentication
    if (!token?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const body = await request.json();
    
    // Forward request to the backend
    const response = await fetch(`${API_URL}/notifications/read/batch`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Batch mark as read request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to mark notifications as read', message: errorText },
        { status: response.status }
      );
    }
    
    // Return the backend response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying PUT /notifications/read/batch:', error);
    return NextResponse.json(
      { error: 'Error processing batch mark as read request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
