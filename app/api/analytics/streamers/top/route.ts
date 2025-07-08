import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for top performing streamers - forwards requests to the NestJS backend
 * Handles GET /api/analytics/streamers/top
 */
export async function GET(request: NextRequest) {
  try {
    console.log('API route: GET /api/analytics/streamers/top request received');
    
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    console.log('Token:', token ? 'Present' : 'Not present');
    
    // Top performing streamers endpoint requires authentication
    if (!token?.accessToken) {
      console.log('No access token found, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Forward request to the backend
    console.log(`Forwarding request to: ${API_URL}/analytics/streamers/top`);
    const response = await fetch(`${API_URL}/analytics/streamers/top`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Top performing streamers GET request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch top performing streamers', message: errorText },
        { status: response.status }
      );
    }
    
    // Return the backend response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying GET /analytics/streamers/top:', error);
    return NextResponse.json(
      { error: 'Error processing top performing streamers request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
