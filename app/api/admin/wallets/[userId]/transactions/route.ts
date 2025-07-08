import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { UserRole } from '@/schemas/user.schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;

    // Forward to NestJS backend
    const backendResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/v1/admin/wallets/${userId}/transactions`, {
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
    console.error('Wallet transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet transactions' },
      { status: 500 }
    );
  }
}
