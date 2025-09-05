import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const NEST_API_URL = process.env.NEST_URL || 'http://localhost:3001';

/**
 * Proxy handler for v1 API routes - forwards all requests to the NestJS backend
 * This handles the routing mismatch where frontend expects /api/v1/* but NestJS runs on a separate port
 */
async function handleRequest(request: NextRequest, params: { path: string[] }) {
  try {
    const path = params.path.join('/');
    const url = new URL(request.url);
    
    // Get session token for authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': request.headers.get('content-type') || 'application/json',
    };
    
    // Add authorization header if token exists
    if (token?.accessToken) {
      headers['Authorization'] = `Bearer ${token.accessToken}`;
    }
    
    // Get request body if it exists
    let body: string | null = null;
    if (request.method !== 'GET' && request.method !== 'DELETE') {
      try {
        const contentType = request.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          body = JSON.stringify(await request.json());
        } else if (request.body) {
          body = await request.text();
        }
      } catch (error) {
        // If body parsing fails, continue without body
        console.warn('Failed to parse request body:', error);
      }
    }
    
    // Create fetch options
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };
    
    // Add body if it exists
    if (body) {
      fetchOptions.body = body;
    }
    
    // Forward request to NestJS backend
    const nestUrl = `${NEST_API_URL}/api/v1/${path}${url.search}`;
    console.log(`Proxying ${request.method} request to: ${nestUrl}`);
    
    const response = await fetch(nestUrl, fetchOptions);
    
    // Get response data
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    // Return response with same status and headers
    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Error proxying to NestJS:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to API server',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params);
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params);
}
