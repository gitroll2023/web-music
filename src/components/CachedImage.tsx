'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { getCachedImage } from '@/utils/imageCache';

interface CachedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
}

export default function CachedImage({ src, alt, ...props }: CachedImageProps) {
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      try {
        const dataUrl = await getCachedImage(src);
        if (isMounted) {
          setCachedSrc(dataUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading cached image:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (isLoading || !cachedSrc) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse ${props.className}`} 
        style={{ width: props.width, height: props.height }}
      />
    );
  }

  return (
    <Image
      {...props}
      src={cachedSrc}
      alt={alt}
    />
  );
}
