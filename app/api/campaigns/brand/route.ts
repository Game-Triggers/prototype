import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for brand campaigns - forwards requests to the NestJS backend
 */
export async function GET(request: NextRequest) {
  try {
    console.log('API route: GET /api/campaigns/brand request received');
    
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    console.log('Token:', token ? 'Present' : 'Not present');
    
    // Brand campaigns endpoint requires authentication
    if (!token?.accessToken) {
      console.log('No access token found, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Forward request to the backend
    console.log(`Forwarding request to: ${API_URL}/campaigns/brand`);
    const response = await fetch(`${API_URL}/campaigns/brand`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Brand campaigns GET request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch brand campaigns', message: errorText },
        { status: response.status }
      );
    }
      // Return the backend response
    const data = await response.json();
    // console.log('Successfully fetched brand campaigns:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying GET /campaigns/brand:', error);
    return NextResponse.json(
      { error: 'Error processing brand campaigns request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
