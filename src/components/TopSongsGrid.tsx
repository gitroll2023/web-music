'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SongWithChapter } from '@/types';
import CachedImage from './CachedImage';
import { getProxiedImageUrl } from '@/utils/imageUtils';
import { PlayIcon } from '@heroicons/react/24/solid';

interface Props {
  songs: SongWithChapter[];
  onSongSelectAction: (song: SongWithChapter) => void;
  isDarkMode: boolean;
  onPlayAllAction: (songs: SongWithChapter[]) => Promise<void>;
}

const RANK_COLORS = {
  1: 'bg-yellow-500',
  2: 'bg-gray-300',
  3: 'bg-amber-600',
};

function TopSongsGrid({ songs, onSongSelectAction, isDarkMode, onPlayAllAction }: Props) {
  const popularSongs = useMemo(() => 
    songs
      .filter(song => song.popularSong)
      .sort((a, b) => {
        if (a.popularSong && b.popularSong) {
          return a.popularSong.order - b.popularSong.order;
        }
        return 0;
      })
      .slice(0, 10) // 상위 10곡만 표시
  , [songs]);

  if (popularSongs.length === 0) return null;

  return (
    <div className={`p-3 sm:p-6 rounded-xl ${isDarkMode ? 'bg-gray-900/50' : 'bg-orange-50/50'}`}>
      <div className="relative">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <h2 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              인기 곡
            </h2>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
              isDarkMode ? 'bg-orange-500/80 text-white' : 'bg-orange-100 text-orange-600'
            }`}>
              TOP {popularSongs.length}
            </span>
          </div>
          <button
            onClick={() => onPlayAllAction(popularSongs)}
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

        <div className="relative overflow-hidden">
          {/* TOP 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {popularSongs.slice(0, 3).map((song, index) => (
              <motion.div
                key={song.id}
                onClick={() => onSongSelectAction(song)}
                className={`
                  relative overflow-hidden cursor-pointer rounded-xl
                  ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
                  shadow-md hover:shadow-lg transition-shadow
                  ${index === 0 ? 'sm:col-span-3 h-48 sm:h-64' : 'h-32 sm:h-48'}
                `}
                whileHover={{ scale: 1.01 }}
              >
                <div className="absolute inset-0">
                  <CachedImage
                    src={getProxiedImageUrl(song.imageUrl || `/popular_img/${index + 1}.jpg`)}
                    alt={song.title}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className={`
                      ${RANK_COLORS[index + 1 as keyof typeof RANK_COLORS] || 'bg-gray-500'}
                      text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-lg
                    `}>
                      {index + 1}
                    </div>
                    <PlayIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h3 className={`
                      font-bold text-white mb-1 truncate
                      ${index === 0 ? 'text-xl sm:text-2xl' : 'text-lg'}
                    `}>
                      {song.title}
                    </h3>
                    <p className="text-gray-300 text-sm truncate">{song.artist}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 4위 이하 */}
          <div className="space-y-2">
            {popularSongs.slice(3).map((song, index) => (
              <motion.div
                key={song.id}
                onClick={() => onSongSelectAction(song)}
                className={`
                  relative overflow-hidden cursor-pointer rounded-lg
                  ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}
                  group flex items-center gap-3 p-2
                `}
                whileHover={{ scale: 1.01 }}
              >
                <div className="w-12 h-12 relative flex-shrink-0">
                  <CachedImage
                    src={getProxiedImageUrl(song.imageUrl || `/popular_img/${index + 4}.jpg`)}
                    alt={song.title}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className={`font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {song.title}
                  </h3>
                  <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {song.artist}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`
                    text-sm font-semibold
                    ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                  `}>
                    #{index + 4}
                  </span>
                  <PlayIcon className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TopSongsGrid);
