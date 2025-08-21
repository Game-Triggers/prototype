import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    console.log('API route: GET /api/users/me/level request received');

    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.log('No session or access token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Token: Present');

    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/api/v1/users/me/level`;
    console.log(`Forwarding request to: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      return NextResponse.json(
        { error: 'Backend request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
