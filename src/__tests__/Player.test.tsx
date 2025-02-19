import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import toast from 'react-hot-toast';
import Player from '../components/Player';
import '@testing-library/jest-dom';
import type { SongWithChapter, Chapter, Genre } from '../types';

// Mock Audio API
beforeEach(() => {
  window.HTMLMediaElement.prototype.play = jest.fn();
  window.HTMLMediaElement.prototype.pause = jest.fn();
  window.HTMLMediaElement.prototype.load = jest.fn();
});

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockChapter: Chapter = {
  id: 1,
  name: '1장',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockGenre: Genre = {
  id: 'test-genre-id',
  name: 'Test Genre',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockSong: SongWithChapter = {
  id: 1,
  title: 'Test Song',
  fileName: 'test.mp3',
  artist: 'Test Artist',
  driveFileId: '123',
  fileUrl: 'http://test.com/test.mp3',
  duration: '3:00',
  imageId: '',
  imageUrl: '',
  lyrics: '',
  chapterId: 1,
  genreId: '1',
  isNew: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  chapter: {
    id: 1,
    name: 'Test Chapter',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  genre: {
    id: '1',
    name: 'Test Genre',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  popularSong: null,
  url: 'http://test.com/test.mp3',
};

const mockSongs: SongWithChapter[] = [mockSong];

interface PlayerProps {
  currentSong: SongWithChapter;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playMode: 'one' | 'all';
  showLyrics: boolean;
  isDarkMode: boolean;
  isShuffle: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onToggleLyrics: () => void;
  onShowDetail: () => void;
  onPlaylistOpen: () => void;
  onThemeChange: () => void;
  onSeekBackward5: () => void;
  onSeekForward5: () => void;
  onSeekToStart: () => void;
  onShuffleToggle: () => void;
  onPlayModeToggle: () => void;
  onSeekBackward10: () => void;
  onSeekForward10: () => void;
  disabled: boolean;
  songs: SongWithChapter[];
}

const defaultProps: PlayerProps = {
  currentSong: {
    id: '1',
    title: 'Test Song',
    artist: 'Test Artist',
    chapterId: 1,
    duration: 180,
    url: 'test.mp3'
  },
  currentTime: 0,
  duration: 180,
  isPlaying: false,
  playMode: 'all',
  showLyrics: false,
  isDarkMode: false,
  isShuffle: false,
  onPlayPause: jest.fn(),
  onPrevious: jest.fn(),
  onNext: jest.fn(),
  onSeek: jest.fn(),
  onToggleLyrics: jest.fn(),
  onShowDetail: jest.fn(),
  onPlaylistOpen: jest.fn(),
  onThemeChange: jest.fn(),
  onSeekBackward5: jest.fn(),
  onSeekForward5: jest.fn(),
  onSeekToStart: jest.fn(),
  onShuffleToggle: jest.fn(),
  onPlayModeToggle: jest.fn(),
  disabled: false,
  songs: []
};

describe('Player Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Player {...defaultProps} />);
    expect(screen.getByText(defaultProps.currentSong.title)).toBeInTheDocument();
  });

  it('displays play button when not playing', () => {
    render(<Player {...defaultProps} />);
    expect(screen.getByLabelText('재생')).toBeInTheDocument();
  });

  it('displays pause button when playing', () => {
    render(<Player {...defaultProps} isPlaying={true} />);
    expect(screen.getByLabelText('일시정지')).toBeInTheDocument();
  });

  it('calls onPlayPause when play/pause button is clicked', () => {
    render(<Player {...defaultProps} />);
    const playButton = screen.getByLabelText('재생');
    fireEvent.click(playButton);
    expect(defaultProps.onPlayPause).toHaveBeenCalled();
  });

  it('calls onPrevious when previous button is clicked', () => {
    render(<Player {...defaultProps} />);
    const prevButton = screen.getByLabelText('이전');
    fireEvent.click(prevButton);
    expect(defaultProps.onPrevious).toHaveBeenCalled();
  });

  it('calls onNext when next button is clicked', () => {
    render(<Player {...defaultProps} />);
    const nextButton = screen.getByLabelText('다음');
    fireEvent.click(nextButton);
    expect(defaultProps.onNext).toHaveBeenCalled();
  });

  it('displays correct song title', () => {
    render(<Player {...defaultProps} />);
    expect(screen.getByText('Test Song')).toBeInTheDocument();
  });

  it('displays correct artist name', () => {
    render(<Player {...defaultProps} />);
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('displays correct chapter information', () => {
    render(<Player {...defaultProps} />);
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
  });

  it('displays shuffle button in inactive state by default', () => {
    render(<Player {...defaultProps} />);
    expect(screen.getByLabelText('셔플 꺼짐')).toBeInTheDocument();
  });

  it('displays repeat button in all mode by default', () => {
    render(<Player {...defaultProps} />);
    expect(screen.getByLabelText('전체 반복')).toBeInTheDocument();
  });

  it('should handle previous button click', () => {
    render(<Player {...defaultProps} />);
    const prevButton = screen.getByLabelText('이전');
    fireEvent.click(prevButton);
    expect(defaultProps.onPrevious).toHaveBeenCalled();
  });

  it('should handle next button click', () => {
    render(<Player {...defaultProps} />);
    const nextButton = screen.getByLabelText('다음');
    fireEvent.click(nextButton);
    expect(defaultProps.onNext).toHaveBeenCalled();
  });

  it('should show error message when no previous song', () => {
    render(<Player {...defaultProps} songs={[mockSong]} />);
    const prevButton = screen.getByLabelText('이전');
    fireEvent.click(prevButton);
    expect(toast.error).toHaveBeenCalledWith('이전 곡이 없습니다.');
  });

  it('should show error message when no next song in one mode', () => {
    render(<Player {...defaultProps} songs={[mockSong]} playMode="one" />);
    const nextButton = screen.getByLabelText('다음');
    fireEvent.click(nextButton);
    expect(toast.error).toHaveBeenCalledWith('다음 곡이 없습니다.');
  });

  it('should not show error message when no next song in all mode', () => {
    render(<Player {...defaultProps} songs={[mockSong]} playMode="all" />);
    const nextButton = screen.getByLabelText('다음');
    fireEvent.click(nextButton);
    expect(defaultProps.onNext).toHaveBeenCalled();
  });
});
