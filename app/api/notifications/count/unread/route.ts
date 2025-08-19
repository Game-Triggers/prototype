import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for fetching unread notifications count - forwards requests to the NestJS backend
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

    // Forward request to the backend
    const response = await fetch(`${API_URL}/notifications/count/unread`, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Unread count GET request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch unread count', message: errorText },
        { status: response.status }
      );
    }
    
    // Return the backend response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying GET /notifications/count/unread:', error);
    return NextResponse.json(
      { error: 'Error processing unread count request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
