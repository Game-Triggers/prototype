import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Test direct API call to login
    const loginResponse = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      return NextResponse.json({ error: 'Login failed', details: loginData }, { status: 401 });
    }
    
    // Now test if we can use this token to access backend
    const testResponse = await fetch('http://localhost:3001/api/v1/users/me/xp', {
      headers: { 
        'Authorization': `Bearer ${loginData.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const testData = await testResponse.json();
    
    return NextResponse.json({
      loginSuccess: true,
      backendTest: {
        status: testResponse.status,
        data: testData
      },
      tokenInfo: {
        hasAccessToken: !!loginData.accessToken,
        tokenStart: loginData.accessToken ? loginData.accessToken.substring(0, 20) + '...' : null
      }
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
