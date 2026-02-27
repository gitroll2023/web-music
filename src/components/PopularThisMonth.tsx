import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { getLocalFileUrl, getNextImageFallback } from '@/utils/fileUtils';
import type { SongWithChapter } from '@/types';
import { PlayIcon, PlusIcon, QueueListIcon } from '@heroicons/react/24/solid';

interface PopularThisMonthProps {
  songs: SongWithChapter[];
  onSongSelect?: (song: SongWithChapter) => void;
  currentSong?: SongWithChapter | null;
  isPlaying?: boolean;
  onPlayAll?: (songs: SongWithChapter[]) => void;
  onAddAllToPlaylist?: (songs: SongWithChapter[]) => void;
}

export default function PopularThisMonth({ 
  songs, 
  onSongSelect, 
  currentSong, 
  isPlaying,
  onPlayAll,
  onAddAllToPlaylist 
}: PopularThisMonthProps) {
  // popularSong 속성이 있는 노래만 필터링하고 order 속성으로 정렬
  const popularSongs = useMemo(() => 
    songs
      .filter(song => song.popularSong)
      .sort((a, b) => {
        if (a.popularSong && b.popularSong) {
          return a.popularSong.order - b.popularSong.order;
        }
        return 0;
      })
      .slice(0, 2) // 큰 카드 2개만 표시
  , [songs]);

  // 드롭다운 상태 관리
  const [showDropdown, setShowDropdown] = useState(false);

  // 드롭다운 토글
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // 전체 듣기 버튼 핸들러
  const handlePlayAll = () => {
    if (onPlayAll && popularSongs.length > 0) {
      onPlayAll(popularSongs);
      setShowDropdown(false);
    }
  };

  // 전체 재생목록에 추가 핸들러
  const handleAddAllToPlaylist = () => {
    if (onAddAllToPlaylist && popularSongs.length > 0) {
      onAddAllToPlaylist(popularSongs);
      setShowDropdown(false);
    }
  };

  // 이미지 확장자 시도 상태 관리
  const triedExtensions = useRef<Record<string | number, boolean>>({});
  const [fallbackImages, setFallbackImages] = useState<Record<string | number, boolean>>({});

  // 이미지 오류 처리 함수 (jpg → jpeg → png → webp → default)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, songId: string | number) => {
    const imgElement = e.target as HTMLImageElement;
    const next = getNextImageFallback(imgElement.src);
    if (next) {
      imgElement.src = next;
      return;
    }
    setFallbackImages(prev => ({ ...prev, [songId]: true }));
    imgElement.src = '/images/default-album.jpg';
  };

  // 표시할 인기 곡이 없는 경우
  if (popularSongs.length === 0) return null;

  return (
    <div className="space-y-4 mt-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">이달의 인기곡</h2>
        
        <div className="relative">
          <button 
            onClick={toggleDropdown}
            className="flex items-center justify-center w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none active:scale-95"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 top-12 bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden z-10 min-w-[200px] border border-white/10">
              <div className="py-1">
                <button
                  onClick={handlePlayAll}
                  className="flex items-center w-full px-4 py-3 text-white hover:bg-white/10 transition-all duration-200"
                >
                  <PlayIcon className="w-5 h-5 mr-3" />
                  <span>인기곡 전체 듣기</span>
                </button>
                <button
                  onClick={handleAddAllToPlaylist}
                  className="flex items-center w-full px-4 py-3 text-white hover:bg-white/10 transition-all duration-200"
                >
                  <QueueListIcon className="w-5 h-5 mr-3" />
                  <span>재생목록에 추가</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-white/5 via-white/20 to-white/5 my-3"></div>
      </div>
      
      <div className="grid grid-cols-1 gap-5">
        {popularSongs.map((song, index) => (
          <motion.div
            key={song.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden rounded-2xl cursor-pointer shadow-xl group"
            style={{ boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.4)' }}
            onClick={() => onSongSelect?.(song)}
          >
            <div className="aspect-[2/1] relative">
              <Image
                src={getLocalFileUrl(song.fileName, 'image')}
                alt={song.title}
                width={500}
                height={250}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => handleImageError(e, song.id)}
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/80"></div>
              
              {/* 가장 인기 있는 곡에 배지 표시 */}
              {index === 0 && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-bold py-1 px-3 rounded-full shadow-lg">
                  인기 1위
                </div>
              )}
              
              {/* 재생 상태에 따른 버튼 표시 */}
              <div className="absolute bottom-4 right-4">
                <motion.div 
                  className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {currentSong?.id === song.id && isPlaying ? (
                    <span className="text-black text-xl">❚❚</span>
                  ) : (
                    <div className="w-0 h-0 border-t-transparent border-b-transparent border-l-black border-t-[8px] border-b-[8px] border-l-[14px] ml-1"></div>
                  )}
                </motion.div>
              </div>
              
              {/* 곡 정보 */}
              <div className="absolute bottom-4 left-4">
                <h3 className="text-white font-bold text-xl drop-shadow-lg">{song.title}</h3>
                <p className="text-white/80 text-sm drop-shadow-md">{song.artist}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 