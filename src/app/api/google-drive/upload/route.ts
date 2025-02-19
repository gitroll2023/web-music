import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export async function POST(request: Request) {
  try {
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
      }
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
