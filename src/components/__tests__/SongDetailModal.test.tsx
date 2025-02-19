import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import SongDetailModal from '../SongDetailModal';
import '@testing-library/jest-dom';
import type { SongWithChapter } from '../../types';

const mockChapter = {
  id: 1,
  name: "Test Chapter",
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockGenre = {
  id: "1",
  name: "Test Genre",
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockSong: SongWithChapter = {
  id: 1,
  title: "Test Song",
  fileName: "test.mp3",
  artist: "Test Artist",
  driveFileId: "",
  fileUrl: "test.mp3",
  duration: "03:00",
  lyrics: "",
  isNew: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  chapterId: 1,
  genreId: "1",
  chapter: mockChapter,
  genre: mockGenre,
  popularSong: null,
  url: "",
  imageId: "",
  imageUrl: ""
};

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
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
  onPlayPause: jest.fn(),
  onSeek: jest.fn(),
  onSeekBackward10: jest.fn(),
  onSeekForward10: jest.fn(),
  onSeekToStart: jest.fn(),
  onSeekBackward5: jest.fn(),
  onSeekForward5: jest.fn(),
};

describe('SongDetailModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('재생/일시정지 버튼이 작동해야 함', async () => {
    render(<SongDetailModal {...defaultProps} />);
    const playButton = screen.getByLabelText('재생');
    await act(async () => {
      fireEvent.click(playButton);
    });
    expect(defaultProps.onPlayPause).toHaveBeenCalled();
  });

  it('시간 이동이 작동해야 함', async () => {
    render(<SongDetailModal {...defaultProps} />);
    const seekForward10Button = screen.getByLabelText('10초 앞으로');
    await act(async () => {
      fireEvent.click(seekForward10Button);
    });
    expect(defaultProps.onSeekForward10).toHaveBeenCalled();
  });

  it('모달이 닫혀야 함', async () => {
    render(<SongDetailModal {...defaultProps} />);
    const closeButton = screen.getByLabelText('닫기');
    await act(async () => {
      fireEvent.click(closeButton);
    });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('노래 정보가 올바르게 표시되어야 함', () => {
    render(<SongDetailModal {...defaultProps} />);

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });
});
