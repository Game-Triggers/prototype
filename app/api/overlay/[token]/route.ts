import { NextRequest, NextResponse } from 'next/server';

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for fetching overlay by token - forwards requests to the NestJS backend
 * Handles GET /api/overlay/{token}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Access token after making sure params is awaited properly
    const token = await params.token;
    console.log(`Overlay token received: ${token}`);
    
    // This is a public endpoint so no authorization is needed
    // Forward request to the backend
    const response = await fetch(`${API_URL}/overlay/${token}`, {
      method: 'GET',
      headers: {
        'Accept': '*/*' // Accept any content type
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Overlay GET request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch overlay data', message: errorText },
        { status: response.status }
      );
    }
    
    // Get content type to handle response appropriately
    const contentType = response.headers.get('content-type');
    
    // If it's HTML content, return it as HTML
    if (contentType?.includes('text/html')) {
      const htmlContent = await response.text();
      return new NextResponse(htmlContent, {
        status: response.status,
        headers: {
          'Content-Type': contentType
        }
      });
    }
      // Otherwise, parse as JSON as before
    try {
      const data = await response.json();
      return NextResponse.json(data);
    } catch (_) {
      // If JSON parsing fails, return the raw text
      const textContent = await response.text();
      return new NextResponse(textContent, {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'text/plain'
        }
      });
    }
  } catch (error) {
    console.error('Error proxying GET /overlay/{token}:', error);
    return NextResponse.json(
      { error: 'Error processing overlay request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
