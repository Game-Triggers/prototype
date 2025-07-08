import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for admin campaign force cancel
 * Handles POST /api/admin/campaigns/[campaignId]/force-cancel
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    console.log(`API route: POST /api/admin/campaigns/${params.campaignId}/force-cancel request received`);
    
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
   // Check both token.role and token.user.role for admin access
    const userRole = token.role || token.user?.role;
    if (userRole !== 'admin') {
      console.log('DEBUG: Access denied - user role:', userRole);
      return NextResponse.json(
        { error: 'Admin access required', currentRole: userRole },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();

    // Forward request to NestJS backend
    const backendUrl = `${API_URL}/admin/campaigns/${params.campaignId}/force-cancel`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in admin campaign force cancel proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
