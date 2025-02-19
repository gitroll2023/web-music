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

// DELETE /api/google-drive/[fileId]
export async function DELETE(
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

    const fileId = params.fileId;

    await drive.files.delete({
      fileId: fileId,
      auth,
    });

    return NextResponse.json({ success: true });
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
