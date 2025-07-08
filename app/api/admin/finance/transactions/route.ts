import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = token.role || token.user?.role;
    if( userRole !== 'admin') {
      console.log('DEBUG: Access denied - user role:', userRole);
      return NextResponse.json(
        { error: 'Admin access required', currentRole: userRole },
        { status: 403 }
      );
    }

    // Forward query parameters
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();

    const response = await fetch(`${API_URL}/admin/finance/transactions?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch transactions', message: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in admin finance transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
