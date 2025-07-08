import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Admin proxy handler for campaign deletion - forwards requests to the NestJS backend
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const campaignId = params.campaignId;
    
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Check authentication and admin role
    if (!token?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = token.role || token.user?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Forward request to the backend
    const response = await fetch(`${API_URL}/campaigns/${campaignId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Campaign deletion failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to delete campaign', message: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in admin campaign deletion proxy:', error);
    return NextResponse.json(
      { error: 'Error processing campaign deletion request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
