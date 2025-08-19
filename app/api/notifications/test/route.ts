import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for creating test notifications - forwards requests to the NestJS backend
 */
export async function POST(request: NextRequest) {
  try {
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Test notification endpoint requires authentication
    if (!token?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Forward request to the backend
    const response = await fetch(`${API_URL}/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Create test notification request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to create test notification', message: errorText },
        { status: response.status }
      );
    }
    
    // Return the backend response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying POST /notifications/test:', error);
    return NextResponse.json(
      { error: 'Error processing test notification request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
