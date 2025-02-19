'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SongWithChapter } from '@/types';
import {
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import SongDetailModal from './SongDetailModal';
import toast from 'react-hot-toast';

interface LyricLine {
  time: number;
  text: string;
}

function parseLyrics(lyrics: string): LyricLine[] {
  if (!lyrics) return [];
  
  const lines = lyrics.split('\n');
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2})\]/;
  
  return lines
    .map(line => {
      const match = timeRegex.exec(line);
      if (!match) return null;
      
      const [, minutes, seconds, centiseconds] = match;
      const time = parseInt(minutes) * 60 + parseInt(seconds) + parseInt(centiseconds) / 100;
      const text = line.replace(timeRegex, '').trim();
      
      return { time, text };
    })
    .filter((line): line is LyricLine => line !== null);
}

interface PlayerProps {
  currentSong: SongWithChapter | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
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
}

const Player: React.FC<PlayerProps> = ({
  currentSong,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  onSeek,
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
}) => {
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [showDetail, setShowDetail] = useState(false);

  // 가사 파싱
  useEffect(() => {
    if (currentSong?.lyrics) {
      setParsedLyrics(parseLyrics(currentSong.lyrics));
    } else {
      setParsedLyrics([]);
    }
  }, [currentSong?.lyrics]);

  // 현재 가사 인덱스 업데이트
  useEffect(() => {
    const newIndex = parsedLyrics.findIndex(lyric => lyric.time > currentTime);
    setCurrentLyricIndex(newIndex);
  }, [currentTime, parsedLyrics]);

  const handlePlayPause = useCallback(() => {
    onPlayPause();
  }, [onPlayPause]);

  const handlePrevButtonClick = useCallback(() => {
    onPrevious();
  }, [onPrevious]);

  const handleNextButtonClick = useCallback(() => {
    onNext();
  }, [onNext]);

  const handleSeek = useCallback((time: number) => {
    onSeek(time);
  }, [onSeek]);

  const handleShuffleToggle = useCallback(() => {
    onShuffleToggle();
  }, [onShuffleToggle]);

  const getProxyUrl = useCallback((fileUrl: string | null) => {
    if (!fileUrl) return '';
    const fileId = fileUrl.split('id=')[1];
    return `/api/proxy/${fileId}`;
  }, []);

  return (
    <>
      <div className={`fixed bottom-[56px] left-0 right-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} transition-colors duration-200`}>
        <div className="max-w-screen-lg mx-auto">
          {currentSong ? (
            <>
              {/* 프로그레스 바 */}
              <div 
                className={`h-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} cursor-pointer relative`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  const newTime = percentage * duration;
                  handleSeek(newTime);
                }}
              >
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const newTime = Number(e.target.value);
                    handleSeek(newTime);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* 컨트롤 */}
              <div className="flex items-center justify-between px-4 py-2">
                {/* 곡 제목과 챕터 */}
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setShowDetail(true)}
                >
                  <div className={`text-[13px] truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {currentSong.title}
                  </div>
                  <div className={`text-[13px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {currentSong.artist}
                  </div>
                </div>

                {/* 재생 컨트롤 */}
                <div className="flex items-center space-x-4">
                  <button
                    className={`p-2 hover:bg-opacity-10 hover:bg-gray-900 rounded-full ${
                      isDarkMode ? 'text-white' : 'text-gray-700'
                    }`}
                    onClick={onPrevious}
                    aria-label="이전"
                  >
                    <BackwardIcon className="w-5 h-5" />
                  </button>
                  <button
                    className={`p-2 hover:bg-opacity-10 hover:bg-gray-900 rounded-full ${
                      isPlaying ? 'text-blue-500' : isDarkMode ? 'text-white' : 'text-gray-700'
                    }`}
                    onClick={onPlayPause}
                    aria-label={isPlaying ? '일시정지' : '재생'}
                  >
                    {isPlaying ? (
                      <PauseIcon className="w-6 h-6" />
                    ) : (
                      <PlayIcon className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    className={`p-2 hover:bg-opacity-10 hover:bg-gray-900 rounded-full ${
                      isDarkMode ? 'text-white' : 'text-gray-700'
                    }`}
                    onClick={onNext}
                    aria-label="다음"
                  >
                    <ForwardIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="px-4 py-3 flex flex-col items-center justify-center">
              <p className={`text-[13px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                재생할 곡이 없습니다
              </p>
              <p className={`text-[12px] mt-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-500'}`}>
                곡을 선택해주세요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 전체 가사 모달 */}
      {showDetail && currentSong && (
        <SongDetailModal
          song={currentSong}
          onClose={() => setShowDetail(false)}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onPlayPauseAction={onPlayPause}
          onPrevAction={onPrevious}
          onNextAction={onNext}
          onSeekAction={onSeek}
          onSeekBackward5Action={onSeekBackward5}
          onSeekForward5Action={onSeekForward5}
          playMode={playMode}
          onPlayModeAction={onPlayModeAction}
          isShuffle={isShuffle}
          onShuffleAction={onShuffleToggle}
          onSeekToStartAction={onSeekToStart}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
};

export default Player;