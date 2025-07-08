import { NextResponse } from 'next/server';
import { authApi } from '@/lib/api-client';

/**
 * POST handler for registration
 * This handler forwards requests from /api/register to /auth/register
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const userData = await request.json();
    
    // Log registration attempt (useful for debugging)
    console.log('Registration attempt for:', userData.email);
    
    // Forward the request to the authApi.register method
    // which is configured to use /auth/register endpoint
    const response = await authApi.register(userData);
    
    // Return the response from the NestJS backend
    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error.message);
    
    // Return appropriate error response
    return NextResponse.json(
      { 
        error: 'Registration failed', 
        message: error.message || 'An unexpected error occurred during registration' 
      }, 
      { status: 400 }
    );
  }
}