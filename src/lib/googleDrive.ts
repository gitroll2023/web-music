import { google } from 'googleapis';
import { getConfig } from '@/utils/configManager';

let oauth2Client: any = null;
let drive: any = null;

async function initializeGoogleDrive() {
  if (!oauth2Client) {
    const clientId = await getConfig('GOOGLE_DRIVE_CLIENT_ID');
    const clientSecret = await getConfig('GOOGLE_DRIVE_CLIENT_SECRET');
    const redirectUri = await getConfig('GOOGLE_DRIVE_REDIRECT_URI');
    const refreshToken = await getConfig('GOOGLE_DRIVE_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
      throw new Error('Missing Google Drive configuration');
    }

    oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    drive = google.drive({ version: 'v3', auth: oauth2Client });
  }
  return drive;
}

// 구글 드라이브 직접 링크 가져오기
export async function getGoogleDriveDirectLink(fileId: string): Promise<string | null> {
  try {
    const driveClient = await initializeGoogleDrive();

    // 파일 메타데이터 가져오기
    const file = await driveClient.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, webContentLink',
      supportsAllDrives: true,
    });

    if (!file.data.id) {
      throw new Error('File not found');
    }

    // 파일 타입에 따라 다른 URL 형식 사용
    const mimeType = file.data.mimeType;
    if (mimeType?.includes('audio')) {
      // 오디오 파일인 경우
      if (!file.data.webContentLink) {
        throw new Error('No webContentLink available');
      }
      return file.data.webContentLink;
    } else {
      // 이미지 등 다른 파일인 경우
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  } catch (error) {
    console.error('Error getting Google Drive direct link:', error);
    
    // 토큰 만료 에러인 경우 클라이언트 초기화
    if (error instanceof Error && 
        (error.message.includes('invalid_grant') || error.message.includes('token expired'))) {
      oauth2Client = null;
      drive = null;
      return getGoogleDriveDirectLink(fileId);  // 재시도
    }
    
    return null;
  }
}
