import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resp = await fetch(`${API_URL}/users/me/streak`, {
    headers: { Authorization: `Bearer ${token.accessToken}` },
    cache: 'no-store',
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resp = await fetch(`${API_URL}/users/me/streak/ping`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.accessToken}`,
    },
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}
