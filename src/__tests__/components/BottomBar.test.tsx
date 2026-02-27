import { render, screen, fireEvent } from '@testing-library/react';
import BottomBar from '@/components/BottomBar';
import type { SongWithChapter } from '@/types';

// ─────────────────────────────────────────────
// 컴포넌트 모의 설정
// ─────────────────────────────────────────────

// CachedImage 모의 컴포넌트
jest.mock('@/components/CachedImage', () => {
  return function MockCachedImage(props: { alt: string; src: string }) {
    return <img alt={props.alt} src={props.src} data-testid="cached-image" />;
  };
});

// Player 모의 컴포넌트
jest.mock('@/components/Player', () => {
  return function MockPlayer() {
    return <div data-testid="player-modal">Player Modal</div>;
  };
});

// PlaylistManager 모의 컴포넌트
jest.mock('@/components/PlaylistManager', () => {
  return function MockPlaylistManager() {
    return <div data-testid="playlist-manager">Playlist Manager</div>;
  };
});

// fileUtils 모의 설정
jest.mock('@/utils/fileUtils', () => ({
  getLocalFileUrl: jest.fn((fileName: string, type: string) => {
    const ext = type === 'audio' ? 'mp3' : 'jpg';
    return `/music/${fileName}.${ext}`;
  }),
}));

// @heroicons/react 모의 설정
jest.mock('@heroicons/react/24/solid', () => ({
  PlayIcon: function MockPlayIcon() {
    return <svg data-testid="play-icon" />;
  },
  PauseIcon: function MockPauseIcon() {
    return <svg data-testid="pause-icon" />;
  },
  BackwardIcon: function MockBackwardIcon() {
    return <svg data-testid="backward-icon" />;
  },
  ForwardIcon: function MockForwardIcon() {
    return <svg data-testid="forward-icon" />;
  },
}));

// ─────────────────────────────────────────────
// 테스트 헬퍼 함수
// ─────────────────────────────────────────────

function createMockSong(overrides: Partial<SongWithChapter> = {}): SongWithChapter {
  return {
    id: 1,
    title: '계시록 찬양 1장',
    fileName: '1-1',
    artist: '찬양팀',
    driveFileId: null,
    fileUrl: null,
    audioUrl: null,
    duration: '180',
    imageId: null,
    imageUrl: null,
    lyrics: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    chapter: { id: 1, name: '1장', order: 1, createdAt: new Date(), updatedAt: new Date() },
    genre: { id: 'ccm', name: 'CCM' },
    popularSong: false,
    url: '/music/1-1.mp3',
    ...overrides,
  };
}

/** 기본 props를 생성하여 반복 코드를 줄인다 */
function createDefaultProps(overrides: Record<string, unknown> = {}) {
  return {
    currentSong: createMockSong(),
    isPlaying: false,
    onPlayPause: jest.fn(),
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    currentTime: 0,
    duration: 0,
    onSeek: jest.fn(),
    isReady: false,
    isShuffle: false,
    onShuffleToggle: jest.fn(),
    playMode: 'none' as const,
    onPlayModeAction: jest.fn(),
    onSeekBackward5: jest.fn(),
    onSeekForward5: jest.fn(),
    onSeekToStart: jest.fn(),
    disabled: false,
    songs: [createMockSong()],
    isDarkMode: false,
    onSongSelect: jest.fn(),
    onMoveSong: jest.fn(),
    onDeleteSongs: jest.fn(),
    ...overrides,
  };
}

describe('BottomBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // currentSong이 null인 경우
  // ─────────────────────────────────────────────
  describe('currentSong이 null인 경우', () => {
    it('currentSong이 null이면 아무것도 렌더링하지 않는다', () => {
      const props = createDefaultProps({ currentSong: null });
      const { container } = render(<BottomBar {...props} />);

      // BottomBar returns null, so the container should be empty
      expect(container.innerHTML).toBe('');
    });
  });

  // ─────────────────────────────────────────────
  // 노래 정보 표시
  // ─────────────────────────────────────────────
  describe('노래 정보 표시', () => {
    it('currentSong이 있으면 노래 제목이 표시된다', () => {
      const props = createDefaultProps({
        currentSong: createMockSong({ title: '새 찬양' }),
      });
      render(<BottomBar {...props} />);

      expect(screen.getByText('새 찬양')).toBeInTheDocument();
    });

    it('currentSong이 있으면 아티스트 이름이 표시된다', () => {
      const props = createDefaultProps({
        currentSong: createMockSong({ artist: '은혜 찬양팀' }),
      });
      render(<BottomBar {...props} />);

      expect(screen.getByText('은혜 찬양팀')).toBeInTheDocument();
    });

    it('앨범 이미지가 표시된다', () => {
      const props = createDefaultProps();
      render(<BottomBar {...props} />);

      const image = screen.getByTestId('cached-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('alt', '계시록 찬양 1장');
    });
  });

  // ─────────────────────────────────────────────
  // 재생/일시정지 버튼
  // ─────────────────────────────────────────────
  describe('재생/일시정지 버튼', () => {
    it('일시정지 중일 때 재생 버튼(aria-label="재생")이 표시된다', () => {
      const props = createDefaultProps({ isPlaying: false });
      render(<BottomBar {...props} />);

      expect(screen.getByRole('button', { name: '재생' })).toBeInTheDocument();
    });

    it('재생 중일 때 일시정지 버튼(aria-label="일시정지")이 표시된다', () => {
      const props = createDefaultProps({ isPlaying: true });
      render(<BottomBar {...props} />);

      expect(screen.getByRole('button', { name: '일시정지' })).toBeInTheDocument();
    });

    it('isReady가 true일 때 재생/일시정지 버튼 클릭 시 onPlayPause가 호출된다', () => {
      const mockOnPlayPause = jest.fn();
      const props = createDefaultProps({
        isReady: true,
        isPlaying: true,
        duration: 180,
        onPlayPause: mockOnPlayPause,
      });
      render(<BottomBar {...props} />);

      // 자동 재생 useEffect가 isPlaying=true이므로 발동하지 않음
      const pauseButton = screen.getByRole('button', { name: '일시정지' });
      fireEvent.click(pauseButton);

      expect(mockOnPlayPause).toHaveBeenCalled();
    });

    it('isReady가 false일 때 재생 버튼이 비활성화된다', () => {
      const props = createDefaultProps({ isReady: false });
      render(<BottomBar {...props} />);

      const playButton = screen.getByRole('button', { name: '재생' });
      expect(playButton).toBeDisabled();
    });

    it('isReady가 false일 때 클릭해도 onPlayPause가 호출되지 않는다', () => {
      const mockOnPlayPause = jest.fn();
      const props = createDefaultProps({
        isReady: false,
        onPlayPause: mockOnPlayPause,
      });
      render(<BottomBar {...props} />);

      const playButton = screen.getByRole('button', { name: '재생' });
      fireEvent.click(playButton);

      // isReady=false이므로 handlePlayPause에서 early return
      expect(mockOnPlayPause).not.toHaveBeenCalled();
    });

    it('disabled가 true일 때 재생 버튼이 비활성화된다', () => {
      const props = createDefaultProps({ isReady: true, disabled: true });
      render(<BottomBar {...props} />);

      const playButton = screen.getByRole('button', { name: '재생' });
      expect(playButton).toBeDisabled();
    });
  });

  // ─────────────────────────────────────────────
  // 진행률 바
  // ─────────────────────────────────────────────
  describe('진행률 바', () => {
    it('진행률 슬라이더가 렌더링된다', () => {
      const props = createDefaultProps({ currentTime: 0, duration: 180 });
      render(<BottomBar {...props} />);

      expect(screen.getByRole('slider', { name: '재생 진행률' })).toBeInTheDocument();
    });

    it('currentTime이 0이고 duration이 180일 때 진행률이 0%이다', () => {
      const props = createDefaultProps({ currentTime: 0, duration: 180 });
      render(<BottomBar {...props} />);

      const slider = screen.getByRole('slider', { name: '재생 진행률' });
      // 진행률 바 내부의 채워진 부분
      const progressFill = slider.firstElementChild as HTMLElement;
      expect(progressFill).toHaveStyle({ width: '0%' });
    });

    it('currentTime이 90이고 duration이 180일 때 진행률이 50%이다', () => {
      const props = createDefaultProps({ currentTime: 90, duration: 180 });
      render(<BottomBar {...props} />);

      const slider = screen.getByRole('slider', { name: '재생 진행률' });
      const progressFill = slider.firstElementChild as HTMLElement;
      expect(progressFill).toHaveStyle({ width: '50%' });
    });

    it('currentTime이 180이고 duration이 180일 때 진행률이 100%이다', () => {
      const props = createDefaultProps({ currentTime: 180, duration: 180 });
      render(<BottomBar {...props} />);

      const slider = screen.getByRole('slider', { name: '재생 진행률' });
      const progressFill = slider.firstElementChild as HTMLElement;
      expect(progressFill).toHaveStyle({ width: '100%' });
    });

    it('duration이 0일 때 진행률이 0%이다', () => {
      const props = createDefaultProps({ currentTime: 50, duration: 0 });
      render(<BottomBar {...props} />);

      const slider = screen.getByRole('slider', { name: '재생 진행률' });
      const progressFill = slider.firstElementChild as HTMLElement;
      expect(progressFill).toHaveStyle({ width: '0%' });
    });

    it('슬라이더의 aria-valuenow가 현재 재생 시간을 반영한다', () => {
      const props = createDefaultProps({ currentTime: 45, duration: 180 });
      render(<BottomBar {...props} />);

      const slider = screen.getByRole('slider', { name: '재생 진행률' });
      expect(slider).toHaveAttribute('aria-valuenow', '45');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '180');
    });
  });

  // ─────────────────────────────────────────────
  // 재생목록 보기 버튼
  // ─────────────────────────────────────────────
  describe('재생목록 보기 버튼', () => {
    it('재생목록 보기 버튼이 렌더링된다', () => {
      const props = createDefaultProps();
      render(<BottomBar {...props} />);

      expect(screen.getByRole('button', { name: '재생목록 보기' })).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────
  // 재생 컨트롤 툴바
  // ─────────────────────────────────────────────
  describe('재생 컨트롤 툴바', () => {
    it('재생 컨트롤 영역이 toolbar 역할을 갖는다', () => {
      const props = createDefaultProps();
      render(<BottomBar {...props} />);

      expect(screen.getByRole('toolbar', { name: '재생 컨트롤' })).toBeInTheDocument();
    });
  });
});
