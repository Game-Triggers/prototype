import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for advanced analytics data - forwards requests to the NestJS backend
 * Handles GET /api/analytics/advanced
 */
export async function GET(request: NextRequest) {
  try {
    console.log('API route: GET /api/analytics/advanced request received');
    
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    console.log('Token:', token ? 'Present' : 'Not present');
    
    // Advanced analytics endpoint requires authentication
    if (!token?.accessToken) {
      console.log('No access token found, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters from request
    const { searchParams } = new URL(request.url);
    const queryParams = new URLSearchParams();
    
    // Forward relevant query parameters
    for (const [key, value] of searchParams.entries()) {
      queryParams.append(key, value);
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    // Forward request to the backend
    console.log(`Forwarding request to: ${API_URL}/analytics/advanced${queryString}`);
    const response = await fetch(`${API_URL}/analytics/advanced${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Advanced analytics GET request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch advanced analytics data', message: errorText },
        { status: response.status }
      );
    }
    
    // Return the backend response
    const data = await response.json();
    console.log('Advanced analytics data fetched successfully');
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error in /api/analytics/advanced:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
