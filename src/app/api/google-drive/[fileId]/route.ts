import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 동적 라우트로 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// GET /api/google-drive/[fileId]
export async function GET(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const { clientId, clientSecret, refreshToken } = await getGoogleDriveConfig();

    const auth = new google.auth.OAuth2(
      clientId,
      clientSecret
    );
    auth.setCredentials({ refresh_token: refreshToken });

    const response = await drive.files.get({
      fileId: params.fileId,
      fields: 'id, name, webViewLink',
      auth
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error getting file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get file' },
      { status: 500 }
    );
  }
}

// DELETE /api/google-drive/[fileId]
export async function DELETE(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    await drive.files.delete({
      fileId,
      auth,
    });

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    // 파일이 이미 없는 경우는 성공으로 처리
    if (error.code === 404) {
      return NextResponse.json({ message: 'File already deleted' });
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: 500 }
    );
  }
}
