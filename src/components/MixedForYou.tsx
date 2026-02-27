import type { SongWithChapter } from '@/types';
import CachedImage from './CachedImage';
import { getLocalFileUrl } from '@/utils/fileUtils';
import { useRef, useState, useMemo } from 'react';
import { useDragScroll } from '@/hooks/useDragScroll';
import { motion } from 'framer-motion';
import { PlayIcon, PlusIcon, QueueListIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface MixedForYouProps {
  songs: SongWithChapter[];
  onSongSelect?: (song: SongWithChapter) => void;
  currentSong?: SongWithChapter | null;
  isPlaying?: boolean;
  onCategoryChange?: (category: string) => void;
  onPlayAll?: (songs: SongWithChapter[]) => void;
  onAddAllToPlaylist?: (songs: SongWithChapter[]) => void;
}

const chapters = [
  { id: 'all', name: '전체' },
  { id: 'chapter-1', name: '계시록 1장' },
  { id: 'chapter-2', name: '계시록 2장' },
  { id: 'chapter-3', name: '계시록 3장' },
  { id: 'chapter-4', name: '계시록 4장' },
  { id: 'chapter-5', name: '계시록 5장' },
  { id: 'chapter-6', name: '계시록 6장' },
  { id: 'chapter-7', name: '계시록 7장' },
  { id: 'chapter-8', name: '계시록 8장' },
  { id: 'chapter-9', name: '계시록 9장' },
  { id: 'chapter-10', name: '계시록 10장' },
  { id: 'chapter-11', name: '계시록 11장' },
  { id: 'chapter-12', name: '계시록 12장' },
  { id: 'chapter-13', name: '계시록 13장' },
  { id: 'chapter-14', name: '계시록 14장' },
  { id: 'chapter-15', name: '계시록 15장' },
  { id: 'chapter-16', name: '계시록 16장' },
  { id: 'chapter-17', name: '계시록 17장' },
  { id: 'chapter-18', name: '계시록 18장' },
  { id: 'chapter-19', name: '계시록 19장' },
  { id: 'chapter-20', name: '계시록 20장' },
  { id: 'chapter-21', name: '계시록 21장' },
  { id: 'chapter-22', name: '계시록 22장' },
];

export default function MixedForYou({ 
  songs, 
  onSongSelect, 
  currentSong, 
  isPlaying, 
  onCategoryChange, 
  onPlayAll,
  onAddAllToPlaylist
}: MixedForYouProps) {
  const [selectedChapter, setSelectedChapter] = useState('all');
  const [showDropdown, setShowDropdown] = useState(false);

  // PC 마우스 드래그 스크롤
  const { dragProps: chapterDragProps, handleClickGuard: chapterClickGuard } = useDragScroll();
  const { dragProps: songGridDragProps } = useDragScroll();

  // 노래를 가로방향으로 먼저 채워지도록 재구성
  const createRowFirstGroups = (songs: SongWithChapter[], cols: number = 3, rows: number = 2) => {
    const result = [];
    const groupSize = cols * rows;
    
    for (let startIdx = 0; startIdx < songs.length; startIdx += groupSize) {
      const groupSongs = songs.slice(startIdx, startIdx + groupSize);
      const group: SongWithChapter[][] = Array(rows).fill(null).map(() => []);
      
      // 각 행에 노래 추가 (가로 방향으로 먼저 채움)
      for (let i = 0; i < groupSongs.length; i++) {
        const rowIdx = Math.floor(i / cols);
        if (rowIdx < rows) {
          group[rowIdx].push(groupSongs[i]);
        }
      }
      
      result.push(group);
    }
    
    return result;
  };

  // 가로 방향으로 먼저 채워지는 그룹 생성
  const songGroups = useMemo(() => createRowFirstGroups(songs, 3, 2), [songs]);

  // 현재 선택된 장의 노래들을 필터링
  const filteredSongs = useMemo(() => {
    if (selectedChapter === 'all') {
      return songs;
    } else {
      const chapterNumber = selectedChapter.replace('chapter-', '');
      return songs.filter(song => {
        // 해당 장 번호와 일치하는지 확인
        const matchesChapter = song.chapter?.name.includes(`계시록 ${chapterNumber}장`);
        return matchesChapter;
      });
    }
  }, [selectedChapter, songs]);

  const handleChapterClick = (chapterId: string) => {
    if (chapterClickGuard()) return;
    setSelectedChapter(chapterId);
    onCategoryChange?.(chapterId);
  };

  // 드롭다운 토글
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // 전체 듣기 버튼 핸들러
  const handlePlayAll = () => {
    if (onPlayAll && filteredSongs.length > 0) {
      onPlayAll(filteredSongs);
      setShowDropdown(false);
    }
  };

  // 전체 재생목록에 추가 핸들러
  const handleAddAllToPlaylist = () => {
    if (onAddAllToPlaylist && filteredSongs.length > 0) {
      onAddAllToPlaylist(filteredSongs);
      setShowDropdown(false);
    }
  };

  // 노래 갯수에 따라 하단 여백 조절
  const bottomMarginClass = useMemo(() => {
    if (songs.length <= 3) {
      return "mb-0"; // 한 줄만 있을 경우 여백 없음
    } else if (songs.length <= 6) {
      return "mb-1"; // 두 줄만 있을 경우 최소 여백
    } else if (songs.length <= 9) {
      return "mb-2"; // 3줄 이하
    } else if (songs.length <= 18) {
      return "mb-4"; // 중간 여백
    } else {
      return "mb-8"; // 기본 여백
    }
  }, [songs.length]);

  // 컨테이너 패딩도 노래 수에 따라 조정
  const containerPaddingClass = useMemo(() => {
    if (songs.length <= 3) {
      return "pt-1 pb-1"; // 한 줄만 있을 경우 최소 패딩
    } else if (songs.length <= 6) {
      return "pt-1 pb-2"; // 두 줄만 있을 경우 작은 패딩
    } else if (songs.length <= 9) {
      return "pt-2 pb-2"; // 3줄 이하
    } else {
      return "pt-2 pb-4"; // 기본 패딩
    }
  }, [songs.length]);

  return (
    <div className={`space-y-3 mt-4 ${bottomMarginClass}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">계시록 전장 노래</h2>
        
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
                  <span>{selectedChapter === 'all' ? '전체 듣기' : `${chapters.find(c => c.id === selectedChapter)?.name} 듣기`}</span>
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
        
        <div className="flex items-center justify-between mt-4 mb-2">
          <p className="text-sm text-white/70">선택하신 장의 노래를 들어보세요</p>
          <Link
            href="/songs"
            className="text-xs text-white/50 italic hover:text-white/80 transition-colors underline underline-offset-2 decoration-white/30 hover:decoration-white/60"
          >
            {selectedChapter === 'all' ? '전체 보기' : chapters.find(c => c.id === selectedChapter)?.name}
          </Link>
        </div>
        
        <div
          {...chapterDragProps}
          className="flex items-center gap-3 overflow-x-auto py-2 scrollbar-hide"
        >
          {chapters.map((chapter) => (
            <motion.button
              key={chapter.id}
              onClick={() => handleChapterClick(chapter.id)}
              className={`
                flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-full whitespace-nowrap
                transition-all duration-300 transform hover:scale-105 text-center
                focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none
                ${selectedChapter === chapter.id
                  ? 'bg-gradient-to-r from-white via-gray-100 to-white/90 text-black shadow-lg shadow-white/10'
                  : 'bg-white/10 text-white hover:bg-white/20'
                }
              `}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-sm font-medium">{chapter.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
      
      <div
        {...songGridDragProps}
        className={`overflow-x-auto hide-scrollbar ${containerPaddingClass}`}
        style={{ ...songGridDragProps.style, paddingRight: '16px' }}
      >
        <div className="flex space-x-5">
          {songGroups.map((group, groupIndex) => (
            <div 
              key={groupIndex}
              className="flex flex-col gap-3 flex-shrink-0"
              style={{ 
                width: 'calc(100% - 40px)',
                minWidth: 'calc(100% - 40px)'
              }}
            >
              {group.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-3 gap-3">
                  {row.map((song) => (
                    <motion.div
                      key={song.id}
                      whileTap={{ scale: 0.96 }}
                      whileHover={{ scale: 1.03 }}
                      className="cursor-pointer group transition-all duration-200"
                      onClick={() => onSongSelect?.(song)}
                    >
                      <div className={`relative rounded-xl overflow-hidden ${currentSong?.id === song.id && isPlaying ? 'ring-2 ring-white/40 shadow-lg shadow-white/10' : ''}`}>
                        <CachedImage
                          src={getLocalFileUrl(song.fileName, 'image')}
                          alt={song.title}
                          width={112}
                          height={112}
                          className="w-full aspect-square object-cover card-shadow transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none rounded-b-xl"></div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          {currentSong?.id === song.id && isPlaying ? (
                            <span className="text-white text-2xl drop-shadow-lg">❚❚</span>
                          ) : (
                            <span className="text-white text-2xl drop-shadow-lg">▶</span>
                          )}
                        </div>
                        {currentSong?.id === song.id && isPlaying && (
                          <div className="absolute top-1.5 right-1.5 flex items-end gap-0.5 h-3">
                            <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        )}
                      </div>
                      <div className="p-1 mt-1">
                        <h3 className="font-medium truncate text-xs">{song.title}</h3>
                        <p className="text-xs text-white/50 truncate">{song.artist}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 