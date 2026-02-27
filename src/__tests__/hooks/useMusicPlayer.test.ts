import { renderHook, act } from '@testing-library/react';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import type { SongWithChapter } from '@/types';

// Mock useAudioPlayer dependency
const mockTogglePlay = jest.fn();
const mockSeek = jest.fn();
const mockSetVolume = jest.fn();
const mockAudioRef = { current: null };

jest.mock('@/hooks/useAudioPlayer', () => ({
  useAudioPlayer: jest.fn(() => ({
    currentTime: 0,
    duration: 0,
    isReady: false,
    isLoading: false,
    error: null,
    togglePlay: mockTogglePlay,
    seek: mockSeek,
    setVolume: mockSetVolume,
    audioRef: mockAudioRef,
  })),
}));

// Mock fileUtils
jest.mock('@/utils/fileUtils', () => ({
  getLocalFileUrl: jest.fn((fileName: string, type: string) => `/music/${fileName}.mp3`),
}));

// Helper: create a fake SongWithChapter object for testing
function createMockSong(overrides: Partial<SongWithChapter> = {}): SongWithChapter {
  return {
    id: 1,
    title: 'Test Song',
    fileName: '1-1',
    artist: 'Test Artist',
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

describe('useMusicPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // Initial state
  // ─────────────────────────────────────────────
  describe('initial state', () => {
    it('should have no current song', () => {
      const { result } = renderHook(() => useMusicPlayer());
      expect(result.current.currentSong).toBeNull();
    });

    it('should not be playing', () => {
      const { result } = renderHook(() => useMusicPlayer());
      expect(result.current.isPlaying).toBe(false);
    });

    it('should have empty playlist', () => {
      const { result } = renderHook(() => useMusicPlayer());
      expect(result.current.playlist).toEqual([]);
    });

    it('should have empty playlistSongs', () => {
      const { result } = renderHook(() => useMusicPlayer());
      expect(result.current.playlistSongs).toEqual([]);
    });

    it('should have shuffle disabled', () => {
      const { result } = renderHook(() => useMusicPlayer());
      expect(result.current.isShuffle).toBe(false);
    });

    it('should have playMode set to "none"', () => {
      const { result } = renderHook(() => useMusicPlayer());
      expect(result.current.playMode).toBe('none');
    });

    it('should have volume at 1', () => {
      const { result } = renderHook(() => useMusicPlayer());
      expect(result.current.volume).toBe(1);
    });

    it('should have currentAudioUrl as undefined', () => {
      const { result } = renderHook(() => useMusicPlayer());
      expect(result.current.currentAudioUrl).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────
  // Setting current song
  // ─────────────────────────────────────────────
  describe('setCurrentSong', () => {
    it('should set the current song', () => {
      const { result } = renderHook(() => useMusicPlayer());
      const song = createMockSong();

      act(() => {
        result.current.setCurrentSong(song);
      });

      expect(result.current.currentSong).toEqual(song);
    });

    it('should clear the current song when set to null', () => {
      const { result } = renderHook(() => useMusicPlayer());
      const song = createMockSong();

      act(() => {
        result.current.setCurrentSong(song);
      });
      expect(result.current.currentSong).toEqual(song);

      act(() => {
        result.current.setCurrentSong(null);
      });
      expect(result.current.currentSong).toBeNull();
    });

    it('should replace the current song when a new one is set', () => {
      const { result } = renderHook(() => useMusicPlayer());
      const song1 = createMockSong({ id: 1, title: 'Song 1' });
      const song2 = createMockSong({ id: 2, title: 'Song 2' });

      act(() => {
        result.current.setCurrentSong(song1);
      });
      expect(result.current.currentSong?.title).toBe('Song 1');

      act(() => {
        result.current.setCurrentSong(song2);
      });
      expect(result.current.currentSong?.title).toBe('Song 2');
    });
  });

  // ─────────────────────────────────────────────
  // Playlist management
  // ─────────────────────────────────────────────
  describe('playlist management', () => {
    describe('setPlaylist', () => {
      it('should set the playlist array', () => {
        const { result } = renderHook(() => useMusicPlayer());
        const songs = [createMockSong({ id: 1 }), createMockSong({ id: 2 })];

        act(() => {
          result.current.setPlaylist(songs);
        });

        expect(result.current.playlist).toHaveLength(2);
        expect(result.current.playlist[0].id).toBe(1);
        expect(result.current.playlist[1].id).toBe(2);
      });
    });

    describe('initializePlaylist', () => {
      it('should initialize playlistSongs', () => {
        const { result } = renderHook(() => useMusicPlayer());
        const songs = [createMockSong({ id: 10 }), createMockSong({ id: 20 })];

        act(() => {
          result.current.initializePlaylist(songs);
        });

        expect(result.current.playlistSongs).toHaveLength(2);
        expect(result.current.playlistSongs[0].id).toBe(10);
        expect(result.current.playlistSongs[1].id).toBe(20);
      });

      it('should replace existing playlistSongs', () => {
        const { result } = renderHook(() => useMusicPlayer());
        const initialSongs = [createMockSong({ id: 1 })];
        const newSongs = [createMockSong({ id: 5 }), createMockSong({ id: 6 })];

        act(() => {
          result.current.initializePlaylist(initialSongs);
        });
        expect(result.current.playlistSongs).toHaveLength(1);

        act(() => {
          result.current.initializePlaylist(newSongs);
        });
        expect(result.current.playlistSongs).toHaveLength(2);
        expect(result.current.playlistSongs[0].id).toBe(5);
      });
    });

    describe('addToPlaylist', () => {
      it('should add a song to playlistSongs', () => {
        const { result } = renderHook(() => useMusicPlayer());
        const song = createMockSong({ id: 42 });

        act(() => {
          result.current.addToPlaylist(song);
        });

        expect(result.current.playlistSongs).toHaveLength(1);
        expect(result.current.playlistSongs[0].id).toBe(42);
      });

      it('should not add a duplicate song', () => {
        const { result } = renderHook(() => useMusicPlayer());
        const song = createMockSong({ id: 42 });

        act(() => {
          result.current.addToPlaylist(song);
        });
        act(() => {
          result.current.addToPlaylist(song);
        });

        expect(result.current.playlistSongs).toHaveLength(1);
      });

      it('should add multiple different songs', () => {
        const { result } = renderHook(() => useMusicPlayer());
        const song1 = createMockSong({ id: 1 });
        const song2 = createMockSong({ id: 2 });
        const song3 = createMockSong({ id: 3 });

        act(() => {
          result.current.addToPlaylist(song1);
        });
        act(() => {
          result.current.addToPlaylist(song2);
        });
        act(() => {
          result.current.addToPlaylist(song3);
        });

        expect(result.current.playlistSongs).toHaveLength(3);
      });
    });

    describe('removeFromPlaylist', () => {
      it('should remove a song by ID', () => {
        const { result } = renderHook(() => useMusicPlayer());
        const songs = [
          createMockSong({ id: 1 }),
          createMockSong({ id: 2 }),
          createMockSong({ id: 3 }),
        ];

        act(() => {
          result.current.initializePlaylist(songs);
        });

        act(() => {
          result.current.removeFromPlaylist([2]);
        });

        expect(result.current.playlistSongs).toHaveLength(2);
        expect(result.current.playlistSongs.map(s => s.id)).toEqual([1, 3]);
      });

      it('should remove multiple songs at once', () => {
        const { result } = renderHook(() => useMusicPlayer());
        const songs = [
          createMockSong({ id: 1 }),
          createMockSong({ id: 2 }),
          createMockSong({ id: 3 }),
          createMockSong({ id: 4 }),
        ];

        act(() => {
          result.current.initializePlaylist(songs);
        });

        act(() => {
          result.current.removeFromPlaylist([1, 3]);
        });

        expect(result.current.playlistSongs).toHaveLength(2);
        expect(result.current.playlistSongs.map(s => s.id)).toEqual([2, 4]);
      });

      it('should handle removing non-existent IDs gracefully', () => {
        const { result } = renderHook(() => useMusicPlayer());
        const songs = [createMockSong({ id: 1 })];

        act(() => {
          result.current.initializePlaylist(songs);
        });

        act(() => {
          result.current.removeFromPlaylist([999]);
        });

        expect(result.current.playlistSongs).toHaveLength(1);
      });
    });
  });

  // ─────────────────────────────────────────────
  // Play mode cycling
  // ─────────────────────────────────────────────
  describe('togglePlayMode', () => {
    it('should cycle from "none" to "one"', () => {
      const { result } = renderHook(() => useMusicPlayer());
      expect(result.current.playMode).toBe('none');

      act(() => {
        result.current.togglePlayMode();
      });

      expect(result.current.playMode).toBe('one');
    });

    it('should cycle from "one" to "all"', () => {
      const { result } = renderHook(() => useMusicPlayer());

      act(() => {
        result.current.togglePlayMode(); // none -> one
      });
      act(() => {
        result.current.togglePlayMode(); // one -> all
      });

      expect(result.current.playMode).toBe('all');
    });

    it('should cycle from "all" back to "none"', () => {
      const { result } = renderHook(() => useMusicPlayer());

      act(() => {
        result.current.togglePlayMode(); // none -> one
      });
      act(() => {
        result.current.togglePlayMode(); // one -> all
      });
      act(() => {
        result.current.togglePlayMode(); // all -> none
      });

      expect(result.current.playMode).toBe('none');
    });

    it('should complete a full cycle: none -> one -> all -> none', () => {
      const { result } = renderHook(() => useMusicPlayer());

      const expectedCycle = ['one', 'all', 'none'];

      for (const expected of expectedCycle) {
        act(() => {
          result.current.togglePlayMode();
        });
        expect(result.current.playMode).toBe(expected);
      }
    });
  });

  // ─────────────────────────────────────────────
  // Shuffle toggle
  // ─────────────────────────────────────────────
  describe('toggleShuffle', () => {
    it('should toggle shuffle from false to true', () => {
      const { result } = renderHook(() => useMusicPlayer());
      expect(result.current.isShuffle).toBe(false);

      act(() => {
        result.current.toggleShuffle();
      });

      expect(result.current.isShuffle).toBe(true);
    });

    it('should toggle shuffle from true back to false', () => {
      const { result } = renderHook(() => useMusicPlayer());

      act(() => {
        result.current.toggleShuffle(); // false -> true
      });
      act(() => {
        result.current.toggleShuffle(); // true -> false
      });

      expect(result.current.isShuffle).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // togglePlay
  // ─────────────────────────────────────────────
  describe('togglePlay', () => {
    it('should call audioTogglePlay when toggling play', () => {
      const { result } = renderHook(() => useMusicPlayer());

      act(() => {
        result.current.togglePlay();
      });

      expect(mockTogglePlay).toHaveBeenCalledTimes(1);
    });

    it('should toggle isPlaying state', () => {
      const { result } = renderHook(() => useMusicPlayer());
      expect(result.current.isPlaying).toBe(false);

      act(() => {
        result.current.togglePlay();
      });
      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.togglePlay();
      });
      expect(result.current.isPlaying).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // setVolume
  // ─────────────────────────────────────────────
  describe('setVolume', () => {
    it('should update the volume state', () => {
      const { result } = renderHook(() => useMusicPlayer());

      act(() => {
        result.current.setVolume(0.5);
      });

      expect(result.current.volume).toBe(0.5);
    });

    it('should call audioSetVolume with the new volume', () => {
      const { result } = renderHook(() => useMusicPlayer());

      act(() => {
        result.current.setVolume(0.75);
      });

      expect(mockSetVolume).toHaveBeenCalledWith(0.75);
    });
  });

  // ─────────────────────────────────────────────
  // getNextSong / getPreviousSong
  // ─────────────────────────────────────────────
  describe('getNextSong', () => {
    it('should return null when no current song', () => {
      const { result } = renderHook(() => useMusicPlayer());
      const next = result.current.getNextSong();
      expect(next).toBeNull();
    });

    it('should return null when playlist is empty', () => {
      const { result } = renderHook(() => useMusicPlayer());
      const song = createMockSong({ id: 1 });

      act(() => {
        result.current.setCurrentSong(song);
      });

      const next = result.current.getNextSong();
      expect(next).toBeNull();
    });

    it('should return the next song in the playlist', () => {
      const { result } = renderHook(() => useMusicPlayer());
      const songs = [
        createMockSong({ id: 1, title: 'Song 1' }),
        createMockSong({ id: 2, title: 'Song 2' }),
        createMockSong({ id: 3, title: 'Song 3' }),
      ];

      act(() => {
        result.current.initializePlaylist(songs);
        result.current.setCurrentSong(songs[0]);
      });

      const next = result.current.getNextSong();
      expect(next?.id).toBe(2);
    });

    it('should wrap around to the first song when at the end', () => {
      const { result } = renderHook(() => useMusicPlayer());
      const songs = [
        createMockSong({ id: 1 }),
        createMockSong({ id: 2 }),
      ];

      act(() => {
        result.current.initializePlaylist(songs);
        result.current.setCurrentSong(songs[1]);
      });

      const next = result.current.getNextSong();
      expect(next?.id).toBe(1);
    });

    it('should return current song when playMode is "one"', () => {
      const { result } = renderHook(() => useMusicPlayer());
      const songs = [
        createMockSong({ id: 1 }),
        createMockSong({ id: 2 }),
      ];

      act(() => {
        result.current.initializePlaylist(songs);
        result.current.setCurrentSong(songs[0]);
        result.current.togglePlayMode(); // none -> one
      });

      const next = result.current.getNextSong();
      expect(next?.id).toBe(1); // returns the same song
    });
  });

  describe('getPreviousSong', () => {
    it('should return null when no current song', () => {
      const { result } = renderHook(() => useMusicPlayer());
      const prev = result.current.getPreviousSong();
      expect(prev).toBeNull();
    });

    it('should return the previous song in the playlist', () => {
      const { result } = renderHook(() => useMusicPlayer());
      const songs = [
        createMockSong({ id: 1, title: 'Song 1' }),
        createMockSong({ id: 2, title: 'Song 2' }),
        createMockSong({ id: 3, title: 'Song 3' }),
      ];

      act(() => {
        result.current.initializePlaylist(songs);
        result.current.setCurrentSong(songs[2]);
      });

      const prev = result.current.getPreviousSong();
      expect(prev?.id).toBe(2);
    });

    it('should wrap around to the last song when at the beginning', () => {
      const { result } = renderHook(() => useMusicPlayer());
      const songs = [
        createMockSong({ id: 1 }),
        createMockSong({ id: 2 }),
        createMockSong({ id: 3 }),
      ];

      act(() => {
        result.current.initializePlaylist(songs);
        result.current.setCurrentSong(songs[0]);
      });

      const prev = result.current.getPreviousSong();
      expect(prev?.id).toBe(3);
    });

    it('should return current song when playMode is "one"', () => {
      const { result } = renderHook(() => useMusicPlayer());
      const songs = [
        createMockSong({ id: 1 }),
        createMockSong({ id: 2 }),
      ];

      act(() => {
        result.current.initializePlaylist(songs);
        result.current.setCurrentSong(songs[1]);
        result.current.togglePlayMode(); // none -> one
      });

      const prev = result.current.getPreviousSong();
      expect(prev?.id).toBe(2); // returns the same song
    });
  });
});
