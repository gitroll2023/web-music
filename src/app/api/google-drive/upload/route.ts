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

export async function POST(request: Request) {
  try {
    const { clientId, clientSecret, refreshToken } = await getGoogleDriveConfig();

    const auth = new google.auth.OAuth2(
      clientId,
      clientSecret
    );
    auth.setCredentials({ refresh_token: refreshToken });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const fileMetadata = {
      name: file.name
    };

    const media = {
      mimeType: file.type,
      body: stream
    };

    const uploadedFile = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      auth,
      fields: 'id,name'
    }).then(res => res.data);

    if (!uploadedFile.id || !uploadedFile.name) {
      throw new Error('Failed to upload file');
    }

    // 파일을 공개로 설정
    await drive.permissions.create({
      fileId: uploadedFile.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      },
      auth
    });

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileId: uploadedFile.id,
      fileName: uploadedFile.name
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
