'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import type { SongWithChapter, ChapterWithSongs } from '@/types';
import Player from '@/components/Player';
import SongSkeleton from '@/components/SongSkeleton';
import LoadingScreen from '@/components/LoadingScreen';
import toast, { Toaster } from 'react-hot-toast';
import PlaylistView from '@/components/PlaylistView';
import type { DropResult } from '@hello-pangea/dnd';

// 챕터 이름 포맷팅 함수
const formatChapterName = (name: string) => {
  if (!name) return '알 수 없는 챕터';
  const match = name.match(/Chapter (\d+)/i);
  if (match) {
    return `계시록 ${match[1]}장`;
  }
  return name;
};

interface LyricLine {
  time: number;
  text: string;
}

interface Song {
  id: number;
  title: string;
  fileName: string;
  artist: string | null;
  driveFileId: string | null;
  fileUrl: string | null;
  audioUrl?: string;
  duration: string | null;
  imageId: string | null;
  imageUrl: string | null;
  lyrics: string | null;
  chapterId: number;
  genreId: string;
  isNew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function parseLyrics(lyrics: string): LyricLine[] {
  if (!lyrics) return [];
  
  const lines = lyrics.split('\n');
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2})\]/;
  
  return lines
    .map(line => {
      const match = timeRegex.exec(line);
      if (!match) return null;
      
      const [, minutes, seconds, centiseconds] = match;
      const time = parseInt(minutes) * 60 + parseInt(seconds) + parseInt(centiseconds) / 100;
      const text = line.replace(timeRegex, '').trim();
      
      return { time, text };
    })
    .filter((line): line is LyricLine => line !== null);
}

interface MusicPlayerClientProps {
  songs: SongWithChapter[];
  isDarkMode?: boolean;
}

const MusicPlayerClient: React.FC<MusicPlayerClientProps> = ({
  songs,
  isDarkMode = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [localSongs, setLocalSongs] = useState<SongWithChapter[]>(songs);
  const [loadedSongs] = useState(() => new Set<string>());
  const [selectedSong, setSelectedSong] = useState<SongWithChapter | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastPosition, setLastPosition] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [playMode, setPlayMode] = useState<'all' | 'one' | 'none'>('none');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);

  // 다음 곡 재생
  const handleNextSong = useCallback(() => {
    if (!selectedSong || !localSongs.length) return;

    let newIndex = 0;
    if (isShuffle) {
      // 셔플 모드: 랜덤한 곡 선택
      newIndex = Math.floor(Math.random() * localSongs.length);
    } else {
      // 일반 모드: 다음 곡
      const currentSongIndex = localSongs.findIndex(song => song.id === selectedSong.id);
      if (currentSongIndex === -1) return;
      newIndex = currentSongIndex + 1;
      if (newIndex >= localSongs.length) {
        if (playMode === 'all') {
          newIndex = 0;
        } else {
          toast.error('다음 곡이 없습니다.');
          return;
        }
      }
    }
    
    const nextSong = localSongs[newIndex];
    setSelectedSong(nextSong);
  }, [selectedSong, localSongs, isShuffle, playMode]);

  // 이전 곡 재생
  const handlePrevSong = useCallback(() => {
    if (!selectedSong || !localSongs.length) return;

    let newIndex = 0;
    if (isShuffle) {
      // 셔플 모드: 랜덤한 곡 선택
      newIndex = Math.floor(Math.random() * localSongs.length);
    } else {
      // 일반 모드: 이전 곡
      const currentSongIndex = localSongs.findIndex(song => song.id === selectedSong.id);
      if (currentSongIndex === -1) return;
      newIndex = currentSongIndex - 1;
      if (newIndex < 0) {
        if (playMode === 'all') {
          newIndex = localSongs.length - 1;
        } else {
          toast.error('이전 곡이 없습니다.');
          return;
        }
      }
    }
    
    const prevSong = localSongs[newIndex];
    setSelectedSong(prevSong);
  }, [selectedSong, localSongs, isShuffle, playMode]);

  // timeupdate 이벤트 핸들러
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setCurrentTime(audio.currentTime);
    setLastPosition(audio.currentTime);  // 현재 시간을 계속 저장
    
    // 곡이 거의 끝나갈 때 상태 로깅
    if (audio.duration - audio.currentTime < 0.5) {
      console.log('[TimeUpdate] Near end', {
        currentTime: audio.currentTime,
        duration: audio.duration,
        readyState: audio.readyState,
        paused: audio.paused,
        ended: audio.ended
      });
    }
  }, []);

  // 재생/일시정지 액션
  const handlePlayPause = useCallback(async () => {
    console.log('=== handlePlayPause ===');
    console.log('Current state before action:', {
      isPlaying,
      currentTime,
      duration,
      audioUrl,
      isAudioReady
    });

    if (!isAudioReady) {
      console.log('Audio not ready, cannot play/pause');
      return;
    }

    console.log('Calling togglePlay...');
    const audio = audioRef.current;
    if (!audio || !selectedSong) return;

    console.log('Toggle Play/Pause:', {
      paused: audio.paused,
      currentTime: audio.currentTime,
      lastPosition,
      isPlaying,
      readyState: audio.readyState,
      src: audio.src
    });

    try {
      if (audio.paused) {
        // 재생
        if (!audio.src || audio.src.endsWith('/undefined')) {
          if (!selectedSong.driveFileId) {
            console.error('No drive file ID available');
            return;
          }
          const proxyUrl = `/api/proxy/${selectedSong.driveFileId}`;
          console.log('Setting new audio source:', proxyUrl);
          audio.src = proxyUrl;
          audio.load();
        }
        
        // 저장된 위치가 있으면 해당 위치부터 재생
        if (lastPosition > 0 && lastPosition < audio.duration) {
          console.log('Restoring position:', lastPosition);
          audio.currentTime = lastPosition;
        }
        
        await audio.play();
        console.log('Started playing from:', audio.currentTime);
        setIsPlaying(true);
      } else {
        // 일시정지 - 현재 위치 저장
        const currentPos = audio.currentTime;
        console.log('Pausing at position:', currentPos);
        setLastPosition(currentPos);
        await audio.pause();
        console.log('Paused. Last position saved:', currentPos);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Playback error:', error);
      handlePlayError(error);
    }
    console.log('======================');
  }, [selectedSong, lastPosition, isPlaying, currentTime, duration, audioUrl, isAudioReady]);

  const handlePlayError = (error: any) => {
    console.error('Playback error:', error);
    toast.error('재생할 수 없는 곡입니다. 다음 곡으로 넘어갑니다.');
    setIsPlaying(false);
    
    // 현재 곡의 인덱스 찾기
    const currentIndex = localSongs.findIndex(s => s.id === selectedSong?.id);
    if (currentIndex !== -1 && currentIndex < localSongs.length - 1) {
      // 다음 곡이 있으면 다음 곡으로
      setSelectedSong(localSongs[currentIndex + 1]);
    }
  };

  // 처음으로 돌아가기
  const handleSeekToStart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = 0;
    if (isPlaying) {
      audio.play().catch(handlePlayError);
    }
  }, [isPlaying]);

  // 재생 종료 핸들러
  const handleEnded = useCallback(() => {
    console.log('[Audio Event] Ended', { 
      playMode,
      currentTime: audioRef.current?.currentTime,
      readyState: audioRef.current?.readyState,
      paused: audioRef.current?.paused,
      ended: audioRef.current?.ended
    });
    
    const currentIndex = localSongs.findIndex(s => s.id === selectedSong?.id);
    const audio = audioRef.current;
    
    if (!audio || !selectedSong) return;

    // 현재 위치 저장
    setLastPosition(0);
    
    if (playMode === 'one') {
      // 한 곡 반복 모드
      if (!selectedSong.driveFileId) {
        console.error('No drive file ID available');
        return;
      }

      // 프록시 URL 다시 생성하고 처음부터 재생
      const proxyUrl = `/api/proxy/${selectedSong.driveFileId}`;
      audio.src = proxyUrl;
      audio.load();
      audio.play().catch(handlePlayError);
      setIsPlaying(true);
    } else if (playMode === 'all' || (currentIndex < localSongs.length - 1)) {
      // 전체 반복 모드이거나 다음 곡이 있는 경우
      const nextSong = currentIndex === localSongs.length - 1 ? localSongs[0] : localSongs[currentIndex + 1];
      
      if (!nextSong.driveFileId) {
        console.error('No drive file ID available for next song');
        return;
      }

      // 다음 곡 설정 및 재생
      setSelectedSong(nextSong);
      setIsPlaying(true);
    } else {
      // 마지막 곡이고 반복 모드가 아닌 경우
      setIsPlaying(false);
      setLastPosition(0);
    }
  }, [localSongs, selectedSong, playMode]);

  // 선택된 곡이 변경될 때 실행되는 효과
  useEffect(() => {
    const audio = audioRef.current;
    if (!selectedSong || !audio) return;

    const loadAndPlay = async () => {
      try {
        if (!selectedSong?.driveFileId) {
          console.error('No drive file ID available');
          return;
        }

        // 프록시 URL 생성
        const proxyUrl = `/api/proxy/${selectedSong.driveFileId}`;
        audio.src = proxyUrl;
        audio.load();
        
        if (isPlaying) {
          try {
            await audio.play();
            console.log('New song started playing successfully');
          } catch (error: unknown) {
            if (error instanceof Error && error.name === 'NotAllowedError') {
              toast.error('브라우저 정책으로 인해 자동 재생이 차단되었습니다. 재생 버튼을 클릭해주세요.');
              setIsPlaying(false);
            } else {
              handlePlayError(error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading new song:', error);
        handlePlayError(error);
      }
    };

    loadAndPlay();
  }, [selectedSong, isPlaying]);

  // 오디오 이벤트 리스너
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleError = (e: Event) => {
      console.error('[Audio Event] Error:', {
        error: e,
        currentTime: audio.currentTime,
        duration: audio.duration
      });
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      // cleanup에서는 같은 audio 참조를 사용
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [handleEnded]);

  // 오디오 이벤트 리스너 설정
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('[Event Listeners] Setting up event listeners');

    const handleLoadedMetadata = () => {
      console.log('[Audio Event] LoadedMetadata', {
        duration: audio.duration,
        src: audio.src,
        currentTime: audio.currentTime,
        readyState: audio.readyState
      });
      setDuration(audio.duration);
      setIsAudioReady(true);
    };

    const handleSeeking = () => {
      console.log('[Audio Event] Seeking', {
        currentTime: audio.currentTime,
        paused: audio.paused
      });
    };

    const handleSeeked = () => {
      console.log('[Audio Event] Seeked', {
        currentTime: audio.currentTime,
        paused: audio.paused
      });
    };

    const handleLoadStart = () => {
      console.log('[Audio Event] LoadStart', {
        src: audio.src,
        currentTime: audio.currentTime,
        readyState: audio.readyState
      });
    };

    const handleLoadedData = () => {
      console.log('Audio data loaded');
      setIsLoading(false);
      if (isPlaying) {
        audio.play()
          .then(() => {
            console.log('Playback started successfully');
          })
          .catch((error) => {
            if (error.name === 'NotAllowedError') {
              toast.error('브라우저 정책으로 인해 자동 재생이 차단되었습니다. 재생 버튼을 클릭해주세요.');
              setIsPlaying(false);
            } else {
              handlePlayError(error);
            }
          });
      }
    };

    const handleLoadError = (e: Event) => {
      console.error('Audio load error:', e);
      console.log('Audio state:', {
        error: audio.error,
        networkState: audio.networkState,
        readyState: audio.readyState,
        currentSrc: audio.currentSrc,
        src: audio.src
      });
      handlePlayError(e);
    };

    const handlePlayError = (error: any) => {
      console.error('Playback error:', error);
      setIsLoading(false);
      setIsPlaying(false);
      
      // 현재 곡의 인덱스 찾기
      const currentIndex = localSongs.findIndex(s => s.id === selectedSong?.id);
      if (currentIndex !== -1 && currentIndex < localSongs.length - 1) {
        // 다음 곡이 있으면 다음 곡으로
        const nextSong = localSongs[currentIndex + 1];
        setSelectedSong(nextSong);
        // 다음 곡 재생 시도
        setTimeout(() => {
          if (audio.readyState >= 2) {  // HAVE_CURRENT_DATA 이상
            audio.play()
              .catch(e => {
                if (e.name === 'NotAllowedError') {
                  toast.error('브라우저 정책으로 인해 자동 재생이 차단되었습니다. 재생 버튼을 클릭해주세요.');
                } else {
                  toast.error('재생할 수 없는 곡입니다. 다음 곡으로 넘어갑니다.');
                  handlePlayError(e);
                }
              });
          }
        }, 100);
      } else {
        toast.error('재생할 수 없는 곡입니다.');
      }
    };

    // 이벤트 리스너 등록
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('seeking', handleSeeking);
    audio.addEventListener('seeked', handleSeeked);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleLoadError);
    
    return () => {
      if (!audio) return;
      
      console.log('[Cleanup] Removing event listeners');
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('seeking', handleSeeking);
      audio.removeEventListener('seeked', handleSeeked);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleLoadError);
    };
  }, []);

  // 시간 변경 핸들러
  const handleSeek = useCallback((time: number) => {
    console.log('=== handleSeek ===');
    console.log('Seeking to:', time);

    if (!audioRef.current) {
      console.log('No audio element found');
      return;
    }

    if (!isAudioReady) {
      console.log('Audio not ready yet');
      return;
    }

    const newTime = Math.max(0, Math.min(time, audioRef.current.duration));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    console.log('======================');
  }, [isAudioReady]);

  const handleSeekBackward5 = useCallback(() => {
    if (!audioRef.current) return;
    handleSeek(audioRef.current.currentTime - 5);
  }, [handleSeek]);

  const handleSeekForward5 = useCallback(() => {
    if (!audioRef.current) return;
    handleSeek(audioRef.current.currentTime + 5);
  }, [handleSeek]);

  // 셔플 모드 변경 핸들러
  const handleShuffleChange = useCallback(() => {
    setIsShuffle(prev => {
      const nextState = !prev;
      console.log('MusicPlayerClient: 셔플 모드 변경', { 현재: prev, 다음: nextState });
      toast.success(`셔플 모드 ${nextState ? '켜짐' : '꺼짐'}`);
      return nextState;
    });
  }, []);

  // 재생 모드 변경 핸들러
  const handlePlayModeToggle = useCallback(() => {
    setPlayMode(prev => {
      const nextMode = prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none';
      console.log('MusicPlayerClient: 재생 모드 변경', { 현재: prev, 다음: nextMode });
      toast.success(
        nextMode === 'one' ? '한 곡 반복' : 
        nextMode === 'all' ? '전체 반복' : 
        '반복 없음'
      );
      return nextMode;
    });
  }, []);

  // 곡 삭제 핸들러
  const handleRemoveSong = useCallback((songs: SongWithChapter[]) => {
    setLocalSongs(prev => prev.filter(song => !songs.some(s => s.id === song.id)));
  }, []);

  // 재생 목록 순서 변경 핸들러
  const handleReorderPlaylist = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localSongs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalSongs(items);
  }, [localSongs]);

  // 곡 목록 가져오기
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        if (currentPage === 1) {
          setIsLoading(true);
        }
        
        const response = await fetch(`/api/songs?page=${currentPage}&limit=10`);
        if (!response.ok) throw new Error('Failed to fetch songs');
        const data = await response.json();
        
        if (data.songs && Array.isArray(data.songs)) {
          const validSongs = data.songs.filter((song: SongWithChapter) => 
            song.id && 
            song.title && 
            song.driveFileId
          );

          if (validSongs.length > 0) {
            // 새로운 곡들만 필터링
            const newSongs = validSongs.filter((song: SongWithChapter) => !loadedSongs.has(song.id.toString()));
            
            if (newSongs.length > 0) {
              // 점진적으로 곡 추가
              newSongs.forEach((song: SongWithChapter, index: number) => {
                setTimeout(() => {
                  setLocalSongs(prev => [...prev, song]);
                  loadedSongs.add(song.id.toString());
                }, index * 100); // 각 곡을 100ms 간격으로 추가
              });
            }
            
            if (data.pagination.totalPages) {
              setTotalPages(data.pagination.totalPages);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching songs:', error);
      } finally {
        setIsLoading(false);
        if (currentPage === 1) {
          // 500ms 후에 초기 로딩 상태 해제
          setTimeout(() => {
          }, 500);
        }
      }
    };

    fetchSongs();
  }, [currentPage]);

  // 더 많은 곡 로드
  const loadMore = useCallback(() => {
    if (currentPage < totalPages && !isLoading) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages, isLoading]);

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (scrollPosition >= documentHeight - 1000 && !isLoading && currentPage < totalPages) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, isLoading, currentPage, totalPages]);

  // 곡 데이터를 SongWithChapter로 변환하는 헬퍼 함수
  const fetchSongWithRelations = async (song: SongWithChapter): Promise<SongWithChapter> => {
    try {
      const response = await fetch(`/api/songs/${song.id}/drive-url`);
      if (!response.ok) {
        throw new Error('Failed to fetch song URL');
      }
      const data = await response.json();

      return {
        ...data,
      };
    } catch (error) {
      console.error('Error fetching song relations:', error);
      return {
        ...song,
      };
    }
  };

  const convertToSongWithChapter = (song: Song): SongWithChapter => {
    return {
      ...song,
      chapter: {
        id: song.chapterId,
        name: '',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        songId: song.id
      },
      genre: {
        id: song.genreId,
        name: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      popularSong: null,
      url: song.fileUrl || '',
      fileUrl: song.fileUrl || '',
      lyrics: song.lyrics || ''
    };
  };

  // 재생 목록이 변경될 때 첫 곡 선택
  useEffect(() => {
    if (localSongs.length > 0) {
      console.log('Songs updated:', {
        totalSongs: localSongs.length,
        currentSong: selectedSong?.id,
        firstSong: localSongs[0]
      });
      
      // 현재 선택된 노래가 없거나 선택된 노래가 목록에 없는 경우
      if (!selectedSong || !localSongs.find(s => s.id === selectedSong.id)) {
        console.log('Setting first song:', localSongs[0]);
        setSelectedSong(localSongs[0]);
        setIsLoading(true);
      }
    }
  }, [localSongs, selectedSong]);

  // 오디오 URL이 변경될 때 로딩 시작
  useEffect(() => {
    if (!audioRef.current || !audioUrl || !selectedSong) return;

    console.log('Loading audio URL:', audioUrl);
    setIsLoading(true);
    audioRef.current.load();
  }, [audioUrl, selectedSong]);

  // 오디오 이벤트 리스너
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      console.log('Audio can play now');
      setIsLoading(false);
      if (isPlaying) {
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
          handlePlayError(error);
        });
      }
    };

    const handleLoadStart = () => {
      console.log('Audio loading started');
      setIsLoading(true);
    };

    const handleLoadedData = () => {
      console.log('Audio data loaded');
      setIsLoading(false);
      if (isPlaying) {
        audio.play()
          .then(() => {
            console.log('Playback started successfully');
          })
          .catch((error) => {
            if (error.name === 'NotAllowedError') {
              toast.error('브라우저 정책으로 인해 자동 재생이 차단되었습니다. 재생 버튼을 클릭해주세요.');
              setIsPlaying(false);
            } else {
              handlePlayError(error);
            }
          });
      }
    };

    const handleLoadError = (e: Event) => {
      console.error('Audio load error:', e);
      console.log('Audio state:', {
        error: audio.error,
        networkState: audio.networkState,
        readyState: audio.readyState,
        currentSrc: audio.currentSrc,
        src: audio.src
      });
      handlePlayError(e);
    };

    const handlePlayError = (error: any) => {
      console.error('Playback error:', error);
      setIsLoading(false);
      setIsPlaying(false);
      
      // 현재 곡의 인덱스 찾기
      const currentIndex = localSongs.findIndex(s => s.id === selectedSong?.id);
      if (currentIndex !== -1 && currentIndex < localSongs.length - 1) {
        // 다음 곡이 있으면 다음 곡으로
        const nextSong = localSongs[currentIndex + 1];
        setSelectedSong(nextSong);
        // 다음 곡 재생 시도
        setTimeout(() => {
          if (audio.readyState >= 2) {  // HAVE_CURRENT_DATA 이상
            audio.play()
              .catch(e => {
                if (e.name === 'NotAllowedError') {
                  toast.error('브라우저 정책으로 인해 자동 재생이 차단되었습니다. 재생 버튼을 클릭해주세요.');
                } else {
                  toast.error('재생할 수 없는 곡입니다. 다음 곡으로 넘어갑니다.');
                  handlePlayError(e);
                }
              });
          }
        }, 100);
      } else {
        toast.error('재생할 수 없는 곡입니다.');
      }
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleLoadError);
    
    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleLoadError);
    };
  }, [isPlaying, localSongs, selectedSong]);

  const handleSongChange = useCallback((song: SongWithChapter) => {
    setSelectedSong(song);
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // lastPosition 상태 변경 시 로깅
  useEffect(() => {
    console.log('[State Change] lastPosition:', {
      lastPosition,
      currentTime: audioRef.current?.currentTime,
      isPlaying,
      src: audioRef.current?.src
    });
  }, [lastPosition, isPlaying]);

  return (
    <>
      <audio 
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          setCurrentTime(audio.currentTime);
          console.log('[Audio] TimeUpdate', {
            currentTime: audio.currentTime,
            lastPosition,
            paused: audio.paused,
            isPlaying
          });
        }}
        onPlay={() => {
          console.log('[Audio] Play Event', {
            currentTime: audioRef.current?.currentTime,
            lastPosition,
            isPlaying
          });
        }}
        onPause={() => {
          if (audioRef.current) {
            const currentPos = audioRef.current.currentTime;
            console.log('[Audio] Pause Event', {
              currentTime: currentPos,
              lastPosition,
              isPlaying
            });
            setLastPosition(currentPos);
          }
        }}
      />
      <div className="space-y-4">
        {/* 곡 목록 */}
        <div className="flex flex-col h-full">
          <PlaylistView
            playlist={localSongs}
            currentSong={selectedSong}
            onSongSelect={handleSongChange}
            onRemoveSong={handleRemoveSong}
            onShufflePlaylist={handleShuffleChange}
            onRepeatModeChange={handlePlayModeToggle}
            onReorderPlaylist={handleReorderPlaylist}
            isDarkMode={isDarkMode}
            isAudioReady={isAudioReady}
          />
        </div>

        {/* 플레이어 */}
        {selectedSong && isAudioReady && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <Player
              currentSong={selectedSong}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onPrevious={handlePrevSong}
              onNext={handleNextSong}
              onSeek={handleSeek}
              isShuffle={isShuffle}
              onShuffleToggle={handleShuffleChange}
              playMode={playMode}
              onPlayModeAction={handlePlayModeToggle}
              onSeekBackward5={handleSeekBackward5}
              onSeekForward5={handleSeekForward5}
              onSeekToStart={handleSeekToStart}
              disabled={!isAudioReady}
              songs={localSongs}
              isDarkMode={isDarkMode}
            />
          </div>
        )}
      </div>
      <div>
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 2000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </div>
    </>
  );
}

export default MusicPlayerClient;
