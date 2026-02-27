import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getConfig, setConfig } from '@/utils/configManager';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is missing' }, { status: 400 });
    }

    // configManager에서 설정 가져오기
    const clientId = await getConfig('GOOGLE_DRIVE_CLIENT_ID');
    const clientSecret = await getConfig('GOOGLE_DRIVE_CLIENT_SECRET');
    const redirectUri = await getConfig('GOOGLE_DRIVE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json({ error: 'OAuth2 configuration is missing' }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // 인증 코드로 토큰 발급
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      return NextResponse.json({ error: 'No refresh token in response' }, { status: 400 });
    }

    // refresh token을 DB에 저장
    await setConfig('GOOGLE_DRIVE_REFRESH_TOKEN', tokens.refresh_token);
    
    return NextResponse.json({
      message: '리프레시 토큰이 성공적으로 발급되고 저장되었습니다.',
      refresh_token: tokens.refresh_token
    });

  } catch (error) {
    console.error('Error getting refresh token:', error);
    return NextResponse.json({ 
      error: 'Failed to get refresh token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
