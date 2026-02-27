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
import { getApiUrl } from '@/utils/config';
import { getLocalFileUrl } from '@/utils/fileUtils';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';

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
  duration: string | null;
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
  // 사용자가 추가한 재생목록 - 초기값은 빈 배열
  const [userPlaylist, setUserPlaylist] = useState<SongWithChapter[]>([]);

  const {
    currentSong: hookCurrentSong,
    playlist: hookPlaylist,
    playlistSongs: hookPlaylistSongs,
    isPlaying: hookIsPlaying,
    currentTime: hookCurrentTime,
    duration: hookDuration,
    isReady: hookIsReady,
    setPlaylist,
    initializePlaylist,
    addToPlaylist: addToHookPlaylist,
    removeFromPlaylist,
    setCurrentSong: setHookCurrentSong,
    togglePlay: hookTogglePlay,
    toggleShuffle: hookToggleShuffle, 
    togglePlayMode: hookTogglePlayMode,
    getNextSong: hookGetNextSong,
    getPreviousSong: hookGetPreviousSong,
    seek: hookSeek
  } = useMusicPlayer();

  // 컴포넌트 마운트 시 상태 확인
  useEffect(() => {
    console.log('[디버그] MusicPlayerClient 컴포넌트 마운트됨');
    console.log('[디버그] 초기 songs prop:', songs.length, '곡');
    
    // 초기 userPlaylist 상태 설정 - 로컬 저장소에서만 불러오고 빈 배열이면 빈 상태로 유지
    const loadInitialPlaylist = () => {
      try {
        console.log('[디버그] 초기 재생목록 불러오는 중...');
        const savedPlaylist = localStorage.getItem('userPlaylist');
        
        if (savedPlaylist) {
          const parsedPlaylist = JSON.parse(savedPlaylist);
          if (Array.isArray(parsedPlaylist) && parsedPlaylist.length > 0) {
            console.log('[디버그] 로컬 저장소에서 재생목록 로드 성공:', parsedPlaylist.length, '곡');
            setUserPlaylist(parsedPlaylist);
          } else {
            console.log('[디버그] 초기 재생목록은 빈 배열로 설정');
            setUserPlaylist([]);
          }
        } else {
          console.log('[디버그] 로컬 저장소에 재생목록 없음, 빈 배열로 초기화');
          setUserPlaylist([]);
        }
      } catch (error) {
        console.error('[디버그] 초기 재생목록 로드 오류:', error);
        setUserPlaylist([]);
      }
    };
    
    loadInitialPlaylist();
    
    // 초기 상태값 로깅
    setTimeout(() => {
      console.log('[디버그] 컴포넌트 초기화 후 상태:');
      console.log('  - localSongs:', localSongs.length, '곡');
      console.log('  - userPlaylist:', userPlaylist.length, '곡');
      console.log('  - selectedSong:', selectedSong ? selectedSong.title : 'null');
    }, 1000);
    
    return () => {
      console.log('[디버그] MusicPlayerClient 컴포넌트 언마운트됨');
    };
  }, []);

  // 상태 변경 모니터링
  useEffect(() => {
    console.log('[디버그] userPlaylist 변경됨:', userPlaylist.length, '곡');
  }, [userPlaylist]);

  useEffect(() => {
    console.log('[디버그] selectedSong 변경됨:', selectedSong ? selectedSong.title : 'null');
  }, [selectedSong]);

  // 선택된 곡이 변경될 때 실행되는 효과
  useEffect(() => {
    const audio = audioRef.current;
    if (!selectedSong || !audio) return;

    // 기존 오디오 정리
    audio.pause();
    audio.currentTime = 0;
    setIsAudioReady(false);
    setIsPlaying(false);

    // 새로운 오디오 URL 설정
    const newAudioUrl = getLocalFileUrl(selectedSong.fileName, 'audio');
    console.log('MusicPlayerClient: 오디오 로드 시작:', {
      songTitle: selectedSong.title,
      fileName: selectedSong.fileName,
      url: newAudioUrl,
      currentTime: new Date().toISOString()
    });
    
    // 오디오 에러 처리 추가
    const handleError = (e: Event) => {
      console.error('MusicPlayerClient: 오디오 로드 실패:', e);
      const audioElement = e.target as HTMLAudioElement;
      console.error('Audio element state:', { 
        src: audioElement.src,
        readyState: audioElement.readyState,
        networkState: audioElement.networkState,
        paused: audioElement.paused
      });
      
      if (audioElement && audioElement.error) {
        console.error('오류 코드:', audioElement.error.code);
        console.error('오류 메시지:', audioElement.error.message);
        
        // 오류 코드에 따른 구체적인 메시지
        switch(audioElement.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            toast.error('음악 재생이 중단되었습니다');
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            toast.error('네트워크 오류로 음악을 불러올 수 없습니다');
            break;
          case MediaError.MEDIA_ERR_DECODE:
            toast.error('음악 파일을 디코딩할 수 없습니다');
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            toast.error('지원되지 않는 음악 파일입니다 (파일이 존재하는지 확인하세요)');
            break;
          default:
            toast.error('음악을 재생할 수 없습니다');
        }
      } else {
        toast.error('알 수 없는 오류로 음악을 재생할 수 없습니다');
      }
    };
    
    // audio 태그에 이벤트 리스너 등록
    audio.addEventListener('error', handleError);

    // 새 src 설정하고 로드
    try {
      audio.src = newAudioUrl;
      audio.load();
      console.log('MusicPlayerClient: 오디오 로드 명령 실행됨');
      
      // 메타데이터 로드 확인 이벤트
      const handleCanPlayThrough = () => {
        console.log('MusicPlayerClient: canplaythrough 이벤트 발생', {
          duration: audio.duration,
          readyState: audio.readyState
        });
      };
      
      audio.addEventListener('canplaythrough', handleCanPlayThrough);
      
      // 메타데이터 로드 완료 시 처리
      const handleLoadedMetadata = () => {
        console.log('MusicPlayerClient: 메타데이터 로드 완료:', {
          duration: audio.duration,
          src: audio.src,
          currentTime: new Date().toISOString()
        });
        
        if (isNaN(audio.duration) || audio.duration === Infinity) {
          console.error('MusicPlayerClient: 비정상적인 duration 값:', audio.duration);
          // 임시 duration 설정 (실제 값을 알 수 없을 때)
          setDuration(180); // 3분으로 임시 설정
        } else {
          // 오디오 파일에서 얻은 실제 duration 설정
          setDuration(audio.duration);
        }
        
        // 곡 정보에 duration 저장 (문자열 형태로)
        if (selectedSong) {
          const minutes = Math.floor(audio.duration / 60);
          const seconds = Math.floor(audio.duration % 60);
          const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          console.log('MusicPlayerClient: Duration 문자열:', durationStr);
          
          // 현재 선택된 노래 업데이트
          setSelectedSong(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              duration: durationStr
            };
          });
        }
        
        setIsAudioReady(true);
        console.log('MusicPlayerClient: isAudioReady 설정됨:', true);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      };
    } catch (error) {
      console.error('MusicPlayerClient: src 설정 중 예외 발생:', error);
      toast.error('음악 파일을 불러오는 중 오류가 발생했습니다');
      return () => {};
    }
  }, [selectedSong]);

  // 재생/일시정지 토글
  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !isAudioReady) {
      console.log('Cannot toggle play: audio not ready');
      return;
    }

    console.log('재생/일시정지 토글 시도:', {
      현재상태: isPlaying ? '재생중' : '일시정지',
      오디오준비: isAudioReady ? '완료' : '미완료',
      오디오일시정지: audio.paused ? '일시정지됨' : '재생중',
      오디오종료: audio.ended ? '종료됨' : '재생중',
      currentTime: audio.currentTime,
      duration: audio.duration
    });

    try {
      if (isPlaying) {
        // 일시정지 처리
        console.log('일시정지 요청');
        audio.pause();
        console.log('일시정지 완료:', audio.paused);
        setIsPlaying(false);
      } else {
        // 재생 처리
        console.log('재생 요청');
        // 다른 오디오 요소들 모두 일시정지
        document.querySelectorAll('audio').forEach(otherAudio => {
          if (otherAudio !== audio) otherAudio.pause();
        });
        
        try {
          // 오디오 요소 상태 확인
          if (audio.readyState < 2) {
            console.log('오디오가 충분히 로드되지 않음, 로드 대기 중...');
            await new Promise((resolve) => {
              const canPlayHandler = () => {
                audio.removeEventListener('canplay', canPlayHandler);
                resolve(true);
              };
              audio.addEventListener('canplay', canPlayHandler);
              
              // 10초 타임아웃 설정
              setTimeout(() => {
                audio.removeEventListener('canplay', canPlayHandler);
                resolve(false);
                console.log('오디오 로드 타임아웃');
              }, 10000);
            });
          }
          
          // 재생 시도
          const playPromise = await audio.play();
          console.log('재생 시작됨');
          setIsPlaying(true);
        } catch (playError: any) {
          console.error('재생 실패:', playError);
          
          // 자동 재생 정책 우회 시도 (음소거 후 재생)
          if (playError.name === 'NotAllowedError') {
            console.log('자동 재생 정책 우회 시도 (음소거 후 재생)');
            const originalVolume = audio.volume;
            audio.muted = true;
            
            try {
              await audio.play();
              // 재생이 시작되면 음소거 해제
              setTimeout(() => {
                audio.muted = false;
                audio.volume = originalVolume;
              }, 100);
              setIsPlaying(true);
            } catch (mutedPlayError) {
              console.error('음소거 후에도 재생 실패:', mutedPlayError);
              setIsPlaying(false);
              toast.error('음악을 재생할 수 없습니다');
            }
          } else {
            setIsPlaying(false);
            toast.error('음악을 재생할 수 없습니다');
          }
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
      setIsPlaying(false);
      toast.error('재생 중 오류가 발생했습니다');
    }
  }, [isPlaying, isAudioReady]);

  // 시간 변경 핸들러
  const handleSeek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio || !isAudioReady) return;

    const newTime = Math.max(0, Math.min(time, audio.duration));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [isAudioReady]);

  // timeupdate 이벤트 핸들러
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setCurrentTime(audio.currentTime);
    setLastPosition(audio.currentTime);
  }, []);

  // 오디오 이벤트 리스너 설정
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlers = {
      timeupdate: handleTimeUpdate,
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      ended: () => {
        setIsPlaying(false);
        setCurrentTime(0);
      },
      error: (e: Event) => {
        console.error('Audio error:', e);
        setIsPlaying(false);
      }
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      audio.addEventListener(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        audio.removeEventListener(event, handler);
      });
    };
  }, [handleTimeUpdate]);

  // 재생 오류 처리 함수
  const handlePlayError = useCallback((error: any) => {
    console.error('Playback error:', error);
    toast.error('재생할 수 없는 곡입니다. 다음 곡으로 넘어갑니다.');
    setIsPlaying(false);
    
    // 현재 곡의 인덱스 찾기
    const currentIndex = userPlaylist.findIndex(s => s.id === selectedSong?.id);
    if (currentIndex !== -1 && currentIndex < userPlaylist.length - 1) {
      // 다음 곡이 있으면 다음 곡으로
      const nextSong = userPlaylist[currentIndex + 1];
      setSelectedSong(nextSong);
    }
  }, [userPlaylist, selectedSong]);

  // 처음으로 돌아가기
  const handleSeekToStart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = 0;
    if (isPlaying) {
      audio.play().catch(handlePlayError);
    }
  }, [isPlaying, handlePlayError]);

  // 곡을 재생목록에 추가하는 함수
  const addToPlaylist = useCallback((song: SongWithChapter) => {
    // 이미 재생목록에 있는지 확인
    if (!userPlaylist.some(s => s.id === song.id)) {
      console.log('[디버그] 재생목록에 곡 추가:', song.title);
      setUserPlaylist(prev => [...prev, song]);
      toast.success(`${song.title} 곡이 재생목록에 추가되었습니다`);
    } else {
      console.log('[디버그] 이미 재생목록에 존재하는 곡:', song.title);
      toast.error('이미 재생목록에 있는 곡입니다');
    }
  }, [userPlaylist]);

  // 곡을 재생목록에서 제거
  const handleRemoveSong = useCallback((songs: SongWithChapter[]) => {
    console.log('[디버그] 재생목록에서 곡 제거:', songs.length, '곡');
    console.log('[디버그] 제거할 곡 ID 목록:', songs.map(s => s.id).join(', '));
    console.log('[디버그] 현재 재생목록 크기:', userPlaylist.length);
    
    // 모든 곡을 제거하는 경우 (전체 삭제)
    if (songs.length >= userPlaylist.length || songs.length === userPlaylist.length) {
      console.log('[디버그] 모든 곡 삭제 감지 - 재생목록 완전 초기화');
      setSelectedSong(null);
      setHookCurrentSong(null);
      setIsPlaying(false);
      setUserPlaylist([]);
      initializePlaylist([]);
      toast.success('재생목록이 초기화되었습니다');
      
      try {
        // 로컬 스토리지에서도 직접 삭제
        localStorage.removeItem('userPlaylist');
        console.log('[디버그] 로컬 스토리지에서 재생목록 삭제 완료');
      } catch (err) {
        console.error('[디버그] 로컬 스토리지 삭제 실패:', err);
      }
      
      return;
    }
    
    // 일부 곡만 제거하는 경우
    setUserPlaylist(prev => {
      // 제거할 모든 곡의 ID 목록을 생성
      const songIdsToRemove = new Set(songs.map(song => song.id));
      console.log('[디버그] 제거 전 재생목록 크기:', prev.length);
      
      // 제거할 곡이 현재 선택된 곡인 경우 재생 중지
      if (selectedSong && songIdsToRemove.has(selectedSong.id)) {
        console.log('[디버그] 현재 재생 중인 곡을 제거합니다:', selectedSong.title);
        setIsPlaying(false);
      }
      
      // 특정 곡만 제거하는 경우
      const updatedPlaylist = prev.filter(song => !songIdsToRemove.has(song.id));
      console.log('[디버그] 제거 후 재생목록 크기:', updatedPlaylist.length);
      
      // useMusicPlayer의 재생목록도 업데이트
      removeFromPlaylist(songs.map(song => song.id));
      
      // 업데이트된 재생목록이 비어있는 경우
      if (updatedPlaylist.length === 0) {
        console.log('[디버그] 제거 후 재생목록이 비어있습니다.');
        if (selectedSong) {
          setSelectedSong(null);
          setHookCurrentSong(null);
          setIsPlaying(false);
        }
        toast.success('재생목록이 비워졌습니다');
      } else {
        toast.success(`${songs.length}곡이 재생목록에서 제거되었습니다`);
      }
      
      return updatedPlaylist;
    });
  }, [selectedSong, userPlaylist, setHookCurrentSong, removeFromPlaylist, initializePlaylist]);

  // 재생목록 순서 변경 핸들러 - userPlaylist 사용하도록 수정
  const handleReorderPlaylist = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(userPlaylist);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setUserPlaylist(items);
    // useMusicPlayer의 재생목록도 업데이트
    initializePlaylist(items);
  }, [userPlaylist, initializePlaylist]);

  // 다음 곡 재생 - userPlaylist 직접 사용
  const handleNextSong = useCallback(() => {
    if (!selectedSong || userPlaylist.length === 0) return;
    const currentIndex = userPlaylist.findIndex(s => s.id === selectedSong.id);
    if (currentIndex === -1) return;

    let nextSong: SongWithChapter;
    if (isShuffle) {
      const remaining = userPlaylist.filter(s => s.id !== selectedSong.id);
      nextSong = remaining.length > 0
        ? remaining[Math.floor(Math.random() * remaining.length)]
        : userPlaylist[0];
    } else {
      nextSong = userPlaylist[(currentIndex + 1) % userPlaylist.length];
    }

    setSelectedSong(nextSong);
    setHookCurrentSong(nextSong);
  }, [selectedSong, userPlaylist, isShuffle, setHookCurrentSong]);

  // 이전 곡 재생 - userPlaylist 직접 사용
  const handlePrevSong = useCallback(() => {
    if (!selectedSong || userPlaylist.length === 0) return;
    const currentIndex = userPlaylist.findIndex(s => s.id === selectedSong.id);
    if (currentIndex === -1) return;

    let prevSong: SongWithChapter;
    if (isShuffle) {
      const remaining = userPlaylist.filter(s => s.id !== selectedSong.id);
      prevSong = remaining.length > 0
        ? remaining[Math.floor(Math.random() * remaining.length)]
        : userPlaylist[0];
    } else {
      prevSong = userPlaylist[(currentIndex - 1 + userPlaylist.length) % userPlaylist.length];
    }

    setSelectedSong(prevSong);
    setHookCurrentSong(prevSong);
  }, [selectedSong, userPlaylist, isShuffle, setHookCurrentSong]);

  // 재생 종료 핸들러 - userPlaylist 사용하도록 수정
  const handleEnded = useCallback(() => {
    console.log('[Audio Event] Ended', { 
      playMode,
      currentTime: audioRef.current?.currentTime,
      readyState: audioRef.current?.readyState,
      paused: audioRef.current?.paused,
      ended: audioRef.current?.ended
    });
    
    const currentIndex = userPlaylist.findIndex(s => s.id === selectedSong?.id);
    const audio = audioRef.current;
    
    if (!audio || !selectedSong) return;

    // 현재 위치 저장
    setLastPosition(0);
    
    if (playMode === 'one') {
      // 한 곡 반복 모드
      if (!selectedSong.fileName) {
        console.error('No file name available');
        return;
      }

      // 로컬 음악 파일 URL 생성하고 처음부터 재생
      const audioUrl = getLocalFileUrl(selectedSong.fileName, 'audio');
      audio.src = audioUrl;
      audio.load();
      audio.play().catch(handlePlayError);
      setIsPlaying(true);
    } else if (playMode === 'all' || (currentIndex < userPlaylist.length - 1)) {
      // 전체 반복 모드이거나 다음 곡이 있는 경우
      const nextSong = currentIndex === userPlaylist.length - 1 ? userPlaylist[0] : userPlaylist[currentIndex + 1];
      
      if (!nextSong.fileName) {
        console.error('No file name available for next song');
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
  }, [userPlaylist, selectedSong, playMode, handlePlayError]);

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

  // 곡 목록 가져오기
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        if (currentPage === 1) {
          setIsLoading(true);
          console.log('[디버그] 서버에서 곡 목록 불러오기 시작 (페이지:', currentPage, ')');
        }
        
        const response = await fetch(getApiUrl(`/api/songs?page=${currentPage}&limit=10`));
        if (!response.ok) throw new Error('Failed to fetch songs');
        const data = await response.json();
        
        if (data.songs && Array.isArray(data.songs)) {
          const validSongs = data.songs.filter((song: SongWithChapter) => 
            song.id && 
            song.title && 
            song.fileName
          );

          if (validSongs.length > 0) {
            console.log('[디버그] 유효한 곡 수:', validSongs.length);
            
            // 새로운 곡들만 필터링 (이미 불러온 곡은 제외)
            const newSongs = validSongs.filter((song: SongWithChapter) => !loadedSongs.has(song.id.toString()));
            
            if (newSongs.length > 0) {
              console.log('[디버그] 새로 불러온 곡 수:', newSongs.length);
              
              // 점진적으로 전체 곡 목록에만 추가 (재생목록에는 추가하지 않음)
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
        console.error('[디버그] 곡 목록 로드 오류:', error);
      } finally {
        setIsLoading(false);
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
      const response = await fetch(getApiUrl(`/api/songs/${song.id}/drive-url`));
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
    if (!song.fileName) {
      console.error('Song has no fileName:', song);
    }
    
    return {
      ...song,
      type: 'chapter',  // 'chapter', 'verse', 'title' 중 하나
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
      url: getLocalFileUrl(song.fileName, 'audio'),
      fileUrl: getLocalFileUrl(song.fileName, 'audio'),
      imageUrl: getLocalFileUrl(song.fileName, 'image'),
      lyrics: song.lyrics || '',
      duration: song.duration || '0:00'
    } as any as SongWithChapter;
  };

  // 재생목록에서 곡 선택 시
  const handleSongChangeFromPlaylist = useCallback((song: SongWithChapter) => {
    console.log('Song selected from playlist:', song);
    setSelectedSong(song);
    setIsPlaying(false);
  }, []);

  // 노래 목록에서 곡 선택 시 재생목록에 추가 및 재생 시작
  const handleSongSelectAndPlay = useCallback((song: SongWithChapter) => {
    console.log('[디버그] 전체 목록에서 곡 선택 및 재생:', song.title);
    
    // 재생목록에 없으면 추가
    if (!userPlaylist.some(s => s.id === song.id)) {
      console.log('[디버그] 선택한 곡을 재생목록에 자동 추가');
      setUserPlaylist(prev => [...prev, song]);
      addToHookPlaylist(song);
      toast.success(`${song.title} 곡이 재생목록에 추가되었습니다`);
    }
    
    // 선택한 곡 재생
    setSelectedSong(song);
    setHookCurrentSong(song);
    setIsPlaying(false); // 재생은 isAudioReady 이후에 시작됨
  }, [userPlaylist, addToHookPlaylist, setHookCurrentSong]);

  // 재생 목록이 변경될 때 첫 곡 선택
  useEffect(() => {
    // 재생목록이 비어있지 않고, 현재 선택된 곡이 없거나 재생목록에 없는 경우에만 첫 곡 자동 선택
    if (userPlaylist.length > 0 && (!selectedSong || !userPlaylist.some(s => s.id === selectedSong.id))) {
      console.log('[디버그] 재생목록에서 첫 곡 자동 선택:', userPlaylist[0].title);
      
      // 이미 다른 곡이 선택된 상태가 아닐 때만 첫 곡 선택
      if (!selectedSong) {
        setSelectedSong(userPlaylist[0]);
      }
    }
  }, [userPlaylist, selectedSong]);

  // 재생목록 변경 시 로컬 저장소에 저장
  useEffect(() => {
    const savePlaylistToStorage = () => {
      try {
        if (userPlaylist.length === 0) {
          console.log('[디버그] 재생목록이 비어있음, 로컬 저장소에서 제거');
          localStorage.removeItem('userPlaylist');
          return;
        }
        
        console.log('[디버그] 재생목록 변경됨, 로컬 저장소에 저장 중...', userPlaylist.length, '곡');
        localStorage.setItem('userPlaylist', JSON.stringify(userPlaylist));
      } catch (error) {
        console.error('[디버그] 재생목록 저장 실패:', error);
      }
    };

    // 컴포넌트 마운트 직후가 아닌 실제 변경 시에만 저장
    savePlaylistToStorage();
  }, [userPlaylist]);

  // 재생 목록이 변경될 때마다 useMusicPlayer의 playlistSongs를 업데이트
  useEffect(() => {
    // 재생목록이 변경될 때마다 useMusicPlayer에도 반영
    initializePlaylist(userPlaylist);
    console.log('[디버그] 재생목록 변경으로 useMusicPlayer playlistSongs 업데이트:', userPlaylist.length, '곡');
  }, [userPlaylist, initializePlaylist]);

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

  // 컴포넌트 마운트시 훅 초기화
  useEffect(() => {
    // 재생목록 설정
    initializePlaylist(userPlaylist);
  }, [initializePlaylist, userPlaylist]);

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      <audio ref={audioRef} preload="metadata" />
      
      <div className="space-y-4">
        {/* 곡 목록 */}
        <div className="flex flex-col h-full">
          <PlaylistView
            playlist={userPlaylist}
            allSongs={localSongs}
            currentSong={selectedSong}
            onSongSelect={handleSongChangeFromPlaylist}
            onRemoveSong={handleRemoveSong}
            onShufflePlaylist={handleShuffleChange}
            onRepeatModeChange={handlePlayModeToggle}
            onReorderPlaylist={handleReorderPlaylist}
            onAddToPlaylist={addToPlaylist}
            onSongSelectAndPlay={handleSongSelectAndPlay}
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
              onSeekBackward5={() => handleSeek(currentTime - 5)}
              onSeekForward5={() => handleSeek(currentTime + 5)}
              onSeekToStart={handleSeekToStart}
              disabled={!isAudioReady}
              songs={userPlaylist}
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
    </div>
  );
}

export default MusicPlayerClient;
