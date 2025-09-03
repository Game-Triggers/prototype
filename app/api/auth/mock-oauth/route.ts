import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { provider, email, name } = await request.json();
    
    // Development mode mock OAuth for testing
    if (process.env.NODE_ENV === 'development') {
      const mockProfile = {
        id: `mock_${provider}_${Date.now()}`,
        email: email || `test_${provider}@example.com`,
        name: name || `Test ${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        image: `https://via.placeholder.com/150?text=${provider.toUpperCase()}`,
      };

      // Mock token exchange with backend
      const tokenExchangeUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/${provider}/token-exchange`;
      
      const response = await fetch(tokenExchangeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: `mock_${provider}_access_token_${Date.now()}`,
          refreshToken: `mock_${provider}_refresh_token_${Date.now()}`,
          profile: mockProfile,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          message: `Mock ${provider} authentication successful`,
          user: data.user,
          accessToken: data.accessToken,
        });
      } else {
        const errorText = await response.text();
        return NextResponse.json({
          success: false,
          error: `Backend token exchange failed: ${errorText}`,
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Mock OAuth is only available in development mode',
      }, { status: 400 });
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
