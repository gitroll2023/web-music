'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import BottomBar from '@/components/BottomBar';
import NavigationBar from '@/components/NavigationBar';
import CachedImage from '@/components/CachedImage';
import { getLocalFileUrl } from '@/utils/fileUtils';
import type { SongWithChapter } from '@/types';
import { usePlayerContext } from '@/contexts/PlayerContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDragScroll } from '@/hooks/useDragScroll';
import { addToHistory } from '@/utils/playHistory';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { BiArrowBack, BiSearch } from 'react-icons/bi';
import { PlayIcon, QueueListIcon } from '@heroicons/react/24/solid';

const chapters = [
  { id: 'all', name: '전체' },
  { id: 'chapter-1', name: '1장' },
  { id: 'chapter-2', name: '2장' },
  { id: 'chapter-3', name: '3장' },
  { id: 'chapter-4', name: '4장' },
  { id: 'chapter-5', name: '5장' },
  { id: 'chapter-6', name: '6장' },
  { id: 'chapter-7', name: '7장' },
  { id: 'chapter-8', name: '8장' },
  { id: 'chapter-9', name: '9장' },
  { id: 'chapter-10', name: '10장' },
  { id: 'chapter-11', name: '11장' },
  { id: 'chapter-12', name: '12장' },
  { id: 'chapter-13', name: '13장' },
  { id: 'chapter-14', name: '14장' },
  { id: 'chapter-15', name: '15장' },
  { id: 'chapter-16', name: '16장' },
  { id: 'chapter-17', name: '17장' },
  { id: 'chapter-18', name: '18장' },
  { id: 'chapter-19', name: '19장' },
  { id: 'chapter-20', name: '20장' },
  { id: 'chapter-21', name: '21장' },
  { id: 'chapter-22', name: '22장' },
];

export default function AllSongsPage() {
  const router = useRouter();
  const [songs, setSongs] = useState<SongWithChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { dragProps: chapterDragProps, handleClickGuard: chapterClickGuard } = useDragScroll();

  const {
    currentSong,
    playlistSongs,
    isPlaying,
    isShuffle,
    playMode,
    volume,
    currentTime,
    duration,
    isReady,
    initializePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    seek,
    togglePlay,
    setCurrentSong,
    getNextSong: getPlayerNextSong,
    getPreviousSong: getPlayerPreviousSong,
    toggleShuffle,
    togglePlayMode,
    setVolume,
  } = usePlayerContext();

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch('/api/songs');
        const data = await response.json();
        if (Array.isArray(data.songs)) {
          setSongs(data.songs);
        }
      } catch (error) {
        console.error('Failed to fetch songs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSongs();
  }, []);

  // 검색 토글 시 input에 포커스
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // 장 + 검색어 기반 필터링
  const filteredSongs = useMemo(() => {
    let result = songs;

    if (selectedChapter !== 'all') {
      const chapterNumber = selectedChapter.replace('chapter-', '');
      result = result.filter(song =>
        song.chapter?.name.includes(`계시록 ${chapterNumber}장`)
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(song =>
        song.title.toLowerCase().includes(query) ||
        (song.artist && song.artist.toLowerCase().includes(query)) ||
        (song.chapter?.name && song.chapter.name.toLowerCase().includes(query))
      );
    }

    return result;
  }, [songs, selectedChapter, searchQuery]);

  const handleSongSelect = useCallback((song: SongWithChapter) => {
    setCurrentSong(song);
    addToPlaylist(song);
    addToHistory({ id: song.id, title: song.title, fileName: song.fileName });
  }, [setCurrentSong, addToPlaylist]);

  const handlePlayAll = useCallback(() => {
    if (filteredSongs.length === 0) return;
    initializePlaylist(filteredSongs);
    setCurrentSong(filteredSongs[0]);
    toast.success(`${filteredSongs.length}곡 전체 재생`);
  }, [filteredSongs, initializePlaylist, setCurrentSong]);

  const handleAddAllToPlaylist = useCallback(() => {
    if (filteredSongs.length === 0) return;
    const currentIndex = currentSong
      ? playlistSongs.findIndex(s => s.id === currentSong.id)
      : -1;
    if (currentIndex >= 0) {
      const updated = [...playlistSongs];
      updated.splice(currentIndex + 1, 0, ...filteredSongs);
      initializePlaylist(updated);
    } else {
      filteredSongs.forEach(song => addToPlaylist(song));
    }
    toast.success(`${filteredSongs.length}곡이 재생목록에 추가되었습니다.`);
  }, [filteredSongs, currentSong, playlistSongs, initializePlaylist, addToPlaylist]);

  const getNextSong = useCallback(() => {
    if (!currentSong || filteredSongs.length === 0) return null;
    const idx = filteredSongs.findIndex(s => s.id === currentSong.id);
    if (idx === -1) return filteredSongs[0];
    return filteredSongs[(idx + 1) % filteredSongs.length];
  }, [currentSong, filteredSongs]);

  const getPreviousSong = useCallback(() => {
    if (!currentSong || filteredSongs.length === 0) return null;
    const idx = filteredSongs.findIndex(s => s.id === currentSong.id);
    if (idx === -1) return filteredSongs[filteredSongs.length - 1];
    return filteredSongs[(idx - 1 + filteredSongs.length) % filteredSongs.length];
  }, [currentSong, filteredSongs]);

  const handlePlayPause = () => {
    togglePlay();
  };

  const handleNext = () => {
    const nextSong = playlistSongs.length > 1 ? getPlayerNextSong() : getNextSong();
    if (nextSong) handleSongSelect(nextSong);
  };

  const handlePrevious = () => {
    const prevSong = playlistSongs.length > 1 ? getPlayerPreviousSong() : getPreviousSong();
    if (prevSong) handleSongSelect(prevSong);
  };

  const handleSeek = (time: number) => {
    seek(time);
  };

  const handleShuffleToggle = () => {
    toggleShuffle();
  };

  const handlePlayModeAction = () => {
    togglePlayMode();
  };

  const handleSeekBackward5 = () => {
    seek(Math.max(0, currentTime - 5));
  };

  const handleSeekForward5 = () => {
    seek(Math.min(duration, currentTime + 5));
  };

  const handleSeekToStart = () => {
    seek(0);
  };

  const handleVolumeUp = useCallback(() => {
    setVolume(Math.min(1, volume + 0.1));
  }, [volume, setVolume]);

  const handleVolumeDown = useCallback(() => {
    setVolume(Math.max(0, volume - 0.1));
  }, [volume, setVolume]);

  useKeyboardShortcuts({
    onTogglePlay: handlePlayPause,
    onSeekBackward: handleSeekBackward5,
    onSeekForward: handleSeekForward5,
    onVolumeUp: handleVolumeUp,
    onVolumeDown: handleVolumeDown,
    isEnabled: !isLoading,
  });

  const handleMoveSong = (fromIndex: number, toIndex: number) => {
    const updated = [...playlistSongs];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    initializePlaylist(updated);
  };

  const handleDeleteSongs = (songIds: (string | number)[]) => {
    if (songIds.length === 0) return;
    const isCurrentDeleted = currentSong && songIds.includes(currentSong.id);
    removeFromPlaylist(songIds);
    if (isCurrentDeleted) {
      const remaining = playlistSongs.filter(s => !songIds.includes(s.id));
      if (remaining.length > 0) {
        setCurrentSong(remaining[0]);
      } else {
        setCurrentSong(null);
      }
    }
  };

  const handleChapterClick = (chapterId: string) => {
    if (chapterClickGuard()) return;
    setSelectedChapter(chapterId);
  };

  return (
    <MainLayout>
      {/* 헤더 */}
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-md pt-2 pb-3 -mx-5 px-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <BiArrowBack size={22} />
            </button>
            <h1 className="text-xl font-bold">전체 곡</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <BiSearch size={20} />
            </button>
          </div>
        </div>

        {/* 검색 바 */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="relative mb-3">
                <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="곡명, 아티스트 검색..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 rounded-xl text-sm text-white placeholder-white/40 outline-none focus:bg-white/15 focus:ring-1 focus:ring-white/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-xs"
                  >
                    지우기
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 장 필터 탭 */}
        <div
          {...chapterDragProps}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1"
        >
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => handleChapterClick(chapter.id)}
              className={`
                flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                transition-all duration-200
                ${selectedChapter === chapter.id
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
                }
              `}
            >
              {chapter.name}
            </button>
          ))}
        </div>
      </div>

      {/* 곡 수 + 액션 버튼 */}
      <div className="flex items-center justify-between mt-4 mb-3">
        <p className="text-sm text-white/60">
          {filteredSongs.length}곡
          {selectedChapter !== 'all' && (
            <span className="ml-1.5 text-white/40">
              · 계시록 {selectedChapter.replace('chapter-', '')}장
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddAllToPlaylist}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-full text-xs text-white/80 transition-colors"
            disabled={filteredSongs.length === 0}
          >
            <QueueListIcon className="w-3.5 h-3.5" />
            <span>추가</span>
          </button>
          <button
            onClick={handlePlayAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-white/90 rounded-full text-xs text-black font-medium transition-colors"
            disabled={filteredSongs.length === 0}
          >
            <PlayIcon className="w-3.5 h-3.5" />
            <span>전체 재생</span>
          </button>
        </div>
      </div>

      {/* 로딩 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <BiSearch size={40} className="mb-3 opacity-50" />
          <p className="text-sm">검색 결과가 없습니다</p>
        </div>
      ) : (
        /* 곡 목록 - 세로 스크롤 리스트 */
        <div className="pb-20 space-y-1">
          {filteredSongs.map((song, index) => {
            const isActive = currentSong?.id === song.id;
            return (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.5) }}
                className={`
                  flex items-center gap-3 p-2.5 rounded-xl cursor-pointer
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-white/15'
                    : 'hover:bg-white/5 active:bg-white/10'
                  }
                `}
                onClick={() => handleSongSelect(song)}
              >
                {/* 앨범 아트 */}
                <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
                  <CachedImage
                    src={getLocalFileUrl(song.fileName, 'image')}
                    alt={song.title}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                  {isActive && isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '0ms' }} />
                        <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '150ms' }} />
                        <span className="w-0.5 bg-white rounded-full animate-soundwave" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <PlayIcon className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* 곡 정보 */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-white/90'}`}>
                    {song.title}
                  </p>
                  <p className="text-xs text-white/50 truncate">
                    {song.artist}
                    {song.artist && song.chapter?.name && ' · '}
                    {song.chapter?.name}
                  </p>
                </div>

                {/* 재생 중 표시 */}
                {isActive && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <NavigationBar />

      <BottomBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onPrevious={handlePrevious}
        onNext={handleNext}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        isReady={isReady}
        isShuffle={isShuffle}
        onShuffleToggle={handleShuffleToggle}
        playMode={playMode}
        onPlayModeAction={handlePlayModeAction}
        onSeekBackward5={handleSeekBackward5}
        onSeekForward5={handleSeekForward5}
        onSeekToStart={handleSeekToStart}
        songs={playlistSongs}
        isDarkMode={true}
        onSongSelect={handleSongSelect}
        onMoveSong={handleMoveSong}
        onDeleteSongs={handleDeleteSongs}
      />
    </MainLayout>
  );
}
