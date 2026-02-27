import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const drive = google.drive('v3');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

export async function POST(request: Request) {
  try {
    const { name, parentId } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const fileMetadata: any = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id,name,webViewLink',
      auth,
    });

    // 폴더를 공개로 설정
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      auth,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
