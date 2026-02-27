'use client';

import { useState, useEffect } from 'react';
import { getNextImageFallback } from '@/utils/fileUtils';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export default function CachedImage({ src, alt, ...props }: CachedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setIsLoading(true);
    setImgSrc(src);
    const img = new window.Image();
    img.onload = () => {
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsLoading(false);
    };
    img.src = src;
  }, [src]);

  if (isLoading) {
    return (
      <div
        className={`bg-gray-200 animate-pulse ${props.className || ''}`}
        style={{ width: props.width, height: props.height }}
        role="img"
        aria-label={alt ? `${alt} 로딩 중` : '이미지 로딩 중'}
      />
    );
  }

  const handleError = () => {
    const next = getNextImageFallback(imgSrc);
    if (next) {
      setImgSrc(next);
      return;
    }
    // 모든 확장자 실패 → 기본 이미지
    if (imgSrc !== '/images/default-album.jpg') {
      setImgSrc('/images/default-album.jpg');
    }
  };

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt || '앨범 이미지'}
      onError={handleError}
      loading="lazy"
    />
  );
}
