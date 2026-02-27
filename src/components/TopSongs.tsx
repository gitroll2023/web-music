import { useMemo, useRef, useState } from 'react';
import { useDragScroll } from '@/hooks/useDragScroll';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { getLocalFileUrl } from '@/utils/fileUtils';
import type { SongWithChapter } from '@/types';
import { PlayIcon, PlusIcon, QueueListIcon } from '@heroicons/react/24/solid';
import { getNextImageFallback } from '@/utils/fileUtils';

interface TopSongsProps {
  songs: SongWithChapter[];
  onSongSelect?: (song: SongWithChapter) => void;
  currentSong?: SongWithChapter | null;
  isPlaying?: boolean;
  onPlayAll?: (songs: SongWithChapter[]) => void;
  onAddAllToPlaylist?: (songs: SongWithChapter[]) => void;
}

// 순위별 색상
const RANK_COLORS = {
  0: 'text-yellow-400',
  1: 'text-gray-300',
  2: 'text-amber-600',
};

export default function TopSongs({ 
  songs, 
  onSongSelect, 
  currentSong, 
  isPlaying, 
  onPlayAll,
  onAddAllToPlaylist
}: TopSongsProps) {
  // popularSong 속성이 있는 노래 중에서 상위 9개까지 선택 (페이지당 3개씩 3페이지)
  const topSongs = useMemo(() => 
    songs
      .filter(song => song.popularSong)
      .sort((a, b) => {
        if (a.popularSong && b.popularSong) {
          return a.popularSong.order - b.popularSong.order;
        }
        return 0;
      })
      .slice(0, 9) // 상위 9곡 표시 (3페이지)
  , [songs]);

  // 드롭다운 상태 관리
  const [showDropdown, setShowDropdown] = useState(false);

  // 드롭다운 토글
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // 전체 듣기 버튼 핸들러
  const handlePlayAll = () => {
    if (onPlayAll && topSongs.length > 0) {
      onPlayAll(topSongs);
      setShowDropdown(false);
    }
  };

  // 전체 재생목록에 추가 핸들러
  const handleAddAllToPlaylist = () => {
    if (onAddAllToPlaylist && topSongs.length > 0) {
      onAddAllToPlaylist(topSongs);
      setShowDropdown(false);
    }
  };

  // 이미지 확장자 시도 상태 관리
  const triedExtensions = useRef<Record<string | number, boolean>>({});
  const [fallbackImages, setFallbackImages] = useState<Record<string | number, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const { dragProps } = useDragScroll();

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

  // 노래를 페이지로 그룹화 (한 페이지당 3개)
  const groupSongsIntoPages = (songs: SongWithChapter[]) => {
    const pages = [];
    for (let i = 0; i < songs.length; i += 3) {
      pages.push(songs.slice(i, i + 3));
    }
    return pages;
  };

  // 페이지 별로 그룹화된 인기 곡
  const songPages = useMemo(() => groupSongsIntoPages(topSongs), [topSongs]);

  // 표시할 인기 곡이 없는 경우
  if (topSongs.length === 0) return null;

  return (
    <div className="space-y-4 mt-10 mb-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">인기 차트</h2>
        
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
                  <span>인기차트 전체 듣기</span>
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
      
      {/* 스와이프 가능한 컨테이너 */}
      <div
        {...dragProps}
        className="overflow-x-auto hide-scrollbar"
      >
        <div className="flex pr-10 space-x-4">
          {songPages.map((page, pageIndex) => (
            <div 
              key={`page-${pageIndex}`}
              className="flex-shrink-0 rounded-xl overflow-hidden backdrop-blur-md bg-white/5 border border-white/5 shadow-lg"
              style={{
                width: 'calc(100% - 50px)',
                minWidth: 'calc(100% - 50px)',
              }}
            >
              <div className="flex flex-col">
                {page.map((song, index) => {
                  const globalIndex = pageIndex * 3 + index; // 전체 순위 계산
                  return (
                    <motion.div
                      key={song.id}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center space-x-3 p-3 cursor-pointer transition-all duration-200 ${
                        index !== page.length - 1 ? 'border-b border-white/[0.06]' : ''
                      } ${currentSong?.id === song.id ? 'bg-white/[0.08]' : ''}`}
                      onClick={() => onSongSelect?.(song)}
                    >
                      {/* 순위 표시 */}
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                        <span className={`text-xl font-extrabold tabular-nums ${globalIndex in RANK_COLORS ? RANK_COLORS[globalIndex as keyof typeof RANK_COLORS] : 'text-white/50'}`}>
                          {globalIndex + 1}
                        </span>
                      </div>
                      
                      {/* 앨범 커버 */}
                      <div className={`w-14 h-14 flex-shrink-0 relative rounded-lg overflow-hidden shadow-md ${currentSong?.id === song.id ? 'ring-1 ring-white/30' : ''}`}>
                        <Image
                          src={getLocalFileUrl(song.fileName, 'image')}
                          alt={song.title}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                          onError={(e) => handleImageError(e, song.id)}
                          unoptimized
                        />
                        
                        {/* 현재 재생 중이면 재생/일시정지 아이콘 표시 */}
                        {currentSong?.id === song.id && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                            {isPlaying ? (
                              <span className="text-white text-sm">❚❚</span>
                            ) : (
                              <div className="w-0 h-0 border-t-transparent border-b-transparent border-l-white border-t-[5px] border-b-[5px] border-l-[8px] ml-0.5"></div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* 곡 정보 */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-base truncate ${currentSong?.id === song.id ? 'text-white' : ''}`}>{song.title}</h3>
                        <div className="flex items-center gap-2">
                          {currentSong?.id === song.id && isPlaying && (
                            <div className="flex items-end gap-0.5 h-3">
                              <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '300ms' }}></span>
                            </div>
                          )}
                          <p className="text-sm text-white/60 truncate">{song.artist}</p>
                        </div>
                      </div>
                      
                      {/* 재생 버튼 */}
                      {currentSong?.id !== song.id && (
                        <motion.div
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                          whileTap={{ scale: 0.9 }}
                          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                        >
                          <div className="w-0 h-0 border-t-transparent border-b-transparent border-l-white border-t-[5px] border-b-[5px] border-l-[7px] ml-0.5"></div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 