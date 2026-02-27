'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SongWithChapter } from '@/types';
import CachedImage from './CachedImage';
import { getLocalFileUrl } from '@/utils/fileUtils';
import { shareSong } from '@/utils/share';
import Lyrics from './Lyrics';
import PlaylistManager from './PlaylistManager';
import { motion, AnimatePresence } from 'framer-motion';
import { IoShareOutline } from 'react-icons/io5';
import { toast } from 'react-hot-toast';

interface PlayerProps {
  currentSong: SongWithChapter | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isReady?: boolean;
  isShuffle: boolean;
  onShuffleToggle: () => void;
  playMode: 'all' | 'one' | 'none';
  onPlayModeAction: () => void;
  onSeekBackward5?: () => void;
  onSeekForward5?: () => void;
  onSeekToStart?: () => void;
  disabled?: boolean;
  songs: SongWithChapter[];
  isDarkMode: boolean;
  onClose?: () => void;
  onSongSelect?: (song: SongWithChapter) => void;
  onMoveSong?: (fromIndex: number, toIndex: number) => void;
  onDeleteSongs?: (songIds: (string | number)[]) => void;
}

export default function Player({
  currentSong,
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  currentTime,
  duration,
  onSeek,
  isReady = true,
  isShuffle,
  onShuffleToggle,
  playMode,
  onPlayModeAction,
  disabled = false,
  songs,
  isDarkMode,
  onClose,
  onSongSelect,
  onMoveSong,
  onDeleteSongs
}: PlayerProps) {
  const [activeTab, setActiveTab] = useState<'song' | 'lyrics' | 'related' | 'upNext'>('song');
  const [isLyricsSheetVisible, setIsLyricsSheetVisible] = useState(false);
  const [isPlaylistVisible, setIsPlaylistVisible] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  
  // 가사 표시를 위한 상태
  const [currentLyricText, setCurrentLyricText] = useState<string>('');
  const [nextLyricText, setNextLyricText] = useState<string>('');
  const [lyricKey, setLyricKey] = useState<number>(0);
  const prevTimeRef = useRef<number>(-1);
  
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

  const handleLyricsClick = () => {
    setActiveTab('lyrics');
    setIsLyricsSheetVisible(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // 터치 이동 중에 필요한 로직 추가
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // 수평 스와이프가 수직 스와이프보다 크고, 왼쪽에서 오른쪽으로 스와이프
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < -50) {
      setIsPlaylistVisible(true);
    }
  };
  
  const handlePlaylistClose = () => {
    setIsPlaylistVisible(false);
  };

  const handleSelectSong = (song: SongWithChapter) => {
    if (onSongSelect) {
      onSongSelect(song);
    }
    setIsPlaylistVisible(false);
  };

  const handleMoveSong = (fromIndex: number, toIndex: number) => {
    if (onMoveSong) {
      onMoveSong(fromIndex, toIndex);
    }
  };

  const handleDeleteSongs = (songIds: (string | number)[]) => {
    if (onDeleteSongs) {
      onDeleteSongs(songIds);
    }
  };

  const handleShare = async () => {
    if (!currentSong) return;
    const success = await shareSong(currentSong.title, currentSong.id);
    if (success && !navigator.share) {
      toast.success('링크가 클립보드에 복사되었습니다.');
    }
  };

  // 가사 처리 함수를 컴포넌트 외부에 정의
  const parseLyrics = useCallback((lyricsText: string | undefined) => {
    if (!lyricsText) return [];
    const timestampRegex = /\[(\d{2}):(\d{2})\.(\d{2})\]/;
    const lines = lyricsText.split('\n');
    return lines.map(line => {
      const match = line.match(timestampRegex);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const centiseconds = parseInt(match[3]);
        const timeInSeconds = minutes * 60 + seconds + centiseconds / 100;
        const text = line.replace(timestampRegex, '').trim();
        return { text, time: timeInSeconds };
      }
      return { text: line, time: -1 };
    }).filter(line => line.text);
  }, []);

  // 현재 시간에 맞는 가사 찾기 및 업데이트
  useEffect(() => {
    if (currentSong?.lyrics) {
      const parsedLines = parseLyrics(currentSong.lyrics);
      let currentLineIndex = -1;
      
      for (let i = parsedLines.length - 1; i >= 0; i--) {
        if (parsedLines[i].time <= currentTime && parsedLines[i].time !== -1) {
          currentLineIndex = i;
          break;
        }
      }
      
      // 현재 라인 인덱스가 변경된 경우에만 업데이트
      if (currentLineIndex !== -1 && Math.abs(currentTime - prevTimeRef.current) > 0.5) {
        prevTimeRef.current = currentTime;
        
        // 현재 가사와 다음 가사 업데이트
        const currentLine = parsedLines[currentLineIndex];
        setCurrentLyricText(currentLine.text);
        
        // 다음 가사가 있으면 설정
        if (currentLineIndex + 1 < parsedLines.length) {
          setNextLyricText(parsedLines[currentLineIndex + 1].text);
        } else {
          setNextLyricText('');
        }
      } else if (currentLineIndex === -1 && currentLyricText === '' && parsedLines.length > 0) {
        // 처음 시작할 때 첫 두 줄 표시
        setCurrentLyricText(parsedLines[0].text);
        if (parsedLines.length > 1) {
          setNextLyricText(parsedLines[1].text);
        }
      }
    }
  }, [currentTime, currentSong, parseLyrics, currentLyricText]);

  if (!currentSong) return null;

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-b from-[#2C7C98] via-[#1a4a5e] to-black z-50 overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="h-full flex flex-col max-w-6xl mx-auto">
        {/* 상단 영역 */}
        <div className="w-full flex items-center justify-between px-4 pt-4 pb-2 relative">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="flex items-center gap-1 py-2 px-4 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none min-h-[44px]"
            aria-label="닫기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm text-white">닫기</span>
          </button>
          
          {/* 제스처 핸들 - 중간에 배치 */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-1 bg-white/30 rounded-full"></div>
          </div>
          
          {/* 공유 버튼 */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1 py-2 px-4 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none min-h-[44px]"
            aria-label="공유하기"
          >
            <IoShareOutline className="w-5 h-5 text-white" />
            <span className="text-sm text-white">공유</span>
          </button>
        </div>
        
        {/* 메인 컨텐츠 영역 - 반응형으로 조정 */}
        <div className="flex-grow flex flex-col md:flex-row md:items-start items-center px-4 sm:px-6 pt-4 sm:pt-8 md:gap-8">
          {/* 앨범 커버 */}
          <div className="w-3/5 sm:w-2/5 md:w-1/3 lg:w-1/4 aspect-square max-w-[320px] rounded-2xl overflow-hidden mb-4 sm:mb-6 md:sticky md:top-4 shadow-2xl shadow-black/50 ring-1 ring-white/10">
            <CachedImage
              src={getLocalFileUrl(currentSong.fileName, 'image')}
              alt={currentSong.title}
              width={320}
              height={320}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* 오른쪽 정보 영역 */}
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
            {/* 노래 정보 */}
            <div className="w-full text-center md:text-left mb-4 sm:mb-6">
              <h2 className="text-white text-xl sm:text-2xl font-bold mb-1 truncate">
                {currentSong.title}
              </h2>
              <p className="text-white/70 text-sm sm:text-base truncate">
                {currentSong.artist && !currentSong.artist.includes('계시록') ? currentSong.artist : ''}
              </p>
            </div>
            
            {/* 가사 미리보기 섹션 (좋아요 버튼을 대체) */}
            <div
              className="w-full mb-4 sm:mb-6 bg-white/[0.06] rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all duration-300 border border-white/[0.05]"
              onClick={handleLyricsClick}
            >
              {currentSong.lyrics ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/60">현재 가사</span>
                    <span className="text-xs text-white/60">클릭하여 전체보기</span>
                  </div>
                  <div className="h-[70px] overflow-hidden flex flex-col space-y-2 relative">
                    <div className="font-bold text-lg sm:text-xl text-white leading-snug">
                      {currentLyricText}
                    </div>

                    {nextLyricText && (
                      <div className="text-white/35 text-sm leading-snug">
                        {nextLyricText}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-white/40 py-2">
                  가사가 없습니다
                </div>
              )}
            </div>
            
            {/* 진행 바 */}
            <div className="w-full mb-2">
              <div
                className="h-2 bg-white/15 rounded-full cursor-pointer relative group/progress"
                onClick={handleProgressBarClick}
                role="slider"
                aria-label="재생 진행률"
                aria-valuenow={Math.round(currentTime)}
                aria-valuemin={0}
                aria-valuemax={Math.round(safetyDuration)}
                tabIndex={0}
              >
                <div
                  className="absolute top-0 left-0 h-full bg-white rounded-full"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg shadow-white/30 group-hover/progress:scale-125 transition-transform duration-150"></div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs sm:text-sm text-white">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(safetyDuration)}</span>
              </div>
            </div>
            
            {/* 컨트롤 버튼 */}
            <div className="w-full flex justify-between items-center px-2 sm:px-4 mb-4 sm:mb-8" role="toolbar" aria-label="음악 재생 컨트롤">
              <button
                onClick={onShuffleToggle}
                className={`w-10 sm:w-11 h-10 sm:h-11 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none ${isShuffle ? 'text-white' : 'text-white/50'}`}
                aria-label={isShuffle ? '셔플 끄기' : '셔플 켜기'}
                aria-pressed={isShuffle}
              >
                {/* 셔플 아이콘 */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-6 sm:h-6" aria-hidden="true">
                  <path d="M10.59 9.17L5.41 4L4 5.41L9.17 10.58L10.59 9.17ZM14.5 4L16.54 6.04L4 18.59L5.41 20L17.96 7.46L20 9.5V4H14.5ZM14.83 13.41L13.42 14.82L16.55 17.95L14.5 20H20V14.5L17.96 16.54L14.83 13.41Z" fill="currentColor" />
                </svg>
              </button>
              <button
                onClick={onPrevious}
                className="w-11 sm:w-12 h-11 sm:h-12 flex items-center justify-center text-white rounded-full transition-all duration-200 hover:bg-white/10 active:scale-90 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
                disabled={disabled}
                aria-label="이전 곡"
              >
                {/* 이전곡 아이콘 (skip previous) */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-8 sm:h-8" aria-hidden="true">
                  <path d="M6 6H8V18H6V6ZM9.5 12L18 18V6L9.5 12Z" fill="white" />
                </svg>
              </button>
              <button
                onClick={onPlayPause}
                className="w-16 sm:w-18 h-16 sm:h-18 rounded-full bg-white/15 flex items-center justify-center text-white shadow-lg shadow-black/20 hover:bg-white/20 active:scale-95 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
                disabled={!isReady || disabled}
                aria-label={isPlaying ? '일시정지' : '재생'}
              >
                {isPlaying ? (
                  // 일시정지 아이콘
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-8 sm:h-8" aria-hidden="true">
                    <path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z" fill="white" />
                  </svg>
                ) : (
                  // 재생 아이콘
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-8 sm:h-8" aria-hidden="true">
                    <path d="M8 5V19L19 12L8 5Z" fill="white" />
                  </svg>
                )}
              </button>
              <button
                onClick={onNext}
                className="w-11 sm:w-12 h-11 sm:h-12 flex items-center justify-center text-white rounded-full transition-all duration-200 hover:bg-white/10 active:scale-90 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
                disabled={disabled}
                aria-label="다음 곡"
              >
                {/* 다음곡 아이콘 (skip next) */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-8 sm:h-8" aria-hidden="true">
                  <path d="M6 18L14.5 12L6 6V18ZM16 6V18H18V6H16Z" fill="white" />
                </svg>
              </button>
              <button
                onClick={onPlayModeAction}
                className={`w-10 sm:w-11 h-10 sm:h-11 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none ${playMode !== 'none' ? 'text-white' : 'text-white/50'}`}
                aria-label={playMode === 'one' ? '한 곡 반복 중' : playMode === 'all' ? '전체 반복 중' : '반복 없음'}
              >
                {playMode === 'one' ? (
                  // 한 곡 반복 아이콘
                  <div className="relative">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-6 sm:h-6">
                      <path d="M7 7H17V10L21 6L17 2V5H5V11H7V7Z" fill="currentColor" />
                      <path d="M17 17H7V14L3 18L7 22V19H19V13H17V17Z" fill="currentColor" />
                    </svg>
                    <span className="absolute text-[9px] font-bold" style={{ top: '6px', left: '9px' }}>1</span>
                  </div>
                ) : (
                  // 전체 반복 아이콘
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-6 sm:h-6">
                    <path d="M7 7H17V10L21 6L17 2V5H5V11H7V7Z" fill="currentColor" />
                    <path d="M17 17H7V14L3 18L7 22V19H19V13H17V17Z" fill="currentColor" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* 하단 탭 영역 */}
        <div className="w-full bg-gradient-to-b from-[#1a4a5e]/80 to-black rounded-t-[24px] pt-4 pb-8 md:mt-4">
          {/* 제스처 핸들 */}
          <div className="w-full flex justify-center">
            <div className="w-12 h-1 bg-white/40 rounded-full mb-4"></div>
          </div>
          
          {/* 재생목록 버튼 */}
          <div className="w-full flex justify-center px-4 mb-4">
            <button
              className="bg-white/10 hover:bg-white/20 transition-all duration-200 px-6 py-3 rounded-full text-white text-base sm:text-lg font-bold flex items-center gap-2 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none min-h-[44px]"
              onClick={() => setIsPlaylistVisible(true)}
              aria-label="재생목록 보기"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" fill="currentColor"/>
              </svg>
              <span>재생목록 보기</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 가사 전체화면 */}
      {isLyricsSheetVisible && (
        <Lyrics
          lyrics={currentSong.lyrics}
          isVisible={isLyricsSheetVisible}
          onCloseAction={() => setIsLyricsSheetVisible(false)}
          title={currentSong.title}
          isDarkMode={isDarkMode}
          currentTime={currentTime}
          onSeek={onSeek}
        />
      )}

      {/* 재생목록 관리 화면 */}
      <PlaylistManager
        isVisible={isPlaylistVisible}
        onClose={handlePlaylistClose}
        songs={songs}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        onSelectSong={handleSelectSong}
        onMoveSong={handleMoveSong}
        onDeleteSongs={handleDeleteSongs}
      />
    </div>
  );
}