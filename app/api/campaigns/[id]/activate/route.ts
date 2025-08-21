import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Brand proxy handler for campaign activation - forwards requests to the NestJS backend
 * This moves campaigns from DRAFT to PENDING status for admin review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = id;
    
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Check authentication
    if (!token?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is brand or admin
    const userRole = token.role || token.user?.role;
    if (userRole !== 'brand' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Brand or admin access required' },
        { status: 403 }
      );
    }
    
    // Forward request to the backend
    const response = await fetch(`${API_URL}/campaigns/${campaignId}/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Campaign activation failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to activate campaign', message: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in campaign activation proxy:', error);
    return NextResponse.json(
      { error: 'Error processing campaign activation request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
