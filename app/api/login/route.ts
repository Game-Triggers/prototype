import { NextRequest, NextResponse } from 'next/server';
import { authApi } from '@/lib/api-client';

/**
 * API route handler for login
 * This uses the authApi client to ensure consistent behavior with registration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Use the authApi login method which is configured correctly
    const result = await authApi.login({
      email: body.email,
      password: body.password
    });
    
    // Return successful response for NextAuth
    return NextResponse.json(result, { status: 200 });
    
  } catch (error: any) {
    console.error('Login error:', error.message || error);
    
    // Return appropriate error response
    return NextResponse.json(
      { 
        error: 'Login failed', 
        message: error.message || 'Invalid credentials' 
      }, 
      { status: 401 }
    );
  }
}