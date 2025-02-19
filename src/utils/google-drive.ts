// 파일 업로드 함수
import { getApiUrl } from './config';

export async function uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string) {
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer], { type: mimeType }), fileName);

  const response = await fetch(getApiUrl('/api/google-drive/upload'), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return await response.json();
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

// 이미지 파일 URL 가져오기
export async function getImageUrl(fileId: string): Promise<string> {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

// 음원 파일 URL 가져오기
export async function getAudioUrl(fileId: string): Promise<string> {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
