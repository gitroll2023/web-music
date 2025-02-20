import { useState, useEffect, useRef, useCallback } from 'react';

interface AudioState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  volume: number;
  isLooping: boolean;
}

export function useAudioPlayer(audioUrl: string | undefined, playMode: 'all' | 'one' | 'none' = 'none') {
  // 각 훅 인스턴스별로 고유한 오디오 객체 생성
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    isReady: false,
    isLoading: false,
    error: null,
    volume: 1,
    isLooping: playMode === 'one',  // playMode가 'one'일 때 반복 재생 활성화
  });

  // playMode가 변경될 때마다 isLooping 상태 업데이트
  useEffect(() => {
    setAudioState(prev => ({ ...prev, isLooping: playMode === 'one' }));
    if (audioRef.current) {
      audioRef.current.loop = playMode === 'one';
    }
  }, [playMode]);

  // 오디오 정리 함수
  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      // 재생 중지
      audioRef.current.pause();
      // 이벤트 리스너 제거
      const audio = audioRef.current;
      const events = ['loadstart', 'canplay', 'play', 'pause', 'timeupdate', 'ended', 'error'];
      events.forEach(event => {
        audio.removeEventListener(event, () => {});
      });
      // 소스 초기화
      audio.src = '';
      audio.load();
      audioRef.current = null;
    }
  }, []);

  // URL이 변경될 때마다 오디오 객체 초기화
  useEffect(() => {
    // 이전 오디오 정리
    cleanupAudio();

    if (!audioUrl) {
      setAudioState(prev => ({ ...prev, isReady: false, error: null }));
      return;
    }

    setAudioState(prev => ({ ...prev, isLoading: true, error: null }));

    // 새로운 오디오 객체 생성
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    // 오디오 이벤트 리스너
    const handlers = {
      loadstart: () => setAudioState(prev => ({ ...prev, isLoading: true })),
      canplay: () => setAudioState(prev => ({ 
        ...prev, 
        isReady: true, 
        isLoading: false,
        error: null,
        duration: audio.duration 
      })),
      play: () => setAudioState(prev => ({ ...prev, isPlaying: true })),
      pause: () => setAudioState(prev => ({ ...prev, isPlaying: false })),
      timeupdate: () => setAudioState(prev => ({ ...prev, currentTime: audio.currentTime })),
      ended: () => {
        if (playMode === 'one') {
          // 한 곡 반복 모드면 처음부터 다시 재생
          audio.currentTime = 0;
          audio.play();
        } else {
          setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
          cleanupAudio(); // 재생이 끝나면 오디오 정리
        }
      },
      error: (e: ErrorEvent) => {
        console.error('Audio error:', e);
        setAudioState(prev => ({ 
          ...prev, 
          error: getAudioErrorMessage(e),
          isReady: false,
          isLoading: false
        }));
        cleanupAudio(); // 에러 발생 시 오디오 정리
      }
    };

    // 이벤트 리스너 등록
    Object.entries(handlers).forEach(([event, handler]) => {
      audio.addEventListener(event, handler as EventListener);
    });

    // 오디오 소스 설정
    audio.src = audioUrl;
    audio.loop = playMode === 'one';  // playMode에 따라 반복 재생 설정

    // 컴포넌트 언마운트 시 정리
    return () => {
      cleanupAudio();
    };
  }, [audioUrl, cleanupAudio, playMode]);

  // 재생/일시정지 토글
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (audioState.isPlaying) {
      audioRef.current.pause();
    } else {
      // 재생 전에 다른 모든 오디오 정지
      document.querySelectorAll('audio').forEach(audio => {
        if (audio !== audioRef.current) {
          audio.pause();
        }
      });
      audioRef.current.play();
    }
  }, [audioState.isPlaying]);

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
    togglePlay,
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