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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
  }

  try {
    const file = await drive.files.get({
      fileId,
      auth,
      fields: 'webContentLink',
    });

    return NextResponse.json({ url: file.data.webContentLink });
  } catch (error) {
    console.error('Error getting file:', error);
    return NextResponse.json({ error: 'Failed to get file' }, { status: 500 });
  }
}
