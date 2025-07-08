import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for streamer earnings summary - forwards requests to the NestJS backend
 * Handles GET /api/earnings/summary/{streamerId}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { streamerId: string } }
) {
  try {
    const { streamerId } = params;
    
    console.log(`API route: GET /api/earnings/summary/${streamerId} request received`);
    
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    console.log('Token:', token ? 'Present' : 'Not present');
    
    // Streamer earnings endpoint requires authentication
    if (!token?.accessToken) {
      console.log('No access token found, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Forward request to the backend
    console.log(`Forwarding request to: ${API_URL}/earnings/summary/${streamerId}`);
    const response = await fetch(`${API_URL}/earnings/summary/${streamerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Streamer earnings summary GET request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch streamer earnings summary', message: errorText },
        { status: response.status }
      );
    }
    
    // Return the backend response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying GET /earnings/summary/{streamerId}:', error);
    return NextResponse.json(
      { error: 'Error processing streamer earnings summary request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
