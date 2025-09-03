import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Define interface for session with backend tokens
interface SessionWithTokens {
  user?: {
    id?: string;
    email?: string;
    name?: string;
  };
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Get user's keys for a specific category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    // Get session for authentication
    const session = await getServerSession(authOptions) as SessionWithTokens | null;
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get auth token from session
    const authToken = session.accessToken;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Backend authentication token not found' },
        { status: 401 }
      );
    }

    const category = params.category;
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category parameter is required' },
        { status: 400 }
      );
    }

    console.log('G-Keys Category API route: Forwarding to backend:', {
      category,
      hasToken: !!authToken,
    });

    // Forward request to NestJS backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/v1/g-keys/category/${encodeURIComponent(category)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('G-Keys Category API Error:', response.status, errorText);
      
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('G-Keys Category API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
