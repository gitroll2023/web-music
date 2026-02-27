export const extractGoogleDriveFileId = (url: string): string | null => {
  if (!url) return null;

  // 구글 드라이브 URL에서 id 파라미터 추출
  const match = url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
};

// 지원하는 이미지 확장자 목록
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export const getLocalFileUrl = (fileName: string | null, type: 'audio' | 'image'): string => {
  if (!fileName) {
    return type === 'image' ? '/images/default-album.jpg' : '';
  }

  // 파일 이름에서 확장자 제거
  const baseFileName = fileName.replace(/\.(mp3|jpg|jpeg|png|webp)$/, '');

  if (type === 'audio') {
    return `/music/${baseFileName}.mp3`;
  }

  // 이미지: 기본적으로 jpg 반환 (CachedImage에서 fallback 처리)
  return `/music/${baseFileName}.jpg`;
};

/** CachedImage / onError에서 사용할 다음 확장자 URL 반환 */
export const getNextImageFallback = (currentSrc: string): string | null => {
  for (let i = 0; i < IMAGE_EXTENSIONS.length; i++) {
    const ext = IMAGE_EXTENSIONS[i];
    if (currentSrc.endsWith(`.${ext}`)) {
      // 다음 확장자가 있으면 시도
      if (i + 1 < IMAGE_EXTENSIONS.length) {
        return currentSrc.replace(new RegExp(`\\.${ext}$`), `.${IMAGE_EXTENSIONS[i + 1]}`);
      }
      // 마지막 확장자까지 실패 → null (default-album 사용)
      return null;
    }
  }
  return null;
};
