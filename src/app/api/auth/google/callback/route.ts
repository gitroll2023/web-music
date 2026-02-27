import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getConfig, setConfig } from '@/utils/configManager';

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

    // 성공 페이지로 리다이렉트
    return new NextResponse(
      `
      <html>
        <body>
          <h1>인증 성공!</h1>
          <p>리프레시 토큰이 성공적으로 저장되었습니다.</p>
          <p>이 창을 닫으셔도 됩니다.</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
      `,
      {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    );

  } catch (error) {
    console.error('Error in callback:', error);
    return NextResponse.json({ 
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
