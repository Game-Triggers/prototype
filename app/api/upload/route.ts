import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// NestJS API URL from environment variables
const API_URL = process.env.NEST_API_URL || 'http://localhost:3001';

/**
 * Direct file upload handler that forwards file uploads to the NestJS backend
 */
export async function POST(req: NextRequest) {
  try {
    // Get the token from NextAuth session
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // Check if user is authenticated
    if (!token?.accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // The request contains FormData with the file, so clone and forward it as-is
    const formData = await req.formData();
    
    console.log('Proxying file upload to backend...');
    console.log(`Auth token available: ${!!token.accessToken}`);
    
    // Forward the request to the backend
    const response = await fetch(`${API_URL}/api/v1/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
      },
      body: formData,
    });
    
    // Get the response content
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Return the response from the backend
    if (response.ok) {
      return NextResponse.json(data, { status: response.status });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Upload failed',
          error: data,
          status: response.status
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error during file upload:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error processing upload',
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
