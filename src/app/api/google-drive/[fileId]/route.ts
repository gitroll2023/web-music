import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// DELETE /api/google-drive/[fileId]
export async function DELETE(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    await drive.files.delete({
      fileId: params.fileId
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
