'use client';

import { useState, useEffect, useRef, useCallback, useMemo, createRef } from 'react';
import { getApiUrl } from '@/utils/config';

interface LyricsTimestampEditorProps {
  songId: number;
  songUrl: string;
  initialLyrics: string;
  onSave: (lyrics: string) => void;
  onClose: () => void;
}

interface TimestampInfo {
  time: number;
  index: number;
}

const LyricsTimestampEditor: React.FC<LyricsTimestampEditorProps> = ({
  songId,
  songUrl,
  initialLyrics,
  onSave,
  onClose,
}) => {
  const [lyrics, setLyrics] = useState<string[]>([]);
  const [originalLyrics, setOriginalLyrics] = useState<string[]>([]);
  const [modifiedLines, setModifiedLines] = useState<Set<number>>(new Set());
  const [currentLine, setCurrentLine] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null); // 실제 오디오 엘리먼트를 저장할 ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [repeatState, setRepeatState] = useState<{
    start: number;
    end: number | null;
    active: boolean;
  } | null>(null);
  const [timestamps, setTimestamps] = useState<TimestampInfo[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [isSettingRepeatStart, setIsSettingRepeatStart] = useState(false);
  const [repeatStart, setRepeatStart] = useState<number | null>(null);
  const [repeatEnd, setRepeatEnd] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingTimestamp, setEditingTimestamp] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [tempLyrics, setTempLyrics] = useState<string[]>([]);
  const [isNavigationKeyPressed, setIsNavigationKeyPressed] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [bufferedPercent, setBufferedPercent] = useState(0);

  const processLyrics = useCallback(() => {
    try {
      console.log('초기 가사 처리 시작:', initialLyrics.substring(0, 100) + '...');
      
      let lines = initialLyrics.split('\n')
        .filter(line => line.trim() !== '')
        .filter(line => !line.trim().startsWith('---'));

      console.log('처리된 라인 수:', lines.length);
      
      // 첫 번째 라인에 [00:00.00] 공백 라인이 없으면 추가
      if (lines.length === 0 || (lines[0] !== '[00:00.00]' && lines[0] !== '[00:00.00] ')) {
        lines.unshift('[00:00.00]');
        console.log('첫 번째 라인에 타임스탬프 추가');
      }

      // 나머지 라인들에 대해 타임스탬프가 전혀 없는 경우 처리
      const hasAnyTimestamp = lines.slice(1).some(line => /^\[\d{2}:\d{2}\.\d{2}\]/.test(line));
      if (!hasAnyTimestamp) {
        console.log('타임스탬프가 없는 라인들에 기본 타임스탬프 추가');
        lines = lines.map((line, index) => 
          index === 0 ? line : `[00:00.00]${line}`
        );
      }

      const timestampInfos: TimestampInfo[] = [];
      lines.forEach((line, index) => {
        const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2})\]/);
        if (match) {
          const [, minutes, seconds, centiseconds] = match;
          const time = parseInt(minutes) * 60 + parseInt(seconds) + parseInt(centiseconds) / 100;
          timestampInfos.push({ time, index });
        }
      });

      console.log('타임스탬프 정보 추출:', timestampInfos.length);
      setTimestamps(timestampInfos);
      setOriginalLyrics(lines);
      setLyrics(lines);
      console.log('가사 처리 완료');
    } catch (error) {
      console.error('Error processing lyrics:', error);
      const defaultLyrics = ['[00:00.00]'];
      setLyrics(defaultLyrics);
      setOriginalLyrics(defaultLyrics);
      setTimestamps([{ time: 0, index: 0 }]);
    }
  }, [initialLyrics]);

  useEffect(() => {
    console.log('LyricsTimestampEditorV2 컴포넌트 마운트됨');
    console.log('Props:', { songId, songUrl, initialLyricsLength: initialLyrics?.length || 0 });
    processLyrics();

    return () => {
      console.log('LyricsTimestampEditorV2 컴포넌트 언마운트됨');
      // 오디오 정리: 모달 닫힐 때 반드시 재생 중지
      const audio = audioElementRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.load();
        audioElementRef.current = null;
        audioRef.current = null;
      }
    };
  }, [processLyrics, songId, songUrl]);

  useEffect(() => {
    const initializeAudio = async () => {
      if (!songUrl) {
        console.error('❌ 파일명이 제공되지 않았습니다.');
        setError('오디오 파일명이 제공되지 않았습니다.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setAudioLoaded(false); // 오디오 로딩 시작 시 로딩 상태 초기화
        
        console.log('🔍 오디오 로드 시작, 파일명:', songUrl);
        
        // songUrl은 이제 fileName입니다
        let fileName = songUrl;
        
        // 확장자가 없는 경우 .mp3 추가
        if (!fileName.includes('.')) {
          fileName = `${fileName}.mp3`;
          console.log('📝 확장자가 없어 .mp3를 추가했습니다:', fileName);
        }
        
        // public/music 디렉토리에 있는 파일에 접근
        const audioUrl = `/music/${fileName}`;
        console.log('🎵 최종 오디오 파일명:', fileName);
        console.log('🔗 최종 오디오 URL:', audioUrl);
        
        // 새 오디오 엘리먼트 생성
        if (!audioElementRef.current) {
          console.log('🎵 새 오디오 엘리먼트 생성');
          // 새 Audio 객체 생성
          const audioElement = new Audio();
          // ref에 저장
          audioElementRef.current = audioElement;
          // audioRef에도 동일 객체 참조 설정
          audioRef.current = audioElement;
        }
        
        // 파일이 존재하는지 확인
        try {
          const response = await fetch(audioUrl, {
            method: 'HEAD',
            cache: 'no-cache'
          });
            
          if (!response.ok) {
            console.error('❌ 오디오 파일을 찾을 수 없습니다:', response.status, response.statusText);
            setError(`오디오 파일을 찾을 수 없습니다: ${fileName}`);
            setIsLoading(false);
            return;
          }
            
          console.log('✅ 오디오 파일 HEAD 요청 결과:', response.status, response.ok ? '성공' : '실패');
        } catch (error) {
          console.error('❌ HEAD 요청 실패:', error);
          setError(`오디오 파일 확인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
          setIsLoading(false);
          return;
        }
        
        // 오디오 초기화
        if (audioElementRef.current) {
          audioElementRef.current.src = audioUrl;
          audioElementRef.current.preload = 'auto';
          audioElementRef.current.volume = 1.0;
          audioElementRef.current.crossOrigin = 'anonymous';
          
          // 이벤트 리스너 설정
          setupAudioEventListeners();
        }
        
        // 30초 후에 오디오가 여전히 로드 중이면 상태 확인 및 다시 시도
        const timeout = setTimeout(() => {
          if (!audioLoaded) {
            console.log('⚠️ 오디오 로딩 타임아웃 발생, 상태 확인 및 재시도');
            checkAndReloadAudio();
          }
        }, 30000);
        
        return () => clearTimeout(timeout);
        
      } catch (error) {
        console.error('❌ 오디오 초기화 오류:', error);
        setError(`오디오 초기화 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        setIsLoading(false);
        setAudioLoaded(false);
      }
    };

    initializeAudio();
  }, [songUrl]);

  const handlePrevLine = () => {
    if (currentLine > 0) {
      setManualMode(true); 
      setCurrentLine(currentLine - 1);
      // 선택된 라인으로 스크롤
      const element = document.getElementById(`lyrics-line-${currentLine - 1}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleNextLine = () => {
    if (currentLine < lyrics.length - 1) {
      setManualMode(true); 
      setCurrentLine(currentLine + 1);
      // 선택된 라인으로 스크롤
      const element = document.getElementById(`lyrics-line-${currentLine + 1}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleTimeUpdate = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    const newTime = audio.currentTime;
    setCurrentTime(newTime);
    
    if (!manualMode && !isNavigationKeyPressed) {
      const newCurrentLine = findCurrentLine(newTime);
      if (newCurrentLine !== -1) {
        setCurrentLine(newCurrentLine);
      }
    }

    if (repeatState?.active && repeatState.end !== null && newTime >= repeatState.end) {
      audio.currentTime = repeatState.start;
    }
  }, [manualMode, repeatState, isNavigationKeyPressed]);

  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [handleTimeUpdate]);

  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    let isSeeking = false;

    const handleSeeking = () => {
      isSeeking = true;
      if (targetTime !== null) {
        audio.currentTime = targetTime;
      }
    };

    const handleSeeked = () => {
      isSeeking = false;
      if (targetTime !== null) {
        setCurrentTime(targetTime);
        setTargetTime(null);
      }
    };

    audio.addEventListener('seeking', handleSeeking);
    audio.addEventListener('seeked', handleSeeked);

    return () => {
      audio.removeEventListener('seeking', handleSeeking);
      audio.removeEventListener('seeked', handleSeeked);
    };
  }, [targetTime]);

  const findCurrentLine = (time: number) => {
    if (manualMode) return currentLine; 

    for (let i = 0; i < timestamps.length; i++) {
      if (time >= timestamps[i].time && (i === timestamps.length - 1 || time < timestamps[i + 1].time)) {
        return timestamps[i].index;
      }
    }
    return currentLine;
  };

  const seek = (seconds: number) => {
    const audio = audioElementRef.current;
    if (!audio || !audioLoaded) {
      console.log('❌ 시간 이동 실패: 오디오가 준비되지 않음');
      return;
    }

    console.log(`⏩ ${seconds}초 이동 시도, 현재=${audio.currentTime}, 길이=${audio.duration}`);
    
    const newTime = Math.max(0, Math.min(audio.currentTime + seconds, audio.duration || 0));
    
    // NaN이나 Infinity 값 체크
    if (!isFinite(newTime)) {
      console.error('❌ 유효하지 않은 시간 값:', newTime);
      return;
    }
    
    console.log(`🕒 새 시간 위치: ${newTime}초`);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    
    const newCurrentLine = findCurrentLine(newTime);
    if (newCurrentLine !== -1) {
      console.log(`📝 새 가사 라인: ${newCurrentLine}`);
      setCurrentLine(newCurrentLine);
    }
  };

  const seekTo = async (time: number) => {
    const audio = audioElementRef.current;
    if (!audio || !audioLoaded) {
      console.log('❌ 특정 시간으로 이동 실패: 오디오가 준비되지 않음');
      return;
    }

    try {
      console.log(`⏩ ${time}초 위치로 직접 이동 시도`);
      
      const wasPlaying = !audio.paused;
      if (wasPlaying) {
        console.log('⏸️ 재생 중이어서 일시 정지');
        await audio.pause();
      }

      // NaN이나 Infinity 값 체크
      const newTime = Math.max(0, Math.min(time, audio.duration || 0));
      if (!isFinite(newTime)) {
        console.error('❌ seekTo: 유효하지 않은 시간 값:', newTime);
        return;
      }

      console.log(`🕒 시간 위치 설정: ${newTime}초`);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
      
      const newCurrentLine = findCurrentLine(newTime);
      if (newCurrentLine !== -1) {
        console.log(`📝 새 가사 라인: ${newCurrentLine}`);
        setCurrentLine(newCurrentLine);
      }

      if (wasPlaying) {
        try {
          console.log('▶️ 재생 재개');
          await audio.play();
        } catch (playError) {
          if (playError instanceof Error && playError.name === 'AbortError') {
            console.log('⚠️ 재생 취소됨 (AbortError)');
            // AbortError는 무시
            return;
          }
          throw playError;
        }
      }
    } catch (error) {
      console.error('❌ 시간 이동 오류:', error);
      setError('시간 이동 중 오류가 발생했습니다.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (editingIndex !== null) return;

    if (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S') {
      setIsNavigationKeyPressed(true);
      setManualMode(true); 
      
      if (e.key.toLowerCase() === 'w') {
        handlePrevLine();
      } else if (e.key.toLowerCase() === 's') {
        handleNextLine();
      }
    }

    switch (e.key.toLowerCase()) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'a':
        e.preventDefault();
        if (e.shiftKey) {
          seek(-1);
        } else {
          seek(-5);
        }
        break;
      case 'd':
        e.preventDefault();
        if (e.shiftKey) {
          seek(1);
        } else {
          seek(5);
        }
        break;
      case 'r':
        e.preventDefault();
        handleRepeatToggle();
        break;
      case 'f2':
        e.preventDefault();
        if (currentLine !== null) {
          const line = lyrics[currentLine];
          const displayText = line.replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '').trim();
          setEditingIndex(currentLine);
          setEditingText(displayText);
          setEditingTimestamp(false);
        }
        break;
      case 'f4':
        e.preventDefault();
        if (currentLine !== null) {
          const line = lyrics[currentLine];
          const timestamp = line.match(/^\[\d{2}:\d{2}\.\d{2}\]/)?.[0] || '[00:00.00]';
          setEditingIndex(currentLine);
          setEditingText(timestamp);
          setEditingTimestamp(true);
        }
        break;
      case '\\':
        e.preventDefault();
        if (currentLine !== null && modifiedLines.has(currentLine)) {
          restoreOriginalTimestamp(currentLine);
        }
        break;
      case 'enter':
        e.preventDefault();
        if (currentLine !== null) {
          const currentTime = audioElementRef.current?.currentTime || 0;
          const formattedTime = formatTime(currentTime);
          const line = lyrics[currentLine];
          const displayText = line.replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '').trim();
          const newLine = `[${formattedTime}]${displayText}`;
          const newLyrics = [...lyrics];
          newLyrics[currentLine] = newLine;
          setLyrics(newLyrics);
          updateTimestamps(newLyrics);
          modifiedLines.add(currentLine);
          setModifiedLines(new Set(modifiedLines));
        }
        break;
    }
  }, [editingIndex, currentTime, currentLine, lyrics, timestamps, modifiedLines, isPlaying, repeatState, audioLoaded]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S') {
      setIsNavigationKeyPressed(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleRepeatToggle = () => {
    const audio = audioElementRef.current;
    if (!audio || !audioLoaded) {
      setError('오디오가 아직 로드되지 않았습니다.');
      return;
    }

    if (!repeatState) {
      setRepeatState({
        start: audio.currentTime,
        end: null,
        active: false
      });
    } else if (repeatState.end === null) {
      const end = audio.currentTime;
      const start = repeatState.start;
      
      // 종료 지점이 시작 지점보다 앞에 있는 경우
      if (end < start) {
        setRepeatState({
          start: end,
          end: start,
          active: true
        });
      } else {
        setRepeatState({
          ...repeatState,
          end,
          active: true
        });
      }
    } else {
      // 반복 구간 해제
      setRepeatState(null);
    }
  };

  const addTimestamp = () => {
    if (currentLine >= lyrics.length) return;

    const timestamp = `[${formatTime(currentTime)}]`;
    const currentText = lyrics[currentLine].replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '').trim();
    const newLyrics = [...lyrics];
    newLyrics[currentLine] = `${timestamp}${currentText}`;
    setLyrics(newLyrics);
    setCurrentLine(currentLine + 1);
  };

  const formatLyrics = (inputLyrics: string[]) => {
    try {
      // 전체 가사를 하나의 문자열로 합치기
      const fullLyrics = inputLyrics.join(' ');
      
      // 타임스탬프와 가사 추출
      const timestampRegex = /\[(\d{2}:\d{2}\.\d{2})\](.*?)(?=\[|$)/g;
      const matches = Array.from(fullLyrics.matchAll(timestampRegex));
      
      // 새로운 가사 배열 생성
      const formattedLyrics = matches
        .map(match => {
          const timestamp = match[1];
          const text = match[2].trim();
          return text ? `[${timestamp}]${text}` : null;
        })
        .filter((line): line is string => line !== null);

      // 첫 줄에 빈 타임스탬프가 없을 경우에만 추가
      if (!formattedLyrics.some(line => line === '[00:00.00]' || line === '[00:00.00] ')) {
        formattedLyrics.unshift('[00:00.00]');
      }

      return formattedLyrics;
    } catch (error) {
      console.error('Error formatting lyrics:', error);
      return inputLyrics;
    }
  };

  const fixTimestampFormat = () => {
    const fixedLyrics = formatLyrics(lyrics);
    setLyrics(fixedLyrics);
  };

  const handleSave = async () => {
    try {
      // 저장하기 전에 가사 포맷팅
      const formattedLyrics = formatLyrics(lyrics);
      const lyricsText = formattedLyrics.join('\n');
      
      console.log('저장할 가사 내용:', lyricsText.substring(0, 100) + '...');
      console.log('저장할 가사 길이:', lyricsText.length);
      
      // API URL 확인
      const apiUrl = getApiUrl(`/api/songs/${songId}/lyrics`);
      console.log('가사 저장 API URL:', apiUrl);
      
      // getApiUrl 함수를 사용하여 API 엔드포인트 URL 생성
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lyrics: lyricsText }),
      });

      console.log('API 응답 상태:', response.status, response.ok ? '성공' : '실패');
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('서버 응답 에러:', errorData);
        throw new Error(`Failed to save lyrics: ${response.status} ${errorData}`);
      }

      const responseData = await response.json();
      console.log('저장 성공 응답:', responseData);
      console.log('가사가 성공적으로 저장되었습니다.');
      onSave(lyricsText);
    } catch (error) {
      console.error('Error saving lyrics:', error);
      alert(`가사 저장에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleEditSubmit = (index: number) => {
    if (editingText.trim() === '') return;
    
    const newLyrics = [...lyrics];
    const currentLine = lyrics[index];
    
    if (editingTimestamp) {
      const displayText = currentLine.replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '').trim();
      if (/^\[\d{2}:\d{2}\.\d{2}\]/.test(editingText)) {
        newLyrics[index] = `${editingText}${displayText}`;
      }
    } else {
      const timestamp = currentLine.match(/^\[\d{2}:\d{2}\.\d{2}\]/)?.[0] || '';
      newLyrics[index] = `${timestamp}${editingText}`;
    }
    
    if (newLyrics[index] !== originalLyrics[index]) {
      setModifiedLines(prev => new Set(prev).add(index));
    }
    
    setLyrics(newLyrics);
    setEditingIndex(null);
    setEditingTimestamp(false);
  };

  const restoreOriginalLine = (index: number) => {
    const newLyrics = [...lyrics];
    newLyrics[index] = originalLyrics[index];
    setLyrics(newLyrics);
    
    setModifiedLines(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const restoreOriginalTimestamp = (index: number) => {
    const newLyrics = [...lyrics];
    const originalLine = originalLyrics[index];
    const currentLine = lyrics[index];
    
    const originalTimestamp = originalLine.match(/^\[\d{2}:\d{2}\.\d{2}\]/)?.[0];
    if (originalTimestamp) {
      const currentText = currentLine.replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '').trim();
      newLyrics[index] = `${originalTimestamp}${currentText}`;
      setLyrics(newLyrics);
      updateTimestamps(newLyrics);
      
      const newModifiedLines = new Set(modifiedLines);
      newModifiedLines.delete(index);
      setModifiedLines(newModifiedLines);
    }
  };

  const resetAllTimestamps = () => {
    const newLyrics = lyrics.map(line => {
      const text = line.replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '').trim();
      return `[00:00.00]${text}`;
    });
    setLyrics(newLyrics);
    setManualMode(true); // 수동 모드 활성화
    // 타임스탬프 정보 업데이트
    const newTimestamps = newLyrics.map((_, index) => ({
      time: 0,
      index
    }));
    setTimestamps(newTimestamps);
  };

  const updateTimestamps = (newLyrics: string[]) => {
    const newTimestamps: TimestampInfo[] = [];
    newLyrics.forEach((line, index) => {
      const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2})\]/);
      if (match) {
        const [, minutes, seconds, centiseconds] = match;
        const time = parseInt(minutes) * 60 + parseInt(seconds) + parseInt(centiseconds) / 100;
        newTimestamps.push({ time, index });
      }
    });
    setTimestamps(newTimestamps);
  };

  const renderTimeControls = () => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => seek(-5)}
        className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md font-medium transition-colors duration-200"
        title="5초 뒤로 (A)"
      >
        -5초
      </button>
      <button
        onClick={() => seek(-1)}
        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md font-medium transition-colors duration-200"
        title="1초 뒤로 (Shift+A)"
      >
        -1초
      </button>
      <button
        onClick={() => seek(1)}
        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md font-medium transition-colors duration-200"
        title="1초 앞으로 (Shift+D)"
      >
        +1초
      </button>
      <button
        onClick={() => seek(5)}
        className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md font-medium transition-colors duration-200"
        title="5초 앞으로 (D)"
      >
        +5초
      </button>
    </div>
  );

  const togglePlay = async () => {
    const audio = audioElementRef.current;
    if (!audio) {
      console.error('❌ 오디오 요소가 없음');
      return;
    }
    
    // 오디오 객체 상태 디버깅
    console.log('🔍 오디오 객체 상태:', {
      paused: audio.paused,
      ended: audio.ended,
      readyState: audio.readyState,
      networkState: audio.networkState,
      currentTime: audio.currentTime,
      duration: audio.duration
    });
    
    // 오디오가 로드되지 않은 경우
    if (!audioLoaded) {
      console.error('❌ 오디오가 로드되지 않아 재생 불가');
      setError('오디오가 아직 로드되지 않았습니다.');
      return;
    }
    
    try {
      if (audio.paused) {
        console.log('▶️ 재생 시작 시도...');
        console.log(`📊 오디오 상태: 길이=${audio.duration}초, 현재시간=${audio.currentTime}초, 로드상태=${audio.readyState}`);
        
        // 현재 시간 확인
        if (!isFinite(audio.currentTime) || audio.currentTime < 0) {
          console.log('⚠️ 현재 시간이 유효하지 않아 0으로 설정');
          audio.currentTime = 0;
        }
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ 재생 시작됨');
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error('❌ 재생 시작 실패:', error);
              setIsPlaying(false);
              setError(`재생 시작 오류: ${error.message}`);
            });
        } else {
          console.log('⚠️ 플레이 프로미스가 정의되지 않았지만 재생은 시작됨');
          setIsPlaying(true);
        }
      } else {
        console.log('⏸️ 일시정지 시도...');
        
        try {
          audio.pause();
          console.log('✅ 일시정지됨, 상태:', audio.paused);
          setIsPlaying(false);
        } catch (pauseError) {
          console.error('❌ 일시정지 실패:', pauseError);
          // 상태를 강제로 업데이트
          setIsPlaying(false);
        }
      }
    } catch (error) {
      console.error('❌ 재생/일시정지 오류:', error);
      if (error instanceof Error) {
        setError(`재생 오류: ${error.message}`);
      } else {
        setError('알 수 없는 재생 오류가 발생했습니다.');
      }
      setIsPlaying(false);
    }
  };

  const renderRepeatStatus = () => {
    if (!repeatState) return null;

    return (
      <div className="mt-2 flex items-center space-x-2">
        <span className="text-sm text-blue-500">
          {repeatState.end === null ? (
            <>구간 반복: {formatTime(repeatState.start)} - [두 번째 지점 선택]</>
          ) : (
            <>구간 반복: {formatTime(repeatState.start)} - {formatTime(repeatState.end)} {repeatState.active ? '(반복 중)' : '(재생 시 반복)'}</>
          )}
        </span>
        <button
          onClick={() => setRepeatState(null)}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
        >
          취소
        </button>
      </div>
    );
  };

  const handleLineClick = (index: number) => {
    setManualMode(true);
    setCurrentLine(index);
    // 해당 라인의 타임스탬프가 있으면 그 시간으로 이동
    const timestamp = timestamps[index]?.time;
    if (timestamp !== undefined) {
      seekTo(timestamp);
    }
  };

  const renderLyrics = () => {
    return lyrics.map((line, index) => {
      const isInRepeatSection = repeatState && 
        timestamps[index]?.time >= repeatState.start && 
        (repeatState.end === null || timestamps[index]?.time <= repeatState.end);

      return (
        <div
          key={index}
          id={`lyrics-line-${index}`}
          className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-colors duration-200 ${
            currentLine === index ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          } ${modifiedLines.has(index) ? 'border-l-4 border-yellow-500' : ''}`}
          onClick={() => handleLineClick(index)}
          onDoubleClick={() => {
            const line = lyrics[index];
            const displayText = line.replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '').trim();
            setEditingIndex(index);
            setEditingText(displayText);
            setEditingTimestamp(false);
          }}
        >
          {/* 현재 재생 중인 가사 표시 */}
          <div className="w-4 flex items-center justify-center">
            {isPlaying && timestamps[index]?.time <= currentTime &&
            (index === timestamps.length - 1 || timestamps[index + 1]?.time > currentTime) ? (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            ) : null}
          </div>

          <div className="flex-grow">
            {editingIndex === index ? (
              <input
                ref={editInputRef}
                type="text"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditSubmit(index);
                  } else if (e.key === 'Escape') {
                    setEditingIndex(null);
                    setEditingTimestamp(false);
                  }
                  e.stopPropagation();
                }}
                className="w-full px-2 py-1 rounded border dark:bg-gray-700 dark:border-gray-600 text-black dark:text-black"
                autoFocus
              />
            ) : (
              <div className="flex items-baseline">
                {line.match(/^\[\d{2}:\d{2}\.\d{2}\]/) && (
                  <span className={`text-sm mr-2 ${modifiedLines.has(index) ? 'text-blue-500' : 'text-gray-500'}`}>
                    {modifiedLines.has(index) ? '✎ ' : ''}{line.match(/^\[\d{2}:\d{2}\.\d{2}\]/)?.[0]}
                  </span>
                )}
                <span className={`${currentLine === index ? 'font-bold' : ''} text-gray-900 dark:text-white`}>
                  {line.replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '').trim()}
                </span>
              </div>
            )}
          </div>
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => {
                const displayText = line.replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '').trim();
                setEditingIndex(index);
                setEditingText(displayText);
                setEditingTimestamp(false);
              }}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              title="가사 수정 (F2)"
            >
              ✎ 가사
            </button>
            <button
              onClick={() => {
                const timestamp = line.match(/^\[\d{2}:\d{2}\.\d{2}\]/)?.[0] || '[00:00.00]';
                setEditingIndex(index);
                setEditingText(timestamp);
                setEditingTimestamp(true);
              }}
              className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
              title="타임스탬프 수정 (F4)"
            >
              ⏱ 시간
            </button>
            {modifiedLines.has(index) && (
              <button
                onClick={() => restoreOriginalTimestamp(index)}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                title="원래 타임스탬프로 복원"
              >
                ↺ 복원
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);
      
      // 첫 줄이 타임스탬프가 없으면 추가
      let processedLines = lines;
      if (!lines[0]?.startsWith('[')) {
        processedLines = ['[00:00.00]', ...lines];
      }
      
      // 나머지 줄에 타임스탬프가 없으면 추가
      const newLyrics = processedLines.map((line, index) => {
        if (index === 0) return line;
        return line.startsWith('[') ? line : `[00:00.00] ${line}`;
      });

      setTempLyrics(newLyrics);
    };
    reader.readAsText(file);
  };

  const handleApplyLyrics = () => {
    if (tempLyrics.length > 0) {
      setLyrics(tempLyrics);
      setTempLyrics([]);
      processLyrics();
    }
  };

  // 모달 닫기: 오디오 정지 후 onClose 호출
  const handleCloseEditor = useCallback(() => {
    const audio = audioElementRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
      audio.load();
      audioElementRef.current = null;
      audioRef.current = null;
    }
    setIsPlaying(false);
    onClose();
  }, [onClose]);

  // 오디오 객체 상태 확인 및 리로드
  const checkAndReloadAudio = () => {
    const audio = audioElementRef.current;
    if (!audio) return;
    
    console.log('🔄 오디오 상태 확인 및 리로드 시도');
    
    // 오디오 객체 상태 확인
    const audioState = {
      paused: audio.paused,
      ended: audio.ended,
      readyState: audio.readyState,
      networkState: audio.networkState,
      error: audio.error ? {
        code: audio.error.code,
        message: audio.error.message
      } : null
    };
    
    console.log('📊 현재 오디오 상태:', audioState);
    
    // 문제가 있는 경우 재설정
    if (audioState.error || audioState.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || audioState.readyState === 0) {
      console.log('⚠️ 오디오에 문제가 감지되어 재설정 시도');
      
      // 이벤트 리스너 제거
      audio.onloadedmetadata = null;
      audio.oncanplay = null;
      audio.onerror = null;
      
      // 오디오 소스 다시 설정
      let fileName = songUrl;
      if (!fileName.includes('.')) {
        fileName = `${fileName}.mp3`;
      }
      const audioUrl = `/music/${fileName}`;
      
      // 캐시 방지를 위한 쿼리 파라미터 추가
      const cacheBuster = `?t=${new Date().getTime()}`;
      audio.src = audioUrl + cacheBuster;
      audio.load();
      
      // 이벤트 리스너 재설정
      setupAudioEventListeners();
      
      console.log('🔄 오디오 재설정 완료, 로드 중...');
    }
  };
  
  // 오디오 이벤트 리스너 설정 함수
  const setupAudioEventListeners = () => {
    // 기존 오디오 엘리먼트
    const oldAudio = audioElementRef.current;
    if (!oldAudio) return;
    
    // 기존 이벤트 리스너 제거
    const eventNames = ['loadstart', 'durationchange', 'loadeddata', 'progress', 
                        'canplay', 'canplaythrough', 'error', 'ended', 'loadedmetadata'];
    
    eventNames.forEach(eventName => {
      oldAudio.removeEventListener(eventName, () => {});
    });
    
    // 새 이벤트 리스너 설정
    oldAudio.addEventListener('loadstart', () => console.log('📡 오디오 로딩 시작'));
    
    oldAudio.addEventListener('durationchange', () => {
      console.log('⏱️ 오디오 길이 변경:', oldAudio.duration);
      if (isFinite(oldAudio.duration)) {
        setDuration(oldAudio.duration);
      }
    });
    
    oldAudio.addEventListener('loadeddata', () => {
      console.log('📥 오디오 데이터 로드됨');
      if (isFinite(oldAudio.duration)) {
        setDuration(oldAudio.duration);
      }
    });
    
    oldAudio.addEventListener('progress', () => {
      // 버퍼링 상태 확인
      if (oldAudio.buffered.length > 0) {
        const bufferedEnd = oldAudio.buffered.end(oldAudio.buffered.length - 1);
        const duration = oldAudio.duration;
        if (isFinite(duration) && duration > 0) {
          const percent = (bufferedEnd / duration) * 100;
          setBufferedPercent(percent);
          console.log(`🔄 오디오 버퍼링: ${Math.round(percent)}%`);
        }
      }
    });
    
    oldAudio.addEventListener('canplay', () => {
      console.log('▶️ 오디오 재생 가능');
      setAudioLoaded(true);
      setIsLoading(false);
    });
    
    oldAudio.addEventListener('canplaythrough', () => {
      console.log('⏩ 오디오 끝까지 재생 가능');
      setAudioLoaded(true);
      setIsAudioReady(true);
      setIsLoading(false);
    });
    
    oldAudio.addEventListener('error', (e) => {
      console.error('❌ 오디오 에러 발생:', e);
      if (oldAudio.error) {
        console.error('🚫 에러 코드:', oldAudio.error.code);
        console.error('📝 에러 메시지:', oldAudio.error.message);
        
        setError(`오디오 로드 오류 (${oldAudio.error.code}): ${oldAudio.error.message || '알 수 없는 오류'}`);
      } else {
        setError('알 수 없는 오디오 로드 오류가 발생했습니다.');
      }
      setIsLoading(false);
      setAudioLoaded(false);
    });
    
    oldAudio.addEventListener('ended', () => {
      console.log('🏁 오디오 재생 완료');
      setIsPlaying(false);
    });
    
    oldAudio.addEventListener('loadedmetadata', () => {
      console.log('✅ 오디오 메타데이터 로드 완료');
      if (isFinite(oldAudio.duration)) {
        console.log('🎼 오디오 길이:', oldAudio.duration);
        setDuration(oldAudio.duration);
        setIsAudioReady(true);
        setAudioLoaded(true);
        setIsLoading(false);
      }
    });
    
    // 로드 시작
    oldAudio.load();
  };

  // 오디오 상태 정기 체크 및 문제 발생 시 리로드
  useEffect(() => {
    if (!audioLoaded) return;
    
    // 5초마다 오디오 상태 확인
    const checkInterval = setInterval(() => {
      const audio = audioElementRef.current;
      if (!audio) return;
      
      // 오디오 객체 상태 확인
      if (isPlaying && audio.paused) {
        console.log('⚠️ 상태 불일치 감지: isPlaying=true인데 audio.paused=true');
        // 실제 상태와 일치하도록 재설정
        setIsPlaying(false);
      }
    }, 5000);
    
    return () => clearInterval(checkInterval);
  }, [audioLoaded, isPlaying]);
  
  // 재생/일시정지 버튼 클릭 시 오디오 상태 확인 후 필요하면 리로드
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        if (audioElementRef.current && !audioLoaded) {
          console.log('🔍 스페이스바 입력 감지: 오디오 로드 안됨, 리로드 시도');
          checkAndReloadAudio();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioLoaded]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col relative" onClick={(e) => e.stopPropagation()}>
        {/* 헤더와 컨트롤 영역을 하나로 합침 */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-20 px-6 pt-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">가사 타임스탬프 편집</h2>
            </div>
            <button onClick={handleCloseEditor} className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">✕</button>
          </div>

          {error && (
            <div className="text-red-500 mb-4">{error}</div>
          )}

          {/* 단축키 안내 */}
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
            <div className="font-medium mb-1 text-gray-900 dark:text-white">단축키 안내</div>
            <div className="grid grid-cols-2 gap-2">
              <div>• Space: 재생/일시정지</div>
              <div>• Enter: 현재 시간 타임스탬프 추가</div>
              <div>• A: 5초 뒤로</div>
              <div>• D: 5초 앞으로</div>
              <div>• Shift + A: 1초 뒤로</div>
              <div>• Shift + D: 1초 앞으로</div>
              <div>• W: 이전 가사</div>
              <div>• S: 다음 가사</div>
              <div>• R: 구간 반복 시작/종료 지점 설정</div>
              <div>• F2: 가사 수정</div>
              <div>• F4: 타임스탬프 수정</div>
              <div>• \: 현재 라인 원래 타임스탬프로 복원</div>
            </div>
          </div>

          {/* 오디오 플레이어 */}
          <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              {isLoading && (
                <div className="p-4 mb-4 bg-blue-100 text-blue-800 rounded-lg">
                  <div className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>오디오 파일 로딩 중...</span>
                  </div>
                </div>
              )}
              <audio
                ref={audioRef}
                className="hidden"
                preload="auto"
                onLoadedMetadata={() => {
                  console.log('✅ onLoadedMetadata 이벤트 발생');
                  const audio = audioRef.current;
                  if (audio) {
                    // duration이 유효한지 확인
                    if (!isFinite(audio.duration)) {
                      console.error('❌ 오디오 길이가 유효하지 않음:', audio.duration);
                      setError('오디오 파일의 길이를 가져올 수 없습니다.');
                      return;
                    }
                    
                    console.log('🎼 오디오 길이:', audio.duration);
                    setDuration(audio.duration);
                    setIsAudioReady(true);
                    setAudioLoaded(true);
                  }
                }}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                  console.log('🏁 오디오 재생 완료');
                  setIsPlaying(false);
                }}
              />

              <div 
                className={`relative h-2 bg-gray-200 rounded cursor-pointer ${!audioLoaded ? 'opacity-50' : ''}`}
                onClick={(e) => {
                  if (!audioLoaded) {
                    console.log('❌ 오디오가 로드되지 않아 시간 이동 불가');
                    return;
                  }

                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percent = x / rect.width;
                  const time = percent * duration;
                  console.log(`🖱️ 프로그레스바 클릭: ${time}초 위치 (${Math.round(percent * 100)}%)`);
                  seekTo(time);
                }}
              >
                {/* 버퍼링 표시 */}
                <div
                  className="absolute h-full bg-gray-300 rounded"
                  style={{ width: `${bufferedPercent}%` }}
                />
                {/* 재생 진행률 */}
                <div
                  className="absolute h-full bg-blue-500 rounded z-10"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />

                {repeatState && (
                  <div
                    className="absolute h-full bg-yellow-300 opacity-30 z-20"
                    style={{
                      left: `${(repeatState.start / duration) * 100}%`,
                      width: `${((repeatState.end || currentTime) - repeatState.start) / duration * 100}%`
                    }}
                  />
                )}

                {repeatState && (
                  <div className="absolute -top-6 left-0 right-0 flex justify-between text-xs text-blue-500 z-30">
                    <span style={{ left: `${(repeatState.start / duration) * 100}%`, position: 'absolute', transform: 'translateX(-50%)' }}>
                      {formatTime(repeatState.start)}
                    </span>
                    {repeatState.end !== null && (
                      <span style={{ left: `${(repeatState.end / duration) * 100}%`, position: 'absolute', transform: 'translateX(-50%)' }}>
                        {formatTime(repeatState.end)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  {renderTimeControls()}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={togglePlay}
                    className={`px-4 py-2 rounded flex items-center space-x-2 ${
                      !audioLoaded 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : isPlaying
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    disabled={!audioLoaded}
                    title={!audioLoaded ? '오디오 로딩 중입니다' : isPlaying ? '일시정지' : '재생'}
                  >
                    {!audioLoaded ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>로딩 중</span>
                      </>
                    ) : isPlaying ? (
                      <>
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                        <span>일시정지</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>재생</span>
                      </>
                    )}
                  </button>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {formatTime(currentTime)} / {audioLoaded ? formatTime(duration) : '--:--'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 스크롤 가능한 본문 영역 */}
        <div className="flex-1 overflow-y-auto px-6">
          {/* 가사 목록 */}
          <div className="space-y-2">
            {renderLyrics()}
          </div>

          {renderRepeatStatus()}
        </div>

        {/* 하단 버튼 영역 - 고정 */}
        <div className="sticky bottom-0 w-full bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
              id="lyrics-file-input"
            />
            <label
              htmlFor="lyrics-file-input"
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded cursor-pointer transition-colors duration-200"
            >
              가사파일 불러오기
            </label>
            {tempLyrics.length > 0 && (
              <button
                onClick={handleApplyLyrics}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors duration-200"
              >
                가사 적용하기
              </button>
            )}
            <button
              onClick={resetAllTimestamps}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition-colors duration-200 flex items-center space-x-1"
              title="모든 타임스탬프를 [00:00.00]으로 초기화하고 수동 모드로 전환합니다."
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span>타임스탬프 초기화</span>
            </button>
            <button
              onClick={fixTimestampFormat}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-lg hover:bg-yellow-600 transition-colors"
            >
              타임스탬프 오류 해결
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              저장
            </button>
            <button
              onClick={handleCloseEditor}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LyricsTimestampEditor;
