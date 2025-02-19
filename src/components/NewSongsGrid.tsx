'use client';

import { memo, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SongWithChapter } from '@/types';
import CachedImage from './CachedImage';
import { getProxiedImageUrl } from '@/utils/imageUtils';
import { PlayIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface Props {
  songs: SongWithChapter[];
  onSongSelectAction: (song: SongWithChapter) => void;
  isDarkMode: boolean;
  onPlayAllAction: (songs: SongWithChapter[]) => Promise<void>;
}

const ITEMS_PER_PAGE = 5;

function NewSongsGrid({ songs, onSongSelectAction, isDarkMode, onPlayAllAction }: Props) {
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const newSongs = useMemo(() => 
    songs
      .filter(song => song.isNew === true)
      .sort((a, b) => {
        if (a.popularSong && b.popularSong) {
          return a.popularSong.order - b.popularSong.order;
        }
        return 0;
      })
  , [songs]);

  const totalPages = Math.ceil(newSongs.length / ITEMS_PER_PAGE);
  const currentSongs = newSongs.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }

    if (isRightSwipe && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (newSongs.length === 0) return null;

  return (
    <div className={`p-3 sm:p-6 rounded-xl ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="relative">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <h2 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              새로운 곡
            </h2>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
              isDarkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600'
            }`}>
              {newSongs.length}곡
            </span>
          </div>
          <button
            onClick={() => onPlayAllAction(newSongs)}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-colors
              flex items-center gap-2 whitespace-nowrap
              ${isDarkMode 
                ? 'bg-gray-800 text-white hover:bg-gray-700' 
                : 'bg-white text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            <PlayIcon className="w-4 h-4" />
            전체 재생
          </button>
        </div>

        <div 
          ref={containerRef}
          className="relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
            >
              {currentSongs.map((song, index) => (
                <motion.div
                  key={song.id}
                  onClick={() => onSongSelectAction(song)}
                  className={`
                    relative rounded-xl overflow-hidden cursor-pointer
                    ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}
                    group
                  `}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="relative pt-[100%]">
                    <div className="absolute top-0 left-0 w-full h-full">
                      <CachedImage
                        src={getProxiedImageUrl(song.imageUrl || `/new_img/${index + 1}.jpg`)}
                        alt={song.title}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span className={`
                          px-2 py-1 text-xs font-bold rounded-lg
                          ${isDarkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600'}
                        `}>
                          NEW
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className={`font-semibold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {song.title}
                    </h3>
                    <div className="mt-1.5 flex flex-col gap-1.5">
                      <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        계시록 {song.chapterId}장
                      </p>
                      {song.genre?.name && (
                        <span className={`text-xs px-2.5 py-1 rounded-full ${
                          isDarkMode 
                            ? 'bg-gray-700 text-gray-300' 
                            : 'bg-gray-100 text-gray-600'
                        } inline-block w-fit`}>
                          {song.genre.name}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
          {currentPage > 0 && (
            <button
              onClick={goToPrevPage}
              className={`
                absolute left-0 top-1/2 -translate-y-1/2 z-10
                p-2 rounded-full shadow-lg
                ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
              `}
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          )}
          {currentPage < totalPages - 1 && (
            <button
              onClick={goToNextPage}
              className={`
                absolute right-0 top-1/2 -translate-y-1/2 z-10
                p-2 rounded-full shadow-lg
                ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
              `}
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          )}

          {/* Pagination dots */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`
                    w-2 h-2 rounded-full transition-all
                    ${currentPage === i 
                      ? (isDarkMode ? 'bg-white' : 'bg-gray-900')
                      : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')
                    }
                  `}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(NewSongsGrid);
