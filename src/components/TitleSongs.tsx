import type { SongWithChapter } from '@/types';
import CachedImage from './CachedImage';
import { getLocalFileUrl } from '@/utils/fileUtils';
import { useDragScroll } from '@/hooks/useDragScroll';
import { motion } from 'framer-motion';

interface TitleSongsProps {
  songs: SongWithChapter[];
  onSongSelect?: (song: SongWithChapter) => void;
  currentSong?: SongWithChapter | null;
  isPlaying?: boolean;
}

export default function TitleSongs({ songs, onSongSelect, currentSong, isPlaying }: TitleSongsProps) {
  const { dragProps } = useDragScroll();

  // 모든 노래를 가져와서 그룹으로 나누기 (각 그룹은 2개 - 2x1 그리드)
  const songGroups = [];
  for (let i = 0; i < songs.length; i += 2) {
    songGroups.push(songs.slice(i, i + 2));
  }

  return (
    <div className="space-y-4 mt-10">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">계시록 제목 노래</h2>
      </div>
      
      <div className="relative">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-white/5 via-white/20 to-white/5 my-3"></div>
        
        <div className="flex items-center justify-between mt-5 mb-2">
          <p className="text-sm text-white/70">제목에 담긴 메시지를 들어보세요</p>
  
        </div>
      
        <div
          {...dragProps}
          className="overflow-x-auto hide-scrollbar pt-2 pb-4"
          style={{ ...dragProps.style, paddingRight: '16px' }}
        >
          <div className="flex space-x-5">
            {songGroups.map((group, groupIndex) => (
              <div 
                key={groupIndex}
                className="grid grid-cols-2 grid-rows-1 gap-6 flex-shrink-0"
                style={{ 
                  width: 'calc(100% - 40px)',
                  minWidth: 'calc(100% - 40px)'
                }}
              >
                {group.map((song) => (
                  <motion.div
                    key={song.id}
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ scale: 1.03 }}
                    className="flex-shrink-0 w-full cursor-pointer group"
                    onClick={() => onSongSelect?.(song)}
                  >
                    <div className={`relative rounded-xl overflow-hidden ${currentSong?.id === song.id && isPlaying ? 'ring-2 ring-white/40 shadow-lg shadow-white/10' : ''}`}>
                      <CachedImage
                        src={getLocalFileUrl(song.fileName, 'image')}
                        alt={song.title}
                        width={300}
                        height={300}
                        className="w-full aspect-square object-cover card-shadow transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        {currentSong?.id === song.id && isPlaying ? (
                          <div className="flex items-end gap-0.5 h-5">
                            <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        ) : (
                          <span className="text-white text-2xl drop-shadow-lg">▶</span>
                        )}
                      </div>
                      {currentSong?.id === song.id && isPlaying && (
                        <div className="absolute top-2 right-2 flex items-end gap-0.5 h-3">
                          <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      )}
                    </div>
                    <div className="p-1 mt-2">
                      <h3 className="font-medium truncate text-sm">{song.title}</h3>
                      <p className="text-xs text-white/50 truncate">{song.artist}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 