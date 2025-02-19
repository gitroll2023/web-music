import { useState, useCallback } from 'react';
import type { SongWithChapter } from '@/types';
import { useAudioPlayer } from './useAudioPlayer';

interface MusicPlayerState {
  currentSong: SongWithChapter | null;
  playlist: SongWithChapter[];
  isPlaying: boolean;
  isShuffle: boolean;
  playMode: 'all' | 'one';
  volume: number;
}

export const useMusicPlayer = () => {
  const [state, setState] = useState<MusicPlayerState>({
    currentSong: null,
    playlist: [],
    isPlaying: false,
    isShuffle: false,
    playMode: 'all',
    volume: 1,
  });

  const { currentSong, playlist, isPlaying, isShuffle, playMode, volume } = state;

  // 재생 목록 설정
  const setPlaylist = useCallback((songs: SongWithChapter[]) => {
    setState(prev => ({ ...prev, playlist: songs }));
  }, []);

  // 현재 곡 설정
  const setCurrentSong = useCallback((song: SongWithChapter | null) => {
    setState(prev => ({ ...prev, currentSong: song }));
  }, []);

  // 재생/일시정지 토글
  const togglePlay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  // 셔플 모드 토글
  const toggleShuffle = useCallback(() => {
    setState(prev => ({ ...prev, isShuffle: !prev.isShuffle }));
  }, []);

  // 재생 모드 변경
  const togglePlayMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      playMode: prev.playMode === 'all' ? 'one' : 'all',
    }));
  }, []);

  // 볼륨 조절
  const setVolume = useCallback((newVolume: number) => {
    setState(prev => ({ ...prev, volume: newVolume }));
  }, []);

  // 다음 곡 선택
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

  // 이전 곡 선택
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
