import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface CampaignData {
  impressions?: number;
  clicks?: number;
  participatingStreamers?: number;
  brandName?: string;
  [key: string]: unknown;
}

/**
 * Admin proxy handler for campaigns - forwards requests to the NestJS backend
 * This route provides admin-level access to all campaigns regardless of status
 */
export async function GET(request: NextRequest) {
  try {
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

    // Check both token.role and token.user.role for admin access
    const userRole = token.role || token.user?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Create headers for the backend request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.accessToken}`,
    };

    // Extract query parameters from the request URL
    const { searchParams } = new URL(request.url);
    
    // For admin access, we want to override the default behavior of only showing active campaigns
    // So we'll set a special admin flag or modify the query
    const modifiedSearchParams = new URLSearchParams(searchParams);
    
    // Add admin context - this tells the backend to show all campaigns regardless of status
    modifiedSearchParams.set('adminAccess', 'true');
    
    const queryString = modifiedSearchParams.toString();
    const backendUrl = `${API_URL}/campaigns${queryString ? `?${queryString}` : ''}`;
    
    console.log('Admin campaigns proxy: forwarding to', backendUrl);
    
    // Forward request to the backend with query parameters
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Admin campaigns request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch campaigns', message: errorText },
        { status: response.status }
      );
    }
    
    // Return the backend response with data sanitization
    const data = await response.json();
    
    // Ensure campaigns have default values for required fields
    if (data.campaigns && Array.isArray(data.campaigns)) {
      data.campaigns = data.campaigns.map((campaign: CampaignData) => ({
        ...campaign,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        participatingStreamers: campaign.participatingStreamers || 0,
        brandName: campaign.brandName || 'Unknown Brand',
      }));
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in admin campaigns proxy:', error);
    return NextResponse.json(
      { error: 'Error processing admin campaigns request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
