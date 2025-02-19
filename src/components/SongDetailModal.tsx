import { SongWithChapter } from '@/types';
import CachedImage from './CachedImage';
import {
  ChevronDownIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  ArrowUturnLeftIcon,
  ArrowsRightLeftIcon,
  ArrowPathIcon as ArrowPathIconOutline,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import {
  ChevronDownIcon as ChevronDownIconSolid,
  EllipsisVerticalIcon as EllipsisVerticalIconSolid,
} from '@heroicons/react/24/solid';
import { Menu } from '@headlessui/react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { MdRepeatOne, MdRepeat } from 'react-icons/md';
import { getProxiedImageUrl } from '@/utils/imageUtils';

interface SongDetailModalProps {
  song: SongWithChapter;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onClose: () => void;
  onPlayPauseAction: () => void;
  onPrevAction: () => void;
  onNextAction: () => void;
  onSeekAction: (time: number) => void;
  playMode: 'all' | 'one' | 'none';
  onPlayModeAction: () => void;
  isShuffle: boolean;
  onShuffleAction: () => void;
  onSeekBackward5Action: () => void;
  onSeekForward5Action: () => void;
  onSeekToStartAction: () => void;
  isDarkMode?: boolean;
}

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

const TextSizeIcon = ({ className, size }: { className?: string; size: 'x1' | 'x2' | 'x3' | 'x4' | 'x5' }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none"
      stroke="currentColor"
      className={className}
    >
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <text
        x="12"
        y="14.5"
        fontSize="11"
        fill="currentColor"
        textAnchor="middle"
        style={{ fontWeight: 'bold' }}
      >
        {size}
      </text>
    </svg>
  );
};

const SongDetailModal: React.FC<SongDetailModalProps> = ({
  song,
  currentTime,
  duration,
  isPlaying,
  onClose,
  onPlayPauseAction,
  onPrevAction,
  onNextAction,
  onSeekAction,
  playMode,
  onPlayModeAction,
  isShuffle,
  onShuffleAction,
  onSeekBackward5Action,
  onSeekForward5Action,
  onSeekToStartAction,
  isDarkMode = false,
}: SongDetailModalProps) => {
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  const [fontSize, setFontSize] = useState<'x1' | 'x2' | 'x3' | 'x4' | 'x5'>('x3');

  // 프록시 URL 생성
  const getProxyUrl = useCallback((fileUrl: string | null) => {
    if (!fileUrl) return '';
    const fileId = fileUrl.split('id=')[1];
    if (!fileId) return '';
    return `/api/proxy/${fileId}`;
  }, []);

  const handleSeek = useCallback((time: number) => {
    onSeekAction(time);
  }, [onSeekAction]);

  const handlePlayPause = useCallback(() => {
    onPlayPauseAction();
  }, [onPlayPauseAction]);

  const handlePrev = useCallback(() => {
    onPrevAction();
  }, [onPrevAction]);

  const handleNext = useCallback(() => {
    onNextAction();
  }, [onNextAction]);

  const handleSeekBackward5 = useCallback(() => {
    onSeekBackward5Action();
  }, [onSeekBackward5Action]);

  const handleSeekForward5 = useCallback(() => {
    onSeekForward5Action();
  }, [onSeekForward5Action]);

  const handleSeekToStart = useCallback(() => {
    onSeekToStartAction();
  }, [onSeekToStartAction]);

  const handleShuffle = useCallback(() => {
    onShuffleAction();
  }, [onShuffleAction]);

  const handlePlayMode = useCallback(() => {
    onPlayModeAction();
  }, [onPlayModeAction]);

  // 시간 이동
  const seek = useCallback((seconds: number) => {
    if (onSeekAction) {
      const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
      onSeekAction(newTime);
    }
  }, [currentTime, duration, onSeekAction]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'a':
          e.preventDefault();
          if (e.shiftKey) {
            seek(-5);
          } else {
            seek(-5);
          }
          break;
        case 'd':
          e.preventDefault();
          if (e.shiftKey) {
            seek(5);
          } else {
            seek(5);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (song.lyrics) {
      setParsedLyrics(parseLyrics(song.lyrics));
    }
  }, [song.lyrics]);

  useEffect(() => {
    if (!parsedLyrics.length) return;

    const index = parsedLyrics.findIndex((line, i) => {
      const nextLine = parsedLyrics[i + 1];
      return (
        currentTime >= line.time &&
        (!nextLine || currentTime < nextLine.time)
      );
    });

    if (index !== -1) {
      setCurrentLyricIndex(index);
    }
  }, [currentTime, parsedLyrics]);

  const visibleLyrics = useMemo(() => {
    if (!parsedLyrics.length) return [];

    if (showFullLyrics) {
      return parsedLyrics.map((line, index) => ({
        ...line,
        isCurrent: index === currentLyricIndex
      }));
    }
    
    // 미니 모드일 때의 로직
    const start = Math.max(0, currentLyricIndex - 1);
    const visibleLines = parsedLyrics
      .slice(start, start + 3)
      .map((line, index) => ({
        ...line,
        isCurrent: index === 1
      }));

    // 첫 번째 가사일 때는 예외 처리
    if (currentLyricIndex === 0) {
      return visibleLines.map((line, index) => ({
        ...line,
        isCurrent: index === 0
      }));
    }

    return visibleLines;
  }, [parsedLyrics, currentLyricIndex, showFullLyrics]);

  const fontSizeClass = {
    x1: 'text-sm',
    x2: 'text-base',
    x3: 'text-lg',
    x4: 'text-xl',
    x5: 'text-2xl'
  }[fontSize];

  return (
    <div className={`fixed inset-0 ${isDarkMode ? 'bg-black' : 'bg-white'} z-50 flex flex-col h-full`}>
      {/* 상단 헤더 */}
      <div className={`flex-none flex items-center justify-between px-4 py-3 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex-1">
          <h1 className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{song.title}</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{song.artist}</p>
        </div>
        <div className="flex items-center gap-4">
          {showFullLyrics && (
            <button 
              onClick={() => setFontSize(size => {
                const sizes: ('x1' | 'x2' | 'x3' | 'x4' | 'x5')[] = ['x1', 'x2', 'x3', 'x4', 'x5'];
                const currentIndex = sizes.indexOf(size);
                return sizes[(currentIndex + 1) % sizes.length];
              })}
              className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} mr-4 px-2 py-1 rounded`}
            >
              x{fontSize.slice(1)}
            </button>
          )}
          {!showFullLyrics && (
            <Menu as="div" className="relative">
              <Menu.Button className={`${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} p-2 rounded-full`}>
                <EllipsisVerticalIconSolid className="w-6 h-6" />
              </Menu.Button>
              <Menu.Items className={`absolute right-0 mt-2 w-56 origin-top-right ${isDarkMode ? 'bg-gray-800 ring-black' : 'bg-white ring-gray-200'} rounded-md shadow-lg ring-1 ring-opacity-5 focus:outline-none z-50`}>
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleSeekToStart}
                        className={`${
                          active ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') : ''
                        } ${isDarkMode ? 'text-white' : 'text-gray-900'} group flex items-center w-full px-4 py-2 text-sm`}
                      >
                        <ArrowUturnLeftIcon className="mr-3 h-5 w-5" />
                        처음으로
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleShuffle}
                        className={`${
                          active ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') : ''
                        } ${isDarkMode ? 'text-white' : 'text-gray-900'} group flex items-center w-full px-4 py-2 text-sm`}
                      >
                        <ArrowsRightLeftIcon className={`mr-3 h-5 w-5 ${isShuffle ? 'text-[#1ED760]' : ''}`} />
                        셔플 {isShuffle ? '켜짐' : '꺼짐'}
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handlePlayMode}
                        className={`${
                          active ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') : ''
                        } ${isDarkMode ? 'text-white' : 'text-gray-900'} group flex items-center w-full px-4 py-2 text-sm`}
                      >
                        {playMode === 'none' ? (
                          <ArrowPathIconOutline className="mr-3 h-5 w-5" />
                        ) : playMode === 'all' ? (
                          <MdRepeat className="mr-3 h-5 w-5 text-[#1ED760]" />
                        ) : (
                          <MdRepeatOne className="mr-3 h-5 w-5 text-[#1ED760]" />
                        )}
                        {playMode === 'none' ? '반복 없음' :
                         playMode === 'all' ? '전체 반복' :
                         '한곡 반복'}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>
          )}
          <button 
            onClick={() => {
              if (showFullLyrics) {
                setShowFullLyrics(false);
              } else {
                onClose();
              }
            }} 
            className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            aria-label="닫기"
          >
            <ChevronDownIconSolid className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      {showFullLyrics ? (
        // 가사 전체 보기 모드
        <div className={`fixed inset-0 z-50 flex flex-col ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
          {/* 헤더 */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setShowFullLyrics(false)}
              className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <ChevronDownIcon className="w-6 h-6" />
            </button>
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>전체 가사</span>
            <div className="w-10" /> {/* 균형을 위한 여백 */}
          </div>

          {/* 가사 내용 */}
          <div className={`flex-1 overflow-y-auto px-4 py-6 space-y-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
            {parsedLyrics.map((line, index) => (
              <div
                key={index}
                className={`transition-colors duration-200
                  ${currentLyricIndex === index ? 'text-blue-500 font-medium' : ''}
                `}
              >
                {line.text}
              </div>
            ))}
          </div>

          {/* 오디오 컨트롤 패널 */}
          <div className={`border-t p-4 space-y-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {/* 재생 시간 */}
            <div className={`flex justify-between text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* 프로그레스 바 */}
            <div className={`relative h-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full`}>
              <div
                className="absolute h-full bg-blue-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={(e) => onSeekAction(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* 컨트롤 버튼 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* 재생 모드 */}
                <button
                  onClick={onPlayModeAction}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  {playMode === 'one' ? (
                    <MdRepeatOne className="w-5 h-5" />
                  ) : playMode === 'all' ? (
                    <MdRepeat className="w-5 h-5" />
                  ) : (
                    <ArrowPathIconOutline className="w-5 h-5" />
                  )}
                </button>

                {/* 이전 곡 */}
                <button
                  onClick={onPrevAction}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <BackwardIcon className="w-5 h-5" />
                </button>

                {/* 5초 뒤로 */}
                <button
                  onClick={onSeekBackward5Action}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <ChevronDoubleLeftIcon className="w-5 h-5" />
                </button>
              </div>

              {/* 재생/일시정지 */}
              <button
                onClick={onPlayPauseAction}
                className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
              >
                {isPlaying ? (
                  <PauseIcon className="w-6 h-6" />
                ) : (
                  <PlayIcon className="w-6 h-6" />
                )}
              </button>

              <div className="flex items-center space-x-4">
                {/* 5초 앞으로 */}
                <button
                  onClick={onSeekForward5Action}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <ChevronDoubleRightIcon className="w-5 h-5" />
                </button>

                {/* 다음 곡 */}
                <button
                  onClick={onNextAction}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <ForwardIcon className="w-5 h-5" />
                </button>

                {/* 셔플 */}
                <button
                  onClick={onShuffleAction}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <ArrowsRightLeftIcon className={`w-5 h-5 ${isShuffle ? 'text-[#1ED760]' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 기본 모드
        <div className="flex-1 flex flex-col">
          {/* 앨범 아트 */}
          <div className="flex-none px-8 pt-4">
            <div className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden">
              {song.imageUrl ? (
                <CachedImage
                  src={song.imageUrl}
                  alt={song.title}
                  width={400}
                  height={400}
                  className="rounded-lg object-cover w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 bg-gray-800" />
              )}
            </div>
          </div>

          {/* 가사 영역 - 자동 중앙 배치 */}
          {song.lyrics && (
            <div 
              className="flex-1 px-4 flex items-center justify-center cursor-pointer"
              onClick={() => setShowFullLyrics(true)}
            >
              <div className="w-full text-center">
                {visibleLyrics.map((line, index) => (
                  <div
                    key={index}
                    className={`relative transition-all duration-300 mb-4 last:mb-0 px-4 py-2 rounded-lg
                      ${line.isCurrent 
                        ? `text-${isDarkMode ? 'white' : 'gray-900'} font-medium bg-${isDarkMode ? 'white/10' : 'gray-100/10'}` 
                        : `text-${isDarkMode ? 'gray-500' : 'gray-600'}`}
                    `}
                  >
                    {line.isCurrent && (
                      <div className="absolute left-0 top-0 w-1.5 h-full bg-blue-500 rounded-full" />
                    )}
                    <span className={line.isCurrent ? 'text-lg' : 'text-base'}>
                      {line.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 하단 컨트롤 */}
          <div className="flex-none px-4 pb-6 space-y-4">
            {/* 재생 시간 */}
            <div className={`flex justify-between text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* 프로그레스 바 */}
            <div className={`relative h-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full`}>
              <div
                className="absolute h-full bg-blue-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={(e) => onSeekAction(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* 컨트롤 버튼 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* 재생 모드 */}
                <button
                  onClick={onPlayModeAction}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  {playMode === 'one' ? (
                    <MdRepeatOne className="w-5 h-5" />
                  ) : playMode === 'all' ? (
                    <MdRepeat className="w-5 h-5" />
                  ) : (
                    <ArrowPathIconOutline className="w-5 h-5" />
                  )}
                </button>

                {/* 이전 곡 */}
                <button
                  onClick={onPrevAction}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <BackwardIcon className="w-5 h-5" />
                </button>

                {/* 5초 뒤로 */}
                <button
                  onClick={onSeekBackward5Action}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <ChevronDoubleLeftIcon className="w-5 h-5" />
                </button>
              </div>

              {/* 재생/일시정지 */}
              <button
                onClick={onPlayPauseAction}
                className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
              >
                {isPlaying ? (
                  <PauseIcon className="w-6 h-6" />
                ) : (
                  <PlayIcon className="w-6 h-6" />
                )}
              </button>

              <div className="flex items-center space-x-4">
                {/* 5초 앞으로 */}
                <button
                  onClick={onSeekForward5Action}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <ChevronDoubleRightIcon className="w-5 h-5" />
                </button>

                {/* 다음 곡 */}
                <button
                  onClick={onNextAction}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <ForwardIcon className="w-5 h-5" />
                </button>

                {/* 셔플 */}
                <button
                  onClick={onShuffleAction}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <ArrowsRightLeftIcon className={`w-5 h-5 ${isShuffle ? 'text-[#1ED760]' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongDetailModal;

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
