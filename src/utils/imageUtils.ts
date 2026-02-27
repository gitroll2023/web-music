export function getProxiedImageUrl(url: string): string {
  if (!url) return '/images/default-album.jpg';
  
  // 이미 로컬 경로인 경우
  if (url.startsWith('/')) return url;
  
  // fileName.jpg 형식인 경우
  if (!url.includes('/') && !url.includes('drive.google.com')) {
    return `/music/${url}`;
  }

  // Google Drive URL 처리
  const match = url.match(/id=([^&]+)/);
  if (!match) return url;

  const imageId = match[1];
  return `/api/image-proxy?id=${imageId}`;
}
