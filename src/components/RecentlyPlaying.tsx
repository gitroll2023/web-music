import type { SongWithChapter } from '@/types';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { useDragScroll } from '@/hooks/useDragScroll';
import { getLocalFileUrl, getNextImageFallback } from '@/utils/fileUtils';
import { PlayIcon, PlusIcon, QueueListIcon } from '@heroicons/react/24/solid';

interface RecentlyPlayingProps {
  songs: SongWithChapter[];
  onSongSelect?: (song: SongWithChapter) => void;
  currentSong?: SongWithChapter | null;
  isPlaying?: boolean;
  onPlayAll?: (songs: SongWithChapter[]) => void;
  onAddAllToPlaylist?: (songs: SongWithChapter[]) => void;
}

export default function RecentlyPlaying({ 
  songs, 
  onSongSelect, 
  currentSong, 
  isPlaying,
  onPlayAll,
  onAddAllToPlaylist
}: RecentlyPlayingProps) {
  // 최대 5개까지만 표시
  const recentSongs = songs.slice(0, 5);
  
  // 드롭다운 상태 관리
  const [showDropdown, setShowDropdown] = useState(false);

  // 드롭다운 토글
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // 전체 듣기 버튼 핸들러
  const handlePlayAll = () => {
    if (onPlayAll && recentSongs.length > 0) {
      onPlayAll(recentSongs);
      setShowDropdown(false);
    }
  };

  // 전체 재생목록에 추가 핸들러
  const handleAddAllToPlaylist = () => {
    if (onAddAllToPlaylist && recentSongs.length > 0) {
      onAddAllToPlaylist(recentSongs);
      setShowDropdown(false);
    }
  };

  const { dragProps } = useDragScroll();

  // 피그마 이미지는 폴백용으로만 사용
  const fallbackImages = [
    '/assets/album1.png',
    '/assets/album2.png',
    '/assets/album3.png',
    '/assets/album4.png',
    '/assets/album5.png'
  ];

  // 실패한 이미지 추적
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  // 이미지 확장자 추적 (jpg/jpeg)
  const triedJpeg = useRef<Record<string, boolean>>({});

  // 이미지 URL 가져오기 (실패 시 폴백 이미지 반환)
  const getImageUrl = (song: SongWithChapter, index: number) => {
    if (failedImages[song.id]) {
      return fallbackImages[index % fallbackImages.length];
    }
    return getLocalFileUrl(song.fileName, 'image');
  };

  // 이미지 로드 실패 처리 (jpg → jpeg → png → webp → default)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, songId: number | string) => {
    const imgElement = e.target as HTMLImageElement;
    const next = getNextImageFallback(imgElement.src);
    if (next) {
      imgElement.src = next;
      return;
    }
    // 모든 확장자를 시도한 후에도 실패하면 폴백 이미지 사용
    setFailedImages(prev => ({
      ...prev,
      [songId]: true
    }));
  };

  return (
    <div className="space-y-4 mt-10 mb-10 px-1">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">신규 곡</h2>
        
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
                  <span>신규곡 전체 듣기</span>
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
        
        <div className="flex items-center justify-between mt-5 mb-4">
          <p className="text-sm text-white/70">새롭게 추가된 노래</p>
        </div>
      </div>
      
      <div {...dragProps} className="overflow-x-auto hide-scrollbar pb-2">
        <div className="flex space-x-5" style={{ minWidth: 'fit-content' }}>
          {recentSongs.length > 0 ? (
            recentSongs.map((song, index) => (
              <motion.div
                key={song.id}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.03 }}
                className="flex-shrink-0 cursor-pointer group"
                style={{ width: '140px' }}
                onClick={() => onSongSelect?.(song)}
              >
                <div className="relative">
                  <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${currentSong?.id === song.id && isPlaying ? 'ring-2 ring-white/40 shadow-lg shadow-white/10' : ''}`} style={{
                    boxShadow: currentSong?.id === song.id && isPlaying ? undefined : '0px 4px 12px 0px rgba(0, 0, 0, 0.35)',
                    width: '140px',
                    height: '140px'
                  }}>
                    <Image
                      src={getImageUrl(song, index)}
                      alt={song.title}
                      width={140}
                      height={140}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => handleImageError(e, song.id)}
                      unoptimized
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                  </div>

                  {/* NEW 배지 */}
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-yellow-500 text-white text-[10px] font-bold py-0.5 px-2 rounded-full shadow-lg">
                    NEW
                  </div>

                  {/* 선택된 노래가 아닌 경우에만 재생 버튼 표시 */}
                  {currentSong?.id !== song.id && (
                    <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-0 h-0 border-t-transparent border-b-transparent border-l-black border-t-[3px] border-b-[3px] border-l-[5px] ml-0.5"></div>
                    </div>
                  )}

                  {/* 현재 재생중인 노래는 재생/일시정지 아이콘 표시 */}
                  {currentSong?.id === song.id && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                        {isPlaying ? (
                          <div className="flex items-end gap-0.5 h-4">
                            <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        ) : (
                          <div className="w-0 h-0 border-t-transparent border-b-transparent border-l-white border-t-[6px] border-b-[6px] border-l-[10px] ml-1"></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-1 mt-2">
                  <h3 className="font-semibold text-sm truncate">{song.title}</h3>
                  <p className="text-xs text-white/50 truncate">{song.artist}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="w-full text-center py-8 text-white/50">
              <p>신규 곡이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 