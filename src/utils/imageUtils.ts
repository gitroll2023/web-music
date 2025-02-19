export function getProxiedImageUrl(googleDriveUrl: string): string {
  // Google Drive URL에서 이미지 ID 추출
  const match = googleDriveUrl.match(/id=([^&]+)/);
  if (!match) return googleDriveUrl;

  const imageId = match[1];
  return `/api/image-proxy?id=${imageId}`;
}
