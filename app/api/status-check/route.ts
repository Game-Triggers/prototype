import { NextRequest, NextResponse } from 'next/server';

/**
 * API route handler to check if NestJS is accessible
 */
export async function GET(request: NextRequest) {
  const nestJsUrl = process.env.NEST_API_URL || 'http://localhost:3001';
  
  try {
    // Try to reach the NestJS server
    const response = await fetch(`${nestJsUrl}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    // Get the response status
    const status = response.status;
    const text = await response.text();
    
    return NextResponse.json({
      nestJsUrl,
      status,
      responseText: text,
      message: 'NestJS status check',
      success: response.ok
    });
  } catch (error) {
    console.error(`Error connecting to NestJS: ${error}`);
    return NextResponse.json({
      nestJsUrl,
      error: 'Failed to connect to NestJS server',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}