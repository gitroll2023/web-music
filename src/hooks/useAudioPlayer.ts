import { useState, useEffect, useRef, useCallback } from 'react';

interface AudioState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  volume: number;
}

export function useAudioPlayer(audioUrl: string | undefined) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    isReady: false,
    isLoading: false,
    error: null,
    volume: 1,
  });

  // 오디오 객체 초기화 및 이벤트 리스너 설정
  useEffect(() => {
    if (!audioUrl) {
      setAudioState(prev => ({ ...prev, isReady: false, error: null }));
      return;
    }

    // 이전 오디오 객체 정리
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
    }

    setAudioState(prev => ({ ...prev, isLoading: true, error: null }));

    const audio = new Audio();
    audioRef.current = audio;

    // 오디오 이벤트 리스너
    const handlers = {
      loadstart: () => setAudioState(prev => ({ ...prev, isLoading: true })),
      canplay: () => setAudioState(prev => ({ 
        ...prev, 
        isReady: true, 
        isLoading: false,
        error: null,
      })),
      loadedmetadata: () => setAudioState(prev => ({ 
        ...prev, 
        duration: audio.duration 
      })),
      timeupdate: () => setAudioState(prev => ({ 
        ...prev, 
        currentTime: audio.currentTime 
      })),
      ended: () => {
        setAudioState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          currentTime: 0 
        }));
      },
      error: (e: ErrorEvent) => {
        const errorMessage = getAudioErrorMessage(e);
        setAudioState(prev => ({ 
          ...prev, 
          error: errorMessage,
          isLoading: false,
          isReady: false,
        }));
        console.error('Audio error:', errorMessage);
      },
      waiting: () => setAudioState(prev => ({ ...prev, isLoading: true })),
      playing: () => setAudioState(prev => ({ ...prev, isLoading: false })),
    };

    // 이벤트 리스너 등록
    Object.entries(handlers).forEach(([event, handler]) => {
      audio.addEventListener(event, handler as EventListener);
    });

    // 오디오 소스 설정
    audio.src = audioUrl;
    audio.load();

    // Cleanup 함수
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        audio.removeEventListener(event, handler as EventListener);
      });
      
      audio.pause();
      audio.src = '';
      audio.load();
      audioRef.current = null;
      
      setAudioState({
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        isReady: false,
        isLoading: false,
        error: null,
        volume: 1,
      });
    };
  }, [audioUrl]);

  const play = useCallback(async () => {
    if (!audioRef.current || !audioState.isReady) return;
    try {
      await audioRef.current.play();
      setAudioState(prev => ({ ...prev, isPlaying: true }));
    } catch (error) {
      console.error('Playback failed:', error);
      setAudioState(prev => ({ 
        ...prev, 
        error: '재생에 실패했습니다. 다시 시도해주세요.',
        isPlaying: false,
      }));
      throw error;
    }
  }, [audioState.isReady]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setAudioState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current || !audioState.isReady) return;
    const newTime = Math.max(0, Math.min(time, audioState.duration));
    audioRef.current.currentTime = newTime;
    setAudioState(prev => ({ ...prev, currentTime: newTime }));
  }, [audioState.isReady, audioState.duration]);

  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    const newVolume = Math.max(0, Math.min(volume, 1));
    audioRef.current.volume = newVolume;
    setAudioState(prev => ({ ...prev, volume: newVolume }));
  }, []);

  return {
    ...audioState,
    play,
    pause,
    seek,
    setVolume,
  };
}

// 오디오 에러 메시지 생성
function getAudioErrorMessage(error: ErrorEvent): string {
  if (!navigator.onLine) {
    return '오프라인 상태입니다. 인터넷 연결을 확인해주세요.';
  }

  const audio = error.target as HTMLAudioElement;
  switch (audio.error?.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return '재생이 중단되었습니다.';
    case MediaError.MEDIA_ERR_NETWORK:
      return '네트워크 오류가 발생했습니다.';
    case MediaError.MEDIA_ERR_DECODE:
      return '오디오 파일을 재생할 수 없습니다.';
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return '지원하지 않는 오디오 형식입니다.';
    default:
      return '알 수 없는 오류가 발생했습니다.';
  }
}