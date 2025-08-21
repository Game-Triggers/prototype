import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Admin proxy handler for individual campaign details - forwards requests to the NestJS backend
 * This route provides admin-level access to any campaign regardless of ownership
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    // Extract campaign ID from params
    const { campaignId } = await params;
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' }, 
        { status: 400 }
      );
    }

    // Verify JWT token
    const token = await getToken({ req: request });
    
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

    // Forward request to NestJS backend with admin privileges
    const backendUrl = `${API_URL}/campaigns/${campaignId}?adminAccess=true`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend request failed: ${response.status} ${response.statusText}`, errorText);
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch campaign details',
          details: response.statusText,
          status: response.status
        }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Ensure campaign has default values for required fields
    const campaignWithDefaults = {
      ...data,
      impressions: data.impressions || 0,
      clicks: data.clicks || 0,
      participatingStreamers: data.participatingStreamers || 0,
      brandName: data.brandName || 'Unknown Brand',
      categories: data.categories || [],
      languages: data.languages || [],
    };

    return NextResponse.json(campaignWithDefaults);
  } catch (error) {
    console.error('Admin campaign detail proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
