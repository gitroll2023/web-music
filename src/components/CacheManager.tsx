'use client';

import { useEffect } from 'react';
import { cleanupImageCache } from '@/utils/imageCache';

export default function CacheManager() {
  useEffect(() => {
    // 앱 시작 시 만료된 이미지 캐시 정리
    cleanupImageCache();
  }, []);

  return null;
}
