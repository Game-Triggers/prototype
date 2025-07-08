import { NextRequest, NextResponse } from 'next/server';

// Backend API URL 
const NEST_API_URL = process.env.NEST_API_URL || 'http://localhost:3001';

/**
 * Twitch OAuth token exchange handler
 * This route receives OAuth tokens from the NextAuth JWT callback
 * and exchanges them with the NestJS backend
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Twitch Token Exchange] Request received');
    
    // Parse the request body
    const body = await request.json();
    
    // Log essential info for debugging (no sensitive data)
    console.log('[Twitch Token Exchange] Request data:', {
      hasAccessToken: !!body.accessToken,
      hasProfile: !!body.profile,
      profileId: body.profile?.id,
      profileEmail: body.profile?.email
    });
    
    // Forward to the NestJS backend
    const response = await fetch(`${NEST_API_URL}/auth/twitch/token-exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Twitch Token Exchange] Backend error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: 'Token exchange failed', message: errorText },
        { status: response.status }
      );
    }
    
    // Parse and return successful response
    const data = await response.json();
    console.log('[Twitch Token Exchange] Success, user ID:', data.user?.id);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[Twitch Token Exchange] Error:', error);
    return NextResponse.json(
      { error: 'Token exchange processing error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}