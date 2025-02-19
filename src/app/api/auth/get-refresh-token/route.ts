import { google } from 'googleapis';
import { NextResponse } from 'next/server';

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

    const { tokens } = await oauth2Client.getToken(code);
    
    return NextResponse.json({
      message: '리프레시 토큰이 성공적으로 발급되었습니다.',
      refresh_token: tokens.refresh_token
    });

  } catch (error) {
    console.error('Error getting refresh token:', error);
    return NextResponse.json({ error: 'Failed to get refresh token' }, { status: 500 });
  }
}
