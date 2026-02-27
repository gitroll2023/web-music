'use client';

import type { SongWithChapter } from '@/types';
import CachedImage from './CachedImage';
import { getLocalFileUrl } from '@/utils/fileUtils';
import { PlayIcon, PauseIcon, BackwardIcon, ForwardIcon } from '@heroicons/react/24/solid';
import { useState, useEffect, useRef } from 'react';
import Player from './Player';
import PlaylistManager from './PlaylistManager';

interface BottomBarProps {
  currentSong: SongWithChapter | null;
  isPlaying?: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isReady: boolean;
  isShuffle: boolean;
  onShuffleToggle: () => void;
  playMode: 'all' | 'one' | 'none';
  onPlayModeAction: () => void;
  onSeekBackward5: () => void;
  onSeekForward5: () => void;
  onSeekToStart: () => void;
  disabled?: boolean;
  songs: SongWithChapter[];
  isDarkMode: boolean;
  onSongSelect?: (song: SongWithChapter) => void;
  onMoveSong?: (fromIndex: number, toIndex: number) => void;
  onDeleteSongs?: (songIds: (string | number)[]) => void;
}

export default function BottomBar({ 
  currentSong,
  isPlaying = false,
  onPlayPause,
  onPrevious,
  onNext,
  currentTime,
  duration,
  onSeek,
  isReady,
  isShuffle,
  onShuffleToggle,
  playMode,
  onPlayModeAction,
  onSeekBackward5,
  onSeekForward5,
  onSeekToStart,
  disabled = false,
  songs,
  isDarkMode,
  onSongSelect,
  onMoveSong,
  onDeleteSongs
}: BottomBarProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  // 자동 재생을 추적하기 위한 ref
  const hasAutoPlayedRef = useRef(false);

  useEffect(() => {
    // 새 곡이 로드되었고, 아직 자동 재생하지 않았으며, 오디오가 준비되었을 때만 자동 재생
    if (currentSong && isReady && !isPlaying && duration > 0 && !hasAutoPlayedRef.current) {
      console.log("자동 재생 시도:", { 
        songTitle: currentSong.title,
        isReady,
        isPlaying,
        duration
      });
      
      // 자동 재생 시도 시 즉시 onPlayPause 호출
      onPlayPause();
      // 자동 재생 완료 표시
      hasAutoPlayedRef.current = true;
    }
  }, [currentSong, isReady, duration, onPlayPause]);

  // 새 곡이 선택되면 자동 재생 플래그 초기화
  useEffect(() => {
    hasAutoPlayedRef.current = false;
  }, [currentSong?.id]);
  
  const handlePlayPause = () => {
    // 오디오가 준비되지 않은 경우 무시
    if (!isReady) {
      console.log("오디오 준비되지 않음, 재생 요청 무시");
      return;
    }
    
    console.log("재생/일시정지 버튼 클릭:", { 
      songTitle: currentSong?.title,
      isReady,
      isPlaying,
      duration
    });
    
    // 재생/일시정지 함수 호출
    onPlayPause();
  };

  const handlePrevious = () => onPrevious();
  const handleNext = () => onNext();

  if (!currentSong) return null;

  const safetyDuration = typeof duration === 'number' && !isNaN(duration) ? duration : 0;
  
  const progress = safetyDuration > 0 ? (currentTime / safetyDuration) * 100 : 0;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isReady) return;
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(percent * safetyDuration);
  };

  return (
    <>
      <div className="fixed bottom-[52px] left-0 right-0 z-40">
        <div className="max-w-md mx-auto relative">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            style={{
              boxShadow: '0px -8px 24px 0px rgba(0, 0, 0, 0.3), 0px -2px 8px 0px rgba(0, 0, 0, 0.2)'
            }}
          ></div>

          <div
            className="relative h-1 bg-white/10 cursor-pointer mt-0"
            onClick={handleProgressBarClick}
            role="slider"
            aria-label="재생 진행률"
            aria-valuenow={Math.round(currentTime)}
            aria-valuemin={0}
            aria-valuemax={Math.round(safetyDuration)}
            tabIndex={0}
          >
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="relative flex items-center gap-3 p-4 pb-3">
            <div
              className="relative w-12 h-12 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden shadow-lg"
              onClick={() => setShowPlayer(true)}
            >
              <CachedImage
                src={getLocalFileUrl(currentSong.fileName, 'image')}
                alt={currentSong.title}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            </div>

            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => setShowPlayer(true)}
            >
              <div className="truncate text-base font-medium text-white">{currentSong.title}</div>
              <div className="text-sm text-white/50">{currentSong.artist}</div>
            </div>

            <div className="flex items-center gap-2" role="toolbar" aria-label="재생 컨트롤">
              <button
                onClick={handlePlayPause}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-white/80 transition-all duration-200 rounded-full hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
                disabled={!isReady || disabled}
                aria-label={isPlaying ? '일시정지' : '재생'}
              >
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setShowPlaylist(true)}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-white/80 transition-all duration-200 rounded-full hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
                title="재생목록 보기"
                aria-label="재생목록 보기"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black"></div>
        </div>

        <div className="h-0.5 bg-black w-full"></div>
      </div>

      {showPlayer && (
        <Player
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onPrevious={onPrevious}
          onNext={onNext}
          currentTime={currentTime}
          duration={safetyDuration}
          onSeek={onSeek}
          isReady={isReady}
          isShuffle={isShuffle}
          onShuffleToggle={onShuffleToggle}
          playMode={playMode}
          onPlayModeAction={onPlayModeAction}
          onSeekBackward5={onSeekBackward5}
          onSeekForward5={onSeekForward5}
          onSeekToStart={onSeekToStart}
          disabled={disabled}
          songs={songs}
          isDarkMode={isDarkMode}
          onClose={() => setShowPlayer(false)}
          onSongSelect={onSongSelect}
          onMoveSong={onMoveSong}
          onDeleteSongs={onDeleteSongs}
        />
      )}

      {showPlaylist && (
        <PlaylistManager
          isVisible={showPlaylist}
          onClose={() => setShowPlaylist(false)}
          songs={songs}
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onSelectSong={(song) => {
            if (onSongSelect) {
              onSongSelect(song);
            }
            setShowPlaylist(false);
          }}
          onMoveSong={onMoveSong}
          onDeleteSongs={onDeleteSongs}
        />
      )}
    </>
  );
} 