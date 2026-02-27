import React from 'react';
import {
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  ArrowPathRoundedSquareIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/solid';

export interface PlayerControlsProps {
  isPlaying: boolean;
  isShuffle: boolean;
  playMode: 'all' | 'one';
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onShuffleToggle: () => void;
  onPlayModeToggle: () => void;
  onSeekBackward5: () => void;
  onSeekForward5: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  disabled?: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  isShuffle,
  playMode,
  onPlayPause,
  onPrevious,
  onNext,
  onShuffleToggle,
  onPlayModeToggle,
  onSeekBackward5,
  onSeekForward5,
  currentTime,
  duration,
  onSeek,
  disabled = false,
}) => {
  const buttonClass = `p-2 rounded-full hover:bg-gray-100 ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  }`;

  return (
    <div className="flex flex-col space-y-4">
      {/* Progress Bar */}
      <div className="w-full">
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex items-center justify-center space-x-4">
        <button
          className={buttonClass}
          onClick={onShuffleToggle}
          disabled={disabled}
          title="셔플 모드"
        >
          <ArrowsRightLeftIcon
            className={`w-5 h-5 ${isShuffle ? 'text-blue-500' : 'text-gray-500'}`}
          />
        </button>

        <button
          className={buttonClass}
          onClick={onSeekBackward5}
          disabled={disabled}
          title="5초 뒤로"
        >
          <BackwardIcon className="w-5 h-5 text-gray-500" />
        </button>

        <button
          className={`${buttonClass} bg-blue-500 hover:bg-blue-600 p-3`}
          onClick={onPlayPause}
          disabled={disabled}
          title={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? (
            <PauseIcon className="w-6 h-6 text-white" />
          ) : (
            <PlayIcon className="w-6 h-6 text-white" />
          )}
        </button>

        <button
          className={buttonClass}
          onClick={onSeekForward5}
          disabled={disabled}
          title="5초 앞으로"
        >
          <ForwardIcon className="w-5 h-5 text-gray-500" />
        </button>

        <button
          className={buttonClass}
          onClick={onPlayModeToggle}
          disabled={disabled}
          title="재생 모드"
        >
          <ArrowPathRoundedSquareIcon
            className={`w-5 h-5 ${
              playMode === 'one' ? 'text-blue-500' : 'text-gray-500'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
