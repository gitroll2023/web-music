'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { SongWithChapter } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CategoryKey =
  | 'all'
  | 'chapter'
  | 'keyVerse'
  | 'title'
  | 'new';

interface SongState {
  /** All songs fetched from the API */
  songs: SongWithChapter[];
  /** Currently filtered set (mirrors whatever category is active) */
  filteredSongs: SongWithChapter[];
  /** Songs flagged as isRevelationChapter */
  chapterSongs: SongWithChapter[];
  /** Songs flagged as isRevelationKeyVerse */
  keyVerseSongs: SongWithChapter[];
  /** Songs flagged as isRevelationTitle */
  titleSongs: SongWithChapter[];
  /** Songs flagged as isNew */
  newSongs: SongWithChapter[];
  /** Whether the initial fetch is in progress */
  isLoading: boolean;
  /** Human-readable loading / status message */
  loadingMessage: string;
  /** Currently active category filter */
  activeCategory: CategoryKey;
}

interface SongContextValue extends SongState {
  fetchSongs: () => Promise<void>;
  handleCategoryChange: (category: CategoryKey) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function categorizeSongs(songs: SongWithChapter[]) {
  const chapterSongs: SongWithChapter[] = [];
  const keyVerseSongs: SongWithChapter[] = [];
  const titleSongs: SongWithChapter[] = [];
  const newSongs: SongWithChapter[] = [];

  for (const song of songs) {
    if (song.isRevelationChapter) chapterSongs.push(song);
    if (song.isRevelationKeyVerse) keyVerseSongs.push(song);
    if (song.isRevelationTitle) titleSongs.push(song);
    if ((song as SongWithChapter & { isNew?: boolean }).isNew) newSongs.push(song);
  }

  return { chapterSongs, keyVerseSongs, titleSongs, newSongs };
}

function getSongsForCategory(
  category: CategoryKey,
  all: SongWithChapter[],
  chapter: SongWithChapter[],
  keyVerse: SongWithChapter[],
  title: SongWithChapter[],
  newS: SongWithChapter[],
): SongWithChapter[] {
  switch (category) {
    case 'chapter':
      return chapter;
    case 'keyVerse':
      return keyVerse;
    case 'title':
      return title;
    case 'new':
      return newS;
    case 'all':
    default:
      return all;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SongContext = createContext<SongContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface SongProviderProps {
  children: ReactNode;
}

export function SongProvider({ children }: SongProviderProps) {
  const [state, setState] = useState<SongState>({
    songs: [],
    filteredSongs: [],
    chapterSongs: [],
    keyVerseSongs: [],
    titleSongs: [],
    newSongs: [],
    isLoading: true,
    loadingMessage: '곡 목록을 불러오는 중...',
    activeCategory: 'all',
  });

  // ------ Fetch ----------------------------------------------------------

  const fetchSongs = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      loadingMessage: '곡 목록을 불러오는 중...',
    }));

    try {
      const response = await fetch('/api/songs');
      if (!response.ok) {
        throw new Error(`Failed to fetch songs: ${response.status}`);
      }

      const data = await response.json();
      const fetchedSongs: SongWithChapter[] = data.songs ?? [];

      const { chapterSongs, keyVerseSongs, titleSongs, newSongs } =
        categorizeSongs(fetchedSongs);

      setState((prev) => {
        const filtered = getSongsForCategory(
          prev.activeCategory,
          fetchedSongs,
          chapterSongs,
          keyVerseSongs,
          titleSongs,
          newSongs,
        );

        return {
          ...prev,
          songs: fetchedSongs,
          filteredSongs: filtered,
          chapterSongs,
          keyVerseSongs,
          titleSongs,
          newSongs,
          isLoading: false,
          loadingMessage: '',
        };
      });
    } catch (error) {
      console.error('Error fetching songs:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        loadingMessage: '곡 목록을 불러오는데 실패했습니다.',
      }));
    }
  }, []);

  // ------ Category filter ------------------------------------------------

  const handleCategoryChange = useCallback(
    (category: CategoryKey) => {
      setState((prev) => {
        const filtered = getSongsForCategory(
          category,
          prev.songs,
          prev.chapterSongs,
          prev.keyVerseSongs,
          prev.titleSongs,
          prev.newSongs,
        );
        return {
          ...prev,
          activeCategory: category,
          filteredSongs: filtered,
        };
      });
    },
    [],
  );

  // ------ Initial load ---------------------------------------------------

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  // ------ Context value --------------------------------------------------

  const value: SongContextValue = {
    ...state,
    fetchSongs,
    handleCategoryChange,
  };

  return <SongContext.Provider value={value}>{children}</SongContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSongContext(): SongContextValue {
  const context = useContext(SongContext);
  if (context === undefined) {
    throw new Error('useSongContext must be used within a SongProvider');
  }
  return context;
}
