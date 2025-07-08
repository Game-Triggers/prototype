import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * API route to check if a streamer's stream is currently live
 * Proxies the request to the NestJS backend endpoint:
 * GET /stream-verification/status/:userId
 */
export async function GET() {
  try {
    // Get the session to authenticate the request
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user ID from the session
    const userId = session.user.id;
    
    // Forward request to the backend with authorization header
    const response = await fetch(`${API_URL}/stream-verification/status/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
      cache: 'no-store' // Don't cache this response to ensure we get fresh status
    });

    if (!response.ok) {
      // Try to parse the error response
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: 'Failed to check stream status' };
      }
      
      console.error(`Stream status check failed with status ${response.status}:`, errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to check stream status',
          message: errorData.message || 'Unknown error',
          status: response.status
        },
        { status: response.status }
      );
    }

    // Return success response with stream status data
    const streamStatus = await response.json();

    return NextResponse.json({
      success: true,
      ...streamStatus
    });
  } catch (error) {
    console.error('Error checking stream status:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
