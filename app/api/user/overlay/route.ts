import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for fetching user overlay settings from the NestJS backend
 * Handles GET /api/user/overlay
 */
export async function GET() {
  try {
    // Get the session to ensure the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Forward request to the backend with authorization header
    const response = await fetch(`${API_URL}/users/me/overlay`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Don't cache this response
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Overlay settings request failed with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch overlay settings', message: errorText },
        { status: response.status }
      );
    }
    
    // Get the response data
    const overlayData = await response.json();
    
    // Return the response with the overlayToken and add role info for page logic
    return NextResponse.json({
      ...overlayData,
      role: session.user.role || 'unknown'
    });
  } catch (error) {
    console.error('Error proxying GET /users/me/overlay:', error);
    return NextResponse.json(
      { error: 'Error processing overlay settings request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
