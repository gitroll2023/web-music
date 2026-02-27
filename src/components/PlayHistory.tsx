'use client';

import { useState, useEffect } from 'react';
import { useDragScroll } from '@/hooks/useDragScroll';
import type { SongWithChapter } from '@/types';
import { getHistory, clearHistory, type PlayHistoryItem } from '@/utils/playHistory';
import { getLocalFileUrl } from '@/utils/fileUtils';
import CachedImage from './CachedImage';
import { motion } from 'framer-motion';

interface PlayHistoryProps {
  /** All available songs so we can match history items back to full SongWithChapter objects */
  songs: SongWithChapter[];
  onSongSelect?: (song: SongWithChapter) => void;
  currentSong?: SongWithChapter | null;
  isPlaying?: boolean;
  /** Incremented externally whenever a new song is played so we re-read localStorage */
  refreshKey?: number;
}

export default function PlayHistory({
  songs,
  onSongSelect,
  currentSong,
  isPlaying,
  refreshKey = 0,
}: PlayHistoryProps) {
  const [historyItems, setHistoryItems] = useState<PlayHistoryItem[]>([]);
  const { dragProps } = useDragScroll();

  // Reload history whenever refreshKey changes (new song played) or on mount
  useEffect(() => {
    setHistoryItems(getHistory());
  }, [refreshKey]);

  // Map history items back to full song objects
  const historySongs: SongWithChapter[] = historyItems
    .map((item) => songs.find((s) => s.id === item.songId))
    .filter((s): s is SongWithChapter => s !== undefined)
    .slice(0, 10); // show up to 10 in the UI

  if (historySongs.length === 0) return null;

  const handleClear = () => {
    clearHistory();
    setHistoryItems([]);
  };

  return (
    <div className="space-y-4 mt-10 mb-10 px-1">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">최근 들은 곡</h2>
        <button
          onClick={handleClear}
          className="text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          전체 삭제
        </button>
      </div>

      <div className="relative">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-white/5 via-white/20 to-white/5 my-3"></div>
        <div className="flex items-center justify-between mt-5 mb-4">
          <p className="text-sm text-white/70">최근 재생한 노래를 다시 들어보세요</p>
        </div>
      </div>

      <div {...dragProps} className="overflow-x-auto hide-scrollbar pb-2">
        <div className="flex space-x-5" style={{ minWidth: 'fit-content' }}>
          {historySongs.map((song) => (
            <motion.div
              key={song.id}
              whileTap={{ scale: 0.98 }}
              className="flex-shrink-0 cursor-pointer"
              style={{ width: '120px' }}
              onClick={() => onSongSelect?.(song)}
            >
              <div className="relative">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    boxShadow: '0px 2px 5px 0px rgba(0, 0, 0, 0.25)',
                    width: '120px',
                    height: '120px',
                  }}
                >
                  <CachedImage
                    src={getLocalFileUrl(song.fileName, 'image')}
                    alt={song.title}
                    width={120}
                    height={120}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Currently playing indicator */}
                {currentSong?.id === song.id && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      {isPlaying ? (
                        <span className="text-white text-sm">||</span>
                      ) : (
                        <div className="w-0 h-0 border-t-transparent border-b-transparent border-l-white border-t-[5px] border-b-[5px] border-l-[8px] ml-0.5"></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-1 mt-2">
                <h3 className="font-semibold text-sm truncate">{song.title}</h3>
                <p className="text-xs text-gray-400 truncate">{song.artist}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
