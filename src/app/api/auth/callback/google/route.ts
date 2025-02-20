import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'No authorization code' }, { status: 400 });
    }

    console.log('Received authorization code:', code);

    // Google OAuth2 토큰 엔드포인트로 요청
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
        redirect_uri: 'http://localhost:3000/api/auth/callback/google',
        grant_type: 'authorization_code',
      }),
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token error:', data);
      return NextResponse.json(
        { error: 'Failed to get token' },
        { status: tokenResponse.status }
      );
    }

    console.log('Received tokens:', {
      access_token: data.access_token ? '(present)' : '(missing)',
      refresh_token: data.refresh_token ? '(present)' : '(missing)',
      expires_in: data.expires_in
    });

    // refresh_token이 포함된 응답
    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });

  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
