// 파일 업로드 함수
import { getApiUrl } from './config';
import { google } from 'googleapis';
import { getAuth } from './auth';

export async function uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string) {
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer]), fileName);
  formData.append('mimeType', mimeType);

  const response = await fetch(`${getApiUrl('/api/upload')}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  return await response.json();
}

// 파일 업로드 상태 확인
export async function checkUploadStatus(taskId: string) {
  const response = await fetch(`${getApiUrl('/api/upload/status')}/${taskId}`);

  if (!response.ok) {
    throw new Error('Failed to check upload status');
  }

  return await response.json();
}

// 파일 삭제
export async function deleteFileFromDrive(fileId: string) {
  try {
    const auth = await getAuth();
    const drive = google.drive({ version: 'v3', auth });

    // 파일이 존재하는지 먼저 확인
    try {
      await drive.files.get({
        fileId: fileId,
        fields: 'id'
      });
    } catch (error: any) {
      if (error.code === 404) {
        console.log('File not found, considering it as already deleted');
        return true;
      }
      throw error;
    }

    // 파일 삭제 시도
    await drive.files.delete({
      fileId: fileId,
    });

    return true;
  } catch (error: any) {
    console.error('Error in deleteFileFromDrive:', error?.message || error);
    // 파일이 이미 없는 경우는 성공으로 처리
    if (error?.code === 404) {
      return true;
    }
    return false;
  }
}

// 이미지 파일 URL 가져오기
export async function getImageUrl(fileId: string): Promise<string> {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

// 오디오 파일 URL 가져오기
export async function getAudioUrl(fileId: string): Promise<string> {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

// 파일 삭제 함수
export async function deleteFile(fileId: string) {
  const response = await fetch(getApiUrl(`/api/google-drive/${fileId}`), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Delete failed');
  }

  return await response.json();
}

// OAuth2 클라이언트 설정
// const oauth2Client = new google.auth.OAuth2(
//   process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID,
//   process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_SECRET,
//   process.env.NEXT_PUBLIC_GOOGLE_DRIVE_REDIRECT_URI
// );

// oauth2Client.setCredentials({
//   refresh_token: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_REFRESH_TOKEN
// });

// export const drive = google.drive({ version: 'v3', auth: oauth2Client });

export const uploadFileToDrive = async (file: File, fileName: string, folderId?: string) => {
  try {
    // Access token 얻기
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID!,
        client_secret: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_SECRET!,
        refresh_token: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_REFRESH_TOKEN!,
        grant_type: 'refresh_token',
      }),
    });

    const { access_token } = await tokenResponse.json();

    // 파일 메타데이터
    const metadata = {
      name: fileName,
      ...(folderId ? { parents: [folderId] } : {}),
    };

    // 멀티파트 요청 생성
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    // 파일 업로드
    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
      body: form,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    const { id } = await uploadResponse.json();

    // 파일 권한 설정
    await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    return {
      fileId: id,
      fileUrl: `https://drive.google.com/uc?export=view&id=${id}`,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};
