import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const NEST_API_URL = process.env.NEST_API_URL || 'http://localhost:3001';

/**
 * Token validation endpoint for debugging authentication
 * Validates the current session token and returns user information
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from NextAuth session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token) {
      return NextResponse.json(
        { valid: false, message: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    // Return the parsed token data for debugging
    return NextResponse.json({
      valid: true,
      token: {
        // Only return non-sensitive data
        sub: token.sub,
        email: token.email,
        name: token.name,
        role: token.user?.role || token.role,
        expiresAt: token.expiresAt,
        // Include basic user info but not tokens
        user: token.user ? {
          id: token.user.id,
          email: token.user.email,
          name: token.user.name,
          role: token.user.role,
        } : undefined
      }
    });
  } catch (error) {
    console.error(`Error validating token: ${error}`);
    return NextResponse.json(
      { valid: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Validate a specific token by sending it to the backend
 * This is useful for validating tokens from other sources
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.token) {
      return NextResponse.json(
        { valid: false, message: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Forward the request to NestJS backend validate endpoint
    const response = await fetch(`${NEST_API_URL}/auth/validate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: body.token }),
    });
    
    // Get the validation result
    const data = await response.json();
    
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(`Error in token validation: ${error}`);
    return NextResponse.json(
      { valid: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}