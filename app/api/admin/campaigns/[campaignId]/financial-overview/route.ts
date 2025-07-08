import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for admin campaign financial overview
 * Handles GET /api/admin/campaigns/[campaignId]/financial-overview
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    console.log(`API route: GET /api/admin/campaigns/${params.campaignId}/financial-overview request received`);
    
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
    // Forward request to NestJS backend
    const backendUrl = `${API_URL}/admin/campaigns/${params.campaignId}/financial-overview`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in admin campaign financial overview proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
