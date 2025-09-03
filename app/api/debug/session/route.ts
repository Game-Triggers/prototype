import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    // Get the JWT token
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    return NextResponse.json({
      session: session ? {
        user: session.user,
        accessToken: 'accessToken' in session && session.accessToken ? 'Present' : 'Missing',
        refreshToken: 'refreshToken' in session && session.refreshToken ? 'Present' : 'Missing',
        expires: session.expires,
        sessionKeys: Object.keys(session)
      } : null,
      token: token ? {
        sub: token.sub,
        email: token.email,
        accessToken: token.accessToken ? 'Present' : 'Missing',
        refreshToken: token.refreshToken ? 'Present' : 'Missing',
        expiresAt: token.expiresAt,
        user: token.user ? {
          id: token.user.id,
          email: token.user.email,
          role: token.user.role
        } : 'Missing',
        tokenKeys: Object.keys(token),
        accessTokenType: typeof token.accessToken,
        accessTokenFirst10: token.accessToken ? String(token.accessToken).substring(0, 10) + '...' : null
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
