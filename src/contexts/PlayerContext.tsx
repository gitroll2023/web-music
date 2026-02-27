'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { SongWithChapter } from '@/types';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { getLocalFileUrl } from '@/utils/fileUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlayMode = 'all' | 'one' | 'none';

interface PlayerState {
  currentSong: SongWithChapter | null;
  playlist: SongWithChapter[];
  playlistSongs: SongWithChapter[];
  isPlaying: boolean;
  isShuffle: boolean;
  playMode: PlayMode;
  volume: number;
  currentAudioUrl: string | undefined;
}

interface PlayerContextValue {
  // State
  currentSong: SongWithChapter | null;
  playlist: SongWithChapter[];
  playlistSongs: SongWithChapter[];
  isPlaying: boolean;
  isShuffle: boolean;
  playMode: PlayMode;
  volume: number;
  currentAudioUrl: string | undefined;
  currentTime: number;
  duration: number;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions – playback
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setCurrentSong: (song: SongWithChapter | null) => void;
  getNextSong: () => SongWithChapter | null;
  getPreviousSong: () => SongWithChapter | null;
  toggleShuffle: () => void;
  togglePlayMode: () => void;

  // Actions – playlist management
  setPlaylist: (songs: SongWithChapter[]) => void;
  initializePlaylist: (songs: SongWithChapter[]) => void;
  addToPlaylist: (song: SongWithChapter) => void;
  removeFromPlaylist: (songIds: (string | number)[]) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface PlayerProviderProps {
  children: ReactNode;
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  const [state, setState] = useState<PlayerState>({
    currentSong: null,
    playlist: [],
    playlistSongs: [],
    isPlaying: false,
    isShuffle: false,
    playMode: 'none',
    volume: 1,
    currentAudioUrl: undefined,
  });

  const {
    currentSong,
    playlist,
    playlistSongs,
    isPlaying,
    isShuffle,
    playMode,
    volume,
    currentAudioUrl,
  } = state;

  // Derive audio URL from current song's fileName
  useEffect(() => {
    if (currentSong?.fileName) {
      const audioUrl = getLocalFileUrl(currentSong.fileName, 'audio');
      setState((prev) => ({ ...prev, currentAudioUrl: audioUrl }));
    } else {
      setState((prev) => ({ ...prev, currentAudioUrl: undefined }));
    }
  }, [currentSong?.fileName]);

  // Delegate low-level audio to useAudioPlayer
  const {
    currentTime,
    duration,
    isReady,
    isLoading,
    error,
    togglePlay: audioTogglePlay,
    seek,
    setVolume: audioSetVolume,
  } = useAudioPlayer(currentAudioUrl, playMode);

  // ------ Playlist management ------

  const setPlaylist = useCallback((songs: SongWithChapter[]) => {
    setState((prev) => ({ ...prev, playlist: songs }));
  }, []);

  const initializePlaylist = useCallback((songs: SongWithChapter[]) => {
    setState((prev) => ({ ...prev, playlistSongs: songs }));
  }, []);

  const addToPlaylist = useCallback((song: SongWithChapter) => {
    setState((prev) => {
      const exists = prev.playlistSongs.some((s) => s.id === song.id);
      if (exists) return prev;
      return { ...prev, playlistSongs: [...prev.playlistSongs, song] };
    });
  }, []);

  const removeFromPlaylist = useCallback((songIds: (string | number)[]) => {
    setState((prev) => {
      const updatedPlaylist = prev.playlistSongs.filter(
        (song) => !songIds.includes(song.id),
      );
      return { ...prev, playlistSongs: updatedPlaylist };
    });
  }, []);

  // ------ Playback controls ------

  const setCurrentSong = useCallback((song: SongWithChapter | null) => {
    setState((prev) => ({ ...prev, currentSong: song }));
  }, []);

  const togglePlay = useCallback(() => {
    audioTogglePlay();
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [audioTogglePlay]);

  const toggleShuffle = useCallback(() => {
    setState((prev) => ({ ...prev, isShuffle: !prev.isShuffle }));
  }, []);

  const togglePlayMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      playMode:
        prev.playMode === 'none'
          ? 'one'
          : prev.playMode === 'one'
            ? 'all'
            : 'none',
    }));
  }, []);

  const setVolume = useCallback(
    (newVolume: number) => {
      setState((prev) => ({ ...prev, volume: newVolume }));
      audioSetVolume(newVolume);
    },
    [audioSetVolume],
  );

  // ------ Navigation helpers ------

  const getNextSong = useCallback((): SongWithChapter | null => {
    if (!currentSong || playlistSongs.length === 0) return null;

    const currentIndex = playlistSongs.findIndex(
      (song) => song.id === currentSong.id,
    );
    if (currentIndex === -1) return null;

    if (playMode === 'one') return currentSong;

    if (isShuffle) {
      const remainingSongs = playlistSongs.filter(
        (song) => song.id !== currentSong.id,
      );
      if (remainingSongs.length === 0) return playlistSongs[0];
      const randomIndex = Math.floor(Math.random() * remainingSongs.length);
      return remainingSongs[randomIndex];
    }

    const nextIndex = (currentIndex + 1) % playlistSongs.length;
    return playlistSongs[nextIndex];
  }, [currentSong, playlistSongs, isShuffle, playMode]);

  const getPreviousSong = useCallback((): SongWithChapter | null => {
    if (!currentSong || playlistSongs.length === 0) return null;

    const currentIndex = playlistSongs.findIndex(
      (song) => song.id === currentSong.id,
    );
    if (currentIndex === -1) return null;

    if (playMode === 'one') return currentSong;

    if (isShuffle) {
      const remainingSongs = playlistSongs.filter(
        (song) => song.id !== currentSong.id,
      );
      if (remainingSongs.length === 0) return playlistSongs[0];
      const randomIndex = Math.floor(Math.random() * remainingSongs.length);
      return remainingSongs[randomIndex];
    }

    const previousIndex =
      (currentIndex - 1 + playlistSongs.length) % playlistSongs.length;
    return playlistSongs[previousIndex];
  }, [currentSong, playlistSongs, isShuffle, playMode]);

  // ------ Context value ------

  const value: PlayerContextValue = {
    currentSong,
    playlist,
    playlistSongs,
    isPlaying,
    isShuffle,
    playMode,
    volume,
    currentAudioUrl,
    currentTime,
    duration,
    isReady,
    isLoading,
    error,
    togglePlay,
    seek,
    setVolume,
    setCurrentSong,
    getNextSong,
    getPreviousSong,
    toggleShuffle,
    togglePlayMode,
    setPlaylist,
    initializePlaylist,
    addToPlaylist,
    removeFromPlaylist,
  };

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePlayerContext(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
}
