import { NextRequest, NextResponse } from 'next/server';

/**
 * This route handler provides integration with our NestJS backend
 * It proxies requests from Next.js API routes to the NestJS server
 */
export async function GET(request: NextRequest) {
  const nestUrl = process.env.NEST_URL || 'http://localhost:3001';
  const url = new URL(request.url);
  
  try {
    const nestResponse = await fetch(`${nestUrl}${url.pathname}${url.search}`);
    
    // Get response data
    const data = await nestResponse.text();
    const contentType = nestResponse.headers.get('content-type') || 'application/json';
    
    // Create a Next.js response with the same status and data
    return new NextResponse(data, {
      status: nestResponse.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('Error proxying to NestJS:', error);
    return NextResponse.json({ error: 'Failed to connect to API server' }, { status: 500 });
  }
}

// Handle all other HTTP methods by proxying to NestJS
export async function POST(request: NextRequest) {
  return handleRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const nestUrl = process.env.NEST_URL || 'http://localhost:3001';
  const url = new URL(request.url);
  
  try {
    // Get request body if it exists
    let body: string | null = null;
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      body = JSON.stringify(await request.json());
    } else if (request.body) {
      body = await request.text();
    }
    
    // Create fetch options
    const fetchOptions: RequestInit = {
      method: request.method,
      headers: {
        'Content-Type': contentType || 'application/json',
      },
    };
    
    // Add body if it exists
    if (body) {
      fetchOptions.body = body;
    }
    
    // Proxy request to NestJS
    const nestResponse = await fetch(`${nestUrl}${url.pathname}${url.search}`, fetchOptions);
    
    // Get response data
    const data = await nestResponse.text();
    const responseContentType = nestResponse.headers.get('content-type') || 'application/json';
    
    // Create a Next.js response with the same status and data
    return new NextResponse(data, {
      status: nestResponse.status,
      headers: {
        'Content-Type': responseContentType,
      },
    });
  } catch (error) {
    console.error('Error proxying to NestJS:', error);
    return NextResponse.json({ error: 'Failed to connect to API server' }, { status: 500 });
  }
}