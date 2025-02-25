import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getConfig } from '@/utils/configManager';
import { headers } from 'next/headers';

export async function GET() {
  try {
    // 현재 요청의 URL 정보 로깅
    const headersList = headers();
    const host = headersList.get('host') || '';
    console.log('Current host:', host);
    
    // configManager에서 설정 가져오기
    const clientId = await getConfig('GOOGLE_DRIVE_CLIENT_ID');
    const clientSecret = await getConfig('GOOGLE_DRIVE_CLIENT_SECRET');
    const redirectUri = 'https://biblemusic-gold.vercel.app/api/auth/callback/google';
    
    console.log('Using redirect URI:', redirectUri);
    console.log('Client ID:', clientId);

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'OAuth2 configuration is missing' }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // 인증 URL 생성
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',  // refresh token을 받기 위해 필요
      scope: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly'
      ],
      prompt: 'consent'  // 항상 사용자 동의 화면을 표시하여 refresh token을 받음
    });

    console.log('Generated auth URL:', authUrl);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json({ 
      error: 'Failed to generate auth URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
