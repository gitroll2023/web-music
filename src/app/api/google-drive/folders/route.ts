import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const drive = google.drive('v3');

async function getGoogleDriveConfig() {
  // DB에서 설정 가져오기
  const config = await prisma.appConfig.findFirst({
    where: {
      OR: [
        { key: 'GOOGLE_DRIVE_CLIENT_ID' },
        { key: 'GOOGLE_DRIVE_CLIENT_SECRET' },
        { key: 'GOOGLE_DRIVE_REFRESH_TOKEN' }
      ]
    },
    select: {
      key: true,
      value: true
    }
  });

  // 환경 변수에서 가져오기
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive configuration is missing');
  }

  return {
    clientId,
    clientSecret,
    refreshToken
  };
}

export async function GET() {
  try {
    const { clientId, clientSecret, refreshToken } = await getGoogleDriveConfig();

    const auth = new google.auth.OAuth2(
      clientId,
      clientSecret
    );
    auth.setCredentials({ refresh_token: refreshToken });

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder'",
      fields: 'files(id, name)',
      auth,
      pageSize: 100
    });

    const folders = response.data.files;
    
    // 폴더 정보를 콘솔에 출력 (디버깅용)
    console.log('Found folders:', folders);
    
    return NextResponse.json(folders);
  } catch (error: any) {
    console.error('Error listing folders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list folders' },
      { status: 500 }
    );
  }
}
