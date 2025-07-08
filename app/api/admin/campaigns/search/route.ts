import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { UserRole } from '@/schemas/user.schema';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    // Forward to NestJS backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const backendResponse = await fetch(`${API_URL}/admin/campaigns/search?query=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Campaign search error:', error);
    return NextResponse.json(
      { error: 'Failed to search campaigns' },
      { status: 500 }
    );
  }
}
