'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Genre } from '@/types';

interface GenreSectionProps {
  onGenreSelect?: (genreId: string) => void;
}

export default function GenreSection({ onGenreSelect }: GenreSectionProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/genres');
        const data = await response.json();
        
        if (data && data.genres && Array.isArray(data.genres)) {
          console.log('API에서 가져온 장르 데이터:', data.genres);
          setGenres(data.genres);
        } else {
          console.log('API 응답 형식이 올바르지 않아 기본 장르 데이터 사용');
          setGenres(getDefaultGenres());
        }
      } catch (error) {
        console.error('Failed to fetch genres:', error);
        console.log('API 호출 실패로 기본 장르 데이터 사용');
        setGenres(getDefaultGenres());
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGenres();
  }, []);
  
  // 기본 장르 데이터
  const getDefaultGenres = (): Genre[] => {
    return [
      { id: 'worship', name: '경배와 찬양', createdAt: new Date(), updatedAt: new Date() },
      { id: 'gospel', name: '가스펠', createdAt: new Date(), updatedAt: new Date() },
      { id: 'ccm', name: 'CCM', createdAt: new Date(), updatedAt: new Date() },
      { id: 'hymn', name: '찬송가', createdAt: new Date(), updatedAt: new Date() },
      { id: 'pop', name: '팝', createdAt: new Date(), updatedAt: new Date() },
      { id: 'rock', name: '락', createdAt: new Date(), updatedAt: new Date() },
      { id: 'hiphop', name: '힙합', createdAt: new Date(), updatedAt: new Date() },
      { id: 'ballad', name: '발라드', createdAt: new Date(), updatedAt: new Date() }
    ];
  };
  
  const handleGenreClick = (genreId: string, genreName: string) => {
    console.log(`장르 클릭: ID=${genreId}, 이름=${genreName}`);
    
    const newSelected = genreId === selectedGenre ? null : genreId;
    setSelectedGenre(newSelected);
    
    if (onGenreSelect) {
      if (newSelected) {
        // 한글 장르 이름 전달 (검색에 더 효과적일 수 있음)
        onGenreSelect(genreName);
      } else {
        onGenreSelect('');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="mt-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">장르별 탐색</h2>
        <div className="animate-pulse flex flex-wrap gap-3 mt-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/10 rounded-xl h-10 w-24"></div>
          ))}
        </div>
      </div>
    );
  }

  if (genres.length === 0) return null;
  
  // 한글 장르 매핑
  const genreNameMap: Record<string, string> = {
    'worship': '경배와 찬양',
    'gospel': '가스펠',
    'contemporary': '컨템포러리',
    'ccm': 'CCM',
    'traditional': '전통',
    'hymn': '찬송가',
    'pop': '팝',
    'rock': '락',
    'rap': '랩',
    'hiphop': '힙합',
    'ballad': '발라드',
    'acoustic': '어쿠스틱'
  };
  
  return (
    <div className="mt-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">장르별 탐색</h2>
      <div className="relative mb-6">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-white/5 via-white/20 to-white/5"></div>
      </div>
      
      <div className="flex flex-wrap gap-3 mt-4">
        {genres.map((genre) => {
          // DB에 저장된 장르명 또는 매핑된 한글 이름 사용
          const displayName = genreNameMap[genre.id.toLowerCase()] || genre.name;
          
          return (
            <motion.button
              key={genre.id}
              onClick={() => handleGenreClick(genre.id, displayName)}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap
                transition-all duration-300 transform hover:scale-105
                ${selectedGenre === genre.id 
                  ? 'bg-white text-black' 
                  : 'bg-white/10 text-white hover:bg-white/20'
                }
              `}
              whileTap={{ scale: 0.95 }}
            >
              {displayName}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
} 