import { useState, useCallback, useEffect } from 'react';
import type { SongWithChapter } from '@/types';
import { useAudioPlayer } from './useAudioPlayer';

interface MusicPlayerState {
  currentSong: SongWithChapter | null;
  playlist: SongWithChapter[];
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
    isPlaying: false,
    isShuffle: false,
    playMode: 'none',
    volume: 1,
    currentAudioUrl: undefined,
  });

  const { currentSong, playlist, isPlaying, isShuffle, playMode, volume, currentAudioUrl } = state;

  useEffect(() => {
    const fetchAudioUrl = async () => {
      if (currentSong?.id) {
        try {
          const response = await fetch(`/api/songs/${currentSong.id}/drive-url`);
          if (response.ok) {
            const data = await response.json();
            setState(prev => ({ ...prev, currentAudioUrl: data.url }));
          }
        } catch (error) {
          console.error('Failed to fetch audio URL:', error);
          setState(prev => ({ ...prev, currentAudioUrl: undefined }));
        }
      } else {
        setState(prev => ({ ...prev, currentAudioUrl: undefined }));
      }
    };

    fetchAudioUrl();
  }, [currentSong?.id]);

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

  const setPlaylist = useCallback((songs: SongWithChapter[]) => {
    setState(prev => ({ ...prev, playlist: songs }));
  }, []);

  const setCurrentSong = useCallback((song: SongWithChapter | null) => {
    setState(prev => ({ ...prev, currentSong: song }));
  }, []);

  const togglePlay = useCallback(() => {
    audioTogglePlay();
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [audioTogglePlay]);

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
    if (!currentSong || playlist.length === 0) return null;

    const currentIndex = playlist.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1) return null;

    if (playMode === 'one') return currentSong;

    if (isShuffle) {
      const remainingSongs = playlist.filter(song => song.id !== currentSong.id);
      if (remainingSongs.length === 0) return playlist[0];
      const randomIndex = Math.floor(Math.random() * remainingSongs.length);
      return remainingSongs[randomIndex];
    }

    const nextIndex = (currentIndex + 1) % playlist.length;
    return playlist[nextIndex];
  }, [currentSong, playlist, isShuffle, playMode]);

  const getPreviousSong = useCallback(() => {
    if (!currentSong || playlist.length === 0) return null;

    const currentIndex = playlist.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1) return null;

    if (playMode === 'one') return currentSong;

    if (isShuffle) {
      const remainingSongs = playlist.filter(song => song.id !== currentSong.id);
      if (remainingSongs.length === 0) return playlist[0];
      const randomIndex = Math.floor(Math.random() * remainingSongs.length);
      return remainingSongs[randomIndex];
    }

    const previousIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    return playlist[previousIndex];
  }, [currentSong, playlist, isShuffle, playMode]);

  return {
    currentSong,
    playlist,
    isPlaying,
    isShuffle,
    playMode,
    volume,
    setPlaylist,
    setCurrentSong,
    togglePlay,
    toggleShuffle,
    togglePlayMode,
    setVolume,
    getNextSong,
    getPreviousSong,
  };
};
