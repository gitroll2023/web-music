interface ImageCache {
  url: string;
  blob: string;
  timestamp: number;
}

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7일
const CACHE_PREFIX = 'img_cache_';

export async function getCachedImage(url: string): Promise<string> {
  try {
    // localStorage에서 캐시된 이미지 확인
    const cacheKey = CACHE_PREFIX + btoa(url);
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const cache: ImageCache = JSON.parse(cachedData);
      
      // 캐시가 유효한지 확인
      if (Date.now() - cache.timestamp < CACHE_DURATION) {
        return cache.blob;
      }
      // 만료된 캐시 삭제
      localStorage.removeItem(cacheKey);
    }

    // Google Drive URL인 경우 프록시를 통해 가져오기
    if (url.includes('drive.google.com')) {
      const match = url.match(/id=([^&]+)/);
      if (!match) return url;
      
      const imageId = match[1];
      url = `/api/image-proxy?id=${imageId}`;
    }
    
    // 이미지 가져오기
    const response = await fetch(url);
    const blob = await response.blob();
    
    // Blob을 Data URL로 변환
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    
    // 캐시 저장
    const cacheData: ImageCache = {
      url,
      blob: dataUrl,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    return dataUrl;
  } catch (error) {
    console.error('Error caching image:', error);
    return url;
  }
}

// 캐시 정리 함수
export function cleanupImageCache() {
  const now = Date.now();
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      try {
        const cache: ImageCache = JSON.parse(localStorage.getItem(key) || '');
        if (now - cache.timestamp >= CACHE_DURATION) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        // 잘못된 캐시 데이터는 삭제
        localStorage.removeItem(key);
      }
    }
  }
}
