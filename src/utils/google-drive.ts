// 파일 업로드 함수
export async function uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string) {
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer], { type: mimeType }), fileName);

  // 환경변수에서 baseUrl을 가져오거나 기본값 사용
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/google-drive/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Upload failed:', data);
    throw new Error(data.error || 'Failed to upload file');
  }

  return data.fileId;  // 파일 ID 반환
}

// 파일 삭제 함수
export async function deleteFile(fileId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/google-drive/${fileId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete file');
  }

  return true;
}

// 이미지 파일 URL 가져오기
export async function getImageUrl(fileId: string): Promise<string> {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

// 음원 파일 URL 가져오기
export async function getAudioUrl(fileId: string): Promise<string> {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
