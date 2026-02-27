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

    console.log('Loading audio:', {
      providedUrl: audioUrl,
      windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'not in browser',
      isPlaying: audioState.isPlaying
    });
    
    setAudioState(prev => ({ ...prev, isLoading: true, error: null }));

    // 새로운 오디오 객체 생성
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    // 오디오 이벤트 리스너
    const handlers = {
      loadstart: () => {
        console.log('Audio loadstart:', {
          src: audio.src,
          readyState: audio.readyState,
          isPlaying: audioState.isPlaying
        });
        setAudioState(prev => ({ ...prev, isLoading: true }));
      },
      canplay: () => {
        console.log('Audio canplay:', {
          duration: audio.duration,
          src: audio.src,
          readyState: audio.readyState,
          isPlaying: audioState.isPlaying
        });

        setAudioState(prev => ({ 
          ...prev, 
          isReady: true, 
          isLoading: false,
          error: null,
          duration: audio.duration 
        }));

        // 항상 자동 재생하지 않고, 명시적인 요청이 있을 때만 재생하도록 수정
        // 이렇게 하면 사용자 상호작용이 있을 때 올바르게 재생됨
        if (audioState.isPlaying) {
          // 재생 요청이 있는 경우에만 실행
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('Playback started successfully');
                setAudioState(prev => ({ ...prev, isPlaying: true }));
              })
              .catch(error => {
                console.error('Playback failed:', error);
                // 자동 재생 정책 때문에 실패했을 경우, isPlaying 상태를 false로 변경하지 않음
                // 이렇게 하면 사용자가 명시적으로 재생 버튼을 클릭했을 때 재생을 시도함
                if (error.name !== 'NotAllowedError') {
                  setAudioState(prev => ({ ...prev, isPlaying: false }));
                }
              });
          }
        }
      },
      play: () => setAudioState(prev => ({ ...prev, isPlaying: true })),
      pause: () => setAudioState(prev => ({ ...prev, isPlaying: false })),
      timeupdate: () => setAudioState(prev => ({ ...prev, currentTime: audio.currentTime })),
      ended: () => {
        if (playMode === 'one') {
          // 한 곡 반복 모드면 처음부터 다시 재생
          audio.currentTime = 0;
          audio.play().catch(error => {
            console.error('Failed to replay audio:', error);
          });
        } else {
          setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
          cleanupAudio();
        }
      },
      error: (e: ErrorEvent | null) => {
        const audio = e?.target as HTMLAudioElement;
        console.error('Audio error:', {
          error: audio?.error,
          code: audio?.error?.code,
          message: audio?.error?.message,
          url: audioUrl,
          src: audio?.src,
          readyState: audio?.readyState
        });
        
        let errorMessage = '오디오를 재생할 수 없습니다.';
        if (audio?.error) {
          switch (audio.error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = '재생이 중단되었습니다.';
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = '네트워크 오류가 발생했습니다.';
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = '오디오 파일을 디코딩할 수 없습니다.';
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = '지원하지 않는 오디오 형식이거나 파일을 찾을 수 없습니다.';
              break;
          }
        }

        setAudioState(prev => ({ 
          ...prev, 
          error: errorMessage,
          isReady: false,
          isLoading: false
        }));
      }
    };

    // 이벤트 리스너 등록
    Object.entries(handlers).forEach(([event, handler]) => {
      audio.addEventListener(event, handler as EventListener);
    });

    try {
      // URL이 상대 경로인 경우 전체 URL 생성
      let fullUrl = audioUrl;
      if (audioUrl.startsWith('/')) {
        fullUrl = `${window.location.origin}${audioUrl}`;
      }
      
      console.log('Setting audio src:', {
        originalUrl: audioUrl,
        fullUrl: fullUrl
      });

      // src 설정 전에 URL 유효성 검사
      if (!fullUrl || fullUrl === window.location.origin + '/') {
        throw new Error('Invalid audio URL');
      }

      audio.src = fullUrl;
      audio.load();
      audio.loop = playMode === 'one';
    } catch (error) {
      console.error('Failed to set audio src:', {
        error,
        audioUrl,
        currentSrc: audio.src
      });
      setAudioState(prev => ({
        ...prev,
        error: '오디오 URL을 설정할 수 없습니다.',
        isReady: false,
        isLoading: false
      }));
      cleanupAudio();
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      cleanupAudio();
    };
  }, [audioUrl, cleanupAudio, playMode]);

  // 재생/일시정지 토글
  const togglePlay = useCallback(async () => {
    if (!audioRef.current) {
      console.log('No audio element available');
      return;
    }

    if (!audioState.isReady) {
      console.log('Audio is not ready yet');
      return;
    }

    const audio = audioRef.current; // 현재 오디오 요소를 로컬 변수에 저장하여 null 체크 이후에도 안전하게 접근

    console.log('Toggling audio playback:', {
      currentState: audioState.isPlaying,
      readyState: audio.readyState,
      src: audio.src
    });

    try {
      if (audioState.isPlaying) {
        audio.pause();
        setAudioState(prev => ({ ...prev, isPlaying: false }));
      } else {
        // 다른 모든 오디오 정지
        document.querySelectorAll('audio').forEach(otherAudio => {
          if (otherAudio !== audio) {
            otherAudio.pause();
          }
        });

        // 재생 시도 전에 약간의 딜레이 추가
        // 이는 브라우저가 오디오 리소스를 준비하는 데 필요한 시간을 제공함
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Play successfully started');
              setAudioState(prev => ({ ...prev, isPlaying: true }));
            })
            .catch(error => {
              // 사용자 상호작용 없이 자동 재생 실패 시 처리 
              console.error('Play failed:', error);
              
              // 오디오 요소의 음소거 상태로 다시 시도 (자동 재생 정책 우회)
              if (error.name === 'NotAllowedError' && audioRef.current) {
                console.log('Attempting to play muted due to autoplay policy');
                audioRef.current.muted = true;
                audioRef.current.play()
                  .then(() => {
                    if (audioRef.current) {
                      audioRef.current.muted = false;
                    }
                    setAudioState(prev => ({ ...prev, isPlaying: true }));
                  })
                  .catch(e => {
                    console.error('Even muted autoplay failed:', e);
                    setAudioState(prev => ({ ...prev, isPlaying: false }));
                  });
              } else {
                setAudioState(prev => ({ ...prev, isPlaying: false }));
              }
            });
        }
      }
    } catch (error) {
      console.error('Failed to toggle audio playback:', error);
    }
  }, [audioState.isPlaying, audioState.isReady]);

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
    audioRef,
  };
}

// 오디오 에러 메시지 생성
function getAudioErrorMessage(error: ErrorEvent | null): string {
  if (!error) return '알 수 없는 오류가 발생했습니다.';
  
  if (!navigator.onLine) {
    return '오프라인 상태입니다. 인터넷 연결을 확인해주세요.';
  }

  const audio = error.target as HTMLAudioElement;
  if (!audio || !audio.error) {
    return '오디오를 재생할 수 없습니다.';
  }

  switch (audio.error.code) {
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