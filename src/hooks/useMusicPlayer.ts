import { useState, useCallback, useEffect } from 'react';
import type { SongWithChapter } from '@/types';
import { useAudioPlayer } from './useAudioPlayer';
import { getLocalFileUrl } from '@/utils/fileUtils';

interface MusicPlayerState {
  currentSong: SongWithChapter | null;
  playlist: SongWithChapter[];
  playlistSongs: SongWithChapter[];
  isPlaying: boolean;
  isShuffle: boolean;
  playMode: 'all' | 'one' | 'none';
  volume: number;
  currentAudioUrl: string | undefined;
}

export const useMusicPlayer = () => {
  const [state, setState] = useState<MusicPlayerState>({
    currentSong: null,
    playlist: [],
    playlistSongs: [], 
    isPlaying: false,
    isShuffle: false,
    playMode: 'none',
    volume: 1,
    currentAudioUrl: undefined,
  });

  const { currentSong, playlist, playlistSongs, isPlaying, isShuffle, playMode, volume, currentAudioUrl } = state;

  useEffect(() => {
    if (currentSong?.fileName) {
      const audioUrl = getLocalFileUrl(currentSong.fileName, 'audio');
      console.log('Setting audio URL:', audioUrl);
      setState(prev => ({ ...prev, currentAudioUrl: audioUrl }));
    } else {
      setState(prev => ({ ...prev, currentAudioUrl: undefined }));
    }
  }, [currentSong?.fileName]);

  const {
    currentTime,
    duration,
    isReady,
    isLoading,
    error,
    togglePlay: audioTogglePlay,
    seek,
    setVolume: audioSetVolume,
    audioRef,
  } = useAudioPlayer(currentAudioUrl, playMode);

  const setPlaylist = useCallback((songs: SongWithChapter[]) => {
    setState(prev => ({ ...prev, playlist: songs }));
  }, []);

  const initializePlaylist = useCallback((songs: SongWithChapter[]) => {
    setState(prev => ({ ...prev, playlistSongs: songs }));
  }, []);

  const addToPlaylist = useCallback((song: SongWithChapter) => {
    setState(prev => {
      const exists = prev.playlistSongs.some(s => s.id === song.id);
      if (exists) return prev;
      
      return { ...prev, playlistSongs: [...prev.playlistSongs, song] };
    });
  }, []);

  const removeFromPlaylist = useCallback((songIds: (string | number)[]) => {
    setState(prev => {
      const updatedPlaylist = prev.playlistSongs.filter(song => !songIds.includes(song.id));
      return { ...prev, playlistSongs: updatedPlaylist };
    });
  }, []);

  const setCurrentSong = useCallback((song: SongWithChapter | null) => {
    setState(prev => ({ ...prev, currentSong: song }));
  }, []);

  const togglePlay = useCallback(() => {
    console.log('Toggling play state, current state:', isPlaying);
    
    audioTogglePlay();
    
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [audioTogglePlay, isPlaying]);

  const toggleShuffle = useCallback(() => {
    setState(prev => ({ ...prev, isShuffle: !prev.isShuffle }));
  }, []);

  const togglePlayMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      playMode: prev.playMode === 'none' ? 'one' : 
                prev.playMode === 'one' ? 'all' : 'none',
    }));
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setState(prev => ({ ...prev, volume: newVolume }));
    audioSetVolume(newVolume);
  }, [audioSetVolume]);

  const getNextSong = useCallback(() => {
    if (!currentSong || playlistSongs.length === 0) return null;

    const currentIndex = playlistSongs.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1) return null;

    if (playMode === 'one') return currentSong;

    if (isShuffle) {
      const remainingSongs = playlistSongs.filter(song => song.id !== currentSong.id);
      if (remainingSongs.length === 0) return playlistSongs[0];
      const randomIndex = Math.floor(Math.random() * remainingSongs.length);
      return remainingSongs[randomIndex];
    }

    const nextIndex = (currentIndex + 1) % playlistSongs.length;
    return playlistSongs[nextIndex];
  }, [currentSong, playlistSongs, isShuffle, playMode]);

  const getPreviousSong = useCallback(() => {
    if (!currentSong || playlistSongs.length === 0) return null;

    const currentIndex = playlistSongs.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1) return null;

    if (playMode === 'one') return currentSong;

    if (isShuffle) {
      const remainingSongs = playlistSongs.filter(song => song.id !== currentSong.id);
      if (remainingSongs.length === 0) return playlistSongs[0];
      const randomIndex = Math.floor(Math.random() * remainingSongs.length);
      return remainingSongs[randomIndex];
    }

    const previousIndex = (currentIndex - 1 + playlistSongs.length) % playlistSongs.length;
    return playlistSongs[previousIndex];
  }, [currentSong, playlistSongs, isShuffle, playMode]);

  return {
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
    setPlaylist,
    initializePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    setCurrentSong,
    togglePlay,
    toggleShuffle,
    togglePlayMode,
    setVolume,
    getNextSong,
    getPreviousSong,
    seek,
  };
};
