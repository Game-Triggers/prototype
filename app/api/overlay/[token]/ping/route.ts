import { NextRequest, NextResponse } from 'next/server';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for pinging overlay to check status - forwards requests to the NestJS backend
 * Handles POST /api/overlay/{token}/ping
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Access token after making sure params is awaited properly
    const token = await params.token;
    
    // This is a public endpoint so no authorization is needed
    // Forward request to the backend
    const response = await fetch(`${API_URL}/overlay/${token}/ping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: request.body ? await request.text() : JSON.stringify({})
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Overlay ping POST request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to ping overlay', message: errorText },
        { status: response.status }
      );
    }
    
    // Return the backend response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying POST /overlay/{token}/ping:', error);
    return NextResponse.json(
      { error: 'Error processing overlay ping request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
