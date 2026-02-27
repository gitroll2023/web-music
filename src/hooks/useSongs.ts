'use client';

import { useSongContext } from '@/contexts/SongContext';
import type { SongWithChapter } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseSongsReturn {
  /** All songs from the API */
  songs: SongWithChapter[];
  /** Songs matching the currently active category filter */
  filteredSongs: SongWithChapter[];
  /** Songs flagged as isRevelationChapter */
  chapterSongs: SongWithChapter[];
  /** Songs flagged as isRevelationKeyVerse */
  keyVerseSongs: SongWithChapter[];
  /** Songs flagged as isRevelationTitle */
  titleSongs: SongWithChapter[];
  /** Songs flagged as isNew */
  newSongs: SongWithChapter[];
  /** Whether the song list is still loading */
  isLoading: boolean;
  /** Human-readable status message during loading or on error */
  loadingMessage: string;
  /** Re-fetch all songs from the API */
  fetchSongs: () => Promise<void>;
  /** Change the active category filter */
  handleCategoryChange: (category: 'all' | 'chapter' | 'keyVerse' | 'title' | 'new') => void;
  /** Get songs belonging to a specific chapter (by chapter id) */
  getSongsByChapter: (chapterId: number) => SongWithChapter[];
  /** Search songs by title (case-insensitive substring match) */
  searchSongsByTitle: (query: string) => SongWithChapter[];
  /** Get a single song by its id, or undefined if not found */
  getSongById: (id: number) => SongWithChapter | undefined;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Convenience hook that wraps `useSongContext` and adds derived filter
 * helpers. Must be rendered inside a `<SongProvider>`.
 */
export function useSongs(): UseSongsReturn {
  const {
    songs,
    filteredSongs,
    chapterSongs,
    keyVerseSongs,
    titleSongs,
    newSongs,
    isLoading,
    loadingMessage,
    fetchSongs,
    handleCategoryChange,
  } = useSongContext();

  /** Return all songs whose chapter.id matches the given chapterId */
  const getSongsByChapter = (chapterId: number): SongWithChapter[] => {
    return songs.filter((song) => song.chapter?.id === chapterId);
  };

  /** Case-insensitive title search across all songs */
  const searchSongsByTitle = (query: string): SongWithChapter[] => {
    if (!query || query.trim().length === 0) return songs;
    const lowerQuery = query.toLowerCase();
    return songs.filter((song) =>
      song.title.toLowerCase().includes(lowerQuery),
    );
  };

  /** Lookup a single song by numeric id */
  const getSongById = (id: number): SongWithChapter | undefined => {
    return songs.find((song) => song.id === id);
  };

  return {
    songs,
    filteredSongs,
    chapterSongs,
    keyVerseSongs,
    titleSongs,
    newSongs,
    isLoading,
    loadingMessage,
    fetchSongs,
    handleCategoryChange,
    getSongsByChapter,
    searchSongsByTitle,
    getSongById,
  };
}
