import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

// Refresh Token 설정
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// 구글 드라이브 직접 링크 가져오기
export async function getGoogleDriveDirectLink(fileId: string): Promise<string | null> {
  try {
    // 파일 메타데이터 가져오기
    const file = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType',
      supportsAllDrives: true,
    });

    if (!file.data.id) {
      throw new Error('File not found');
    }

    // 파일 타입에 따라 다른 URL 형식 사용
    const mimeType = file.data.mimeType;
    if (mimeType?.includes('audio')) {
      // 오디오 파일인 경우
      const accessToken = (await oauth2Client.getAccessToken()).token;
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }
      return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${accessToken}`;
    } else {
      // 이미지 등 다른 파일인 경우
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  } catch (error) {
    console.error('Error getting Google Drive direct link:', error);
    return null;
  }
}
