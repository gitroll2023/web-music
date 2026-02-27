'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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
  const [localAudioPath, setLocalAudioPath] = useState<string>('');
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [repeatState, setRepeatState] = useState<{
    start: number;
    end: number | null;
    active: boolean;
  } | null>(null);
  const [timestamps, setTimestamps] = useState<TimestampInfo[]>([]);
  const [manualMode, setManualMode] = useState(false); // 수동 모드 상태 추가
  const [isSettingRepeatStart, setIsSettingRepeatStart] = useState(false);
  const [repeatStart, setRepeatStart] = useState<number | null>(null);
  const [repeatEnd, setRepeatEnd] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingTimestamp, setEditingTimestamp] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [targetTime, setTargetTime] = useState<number | null>(null);

  useEffect(() => {
    // DB에서 가져온 가사 처리
    const processLyrics = () => {
      try {
        let lines = initialLyrics.split('\n')
          .filter(line => line.trim() !== '')
          .filter(line => !line.trim().startsWith('---'));

        // 타임스탬프가 있는지 확인
        const hasAnyTimestamp = lines.some(line => /^\[\d{2}:\d{2}\.\d{2}\]/.test(line));

        if (!hasAnyTimestamp) {
          // 타임스탬프가 없는 경우, 각 줄에 [00:00.00] 추가
          lines = lines.map(line => `[00:00.00]${line}`);
        }

        // 타임스탬프 정보 추출
        const timestampInfos: TimestampInfo[] = [];
        lines.forEach((line, index) => {
          const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2})\]/);
          if (match) {
            const [, minutes, seconds, centiseconds] = match;
            const time = parseInt(minutes) * 60 + parseInt(seconds) + parseInt(centiseconds) / 100;
            timestampInfos.push({ time, index });
          }
        });

        setTimestamps(timestampInfos);
        setOriginalLyrics(lines);
        setLyrics(lines);
      } catch (error) {
        console.error('Error processing lyrics:', error);
        const defaultLyrics = ['[00:00.00]'];
        setLyrics(defaultLyrics);
        setOriginalLyrics(defaultLyrics);
        setTimestamps([{ time: 0, index: 0 }]);
      }
    };
    processLyrics();
  }, [initialLyrics]);

  useEffect(() => {
    const initializeAudio = async () => {
      if (!songUrl) return;

      try {
        setIsLoading(true);
        const fileId = songUrl.split('id=')[1];
        if (!fileId) {
          throw new Error('유효하지 않은 Google Drive URL입니다.');
        }

        // 먼저 파일이 이미 다운로드되어 있는지 확인
        const checkResponse = await fetch(`/api/download/${fileId}?check=true`);
        const checkData = await checkResponse.json();
        
        let audioFileName = checkData.filename;

        if (!checkData.exists) {
          // 파일이 없으면 다운로드
          const downloadResponse = await fetch(`/api/download/${fileId}`);
          if (!downloadResponse.ok) {
            throw new Error('파일 다운로드에 실패했습니다.');
          }
          const downloadData = await downloadResponse.json();
          audioFileName = downloadData.filename;
        }

        setFileName(audioFileName);
        
        if (audioRef.current) {
          // 로컬 오디오 API를 통해 파일 로드
          audioRef.current.src = `/api/local-audio/${audioFileName}`;
          audioRef.current.preload = 'metadata';  // 메타데이터 미리 로드
          audioRef.current.load();
          
          // 메타데이터 로드 이벤트
          audioRef.current.onloadedmetadata = () => {
            const audio = audioRef.current;
            if (audio) {
              setDuration(audio.duration);
              setIsAudioReady(true);
              setIsLoading(false);
              
              // 시킹 가능 여부 확인
              const seekable = audio.seekable;
              if (seekable && seekable.length > 0) {
                console.log('Seekable ranges:', 
                  Array.from({length: seekable.length}, (_, i) => 
                    `${seekable.start(i)}-${seekable.end(i)}`
                  )
                );
              }
            }
          };

          // 에러 이벤트
          audioRef.current.onerror = (e) => {
            console.error('Audio loading error:', e);
            const audio = audioRef.current as HTMLAudioElement;
            if (audio && audio.error) {
              console.error('Error code:', audio.error.code);
              console.error('Error message:', audio.error.message);
            }
            setError('음원을 로드하는 중 오류가 발생했습니다.');
            setIsLoading(false);
          };
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
        setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    initializeAudio();
  }, [songUrl]);

  const handlePrevLine = () => {
    if (currentLine > 0) {
      setManualMode(true); // 수동 모드로 전환
      setCurrentLine(currentLine - 1);
    }
  };

  const handleNextLine = () => {
    if (currentLine < lyrics.length - 1) {
      setManualMode(true); // 수동 모드로 전환
      setCurrentLine(currentLine + 1);
    }
  };

  // 자동 추적 모드로 복귀
  const resetManualMode = useCallback(() => {
    if (!isPlaying || !manualMode) return; // 재생 중이고 수동 모드일 때만 실행
    setManualMode(false);
  }, [isPlaying, manualMode]);

  // 5초 후 자동 추적 모드로 복귀
  useEffect(() => {
    if (!manualMode) return;

    const timer = setTimeout(resetManualMode, 5000);
    return () => clearTimeout(timer);
  }, [manualMode, resetManualMode]);

  // 오디오 시간 업데이트 핸들러
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = audio.currentTime;
    setCurrentTime(newTime);
    
    // 수동 모드가 아닐 때만 현재 가사 자동 업데이트
    if (!manualMode) {
      const newCurrentLine = findCurrentLine(newTime);
      if (newCurrentLine !== -1) {
        setCurrentLine(newCurrentLine);
      }
    }

    // 활성화된 반복 구간 내에서만 반복 재생
    if (repeatState?.active && repeatState.end !== null && newTime >= repeatState.end) {
      audio.currentTime = repeatState.start;
    }
  }, [manualMode, repeatState]);

  // 오디오 이벤트 리스너
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [handleTimeUpdate]);

  useEffect(() => {
    const audio = audioRef.current;
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

  // 현재 시간에 해당하는 가사 찾기
  const findCurrentLine = (time: number) => {
    if (manualMode) return currentLine; // 수동 모드일 때는 현재 선택된 라인 유지

    for (let i = 0; i < timestamps.length; i++) {
      if (time >= timestamps[i].time && (i === timestamps.length - 1 || time < timestamps[i + 1].time)) {
        return timestamps[i].index;
      }
    }
    return currentLine;
  };

  const seek = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(audio.currentTime + seconds, audio.duration));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    
    // 현재 가사 업데이트
    const newCurrentLine = findCurrentLine(newTime);
    if (newCurrentLine !== -1) {
      setCurrentLine(newCurrentLine);
    }
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(time, audio.duration));
    setCurrentTime(time);
    
    // 현재 가사 업데이트
    const newCurrentLine = findCurrentLine(time);
    if (newCurrentLine !== -1) {
      setCurrentLine(newCurrentLine);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // W/S 키는 항상 작동하도록 먼저 처리
      if (e.key.toLowerCase() === 'w') {
        handlePrevLine();
        e.preventDefault();
        return;
      }
      if (e.key.toLowerCase() === 's') {
        handleNextLine();
        e.preventDefault();
        return;
      }

      // 편집 모드에서는 Escape만 처리
      if (editingIndex !== null) {
        if (e.key === 'Escape') {
          setEditingIndex(null);
          setEditingTimestamp(false);
          e.preventDefault();
        }
        return;
      }

      // 입력 필드에서는 다른 단축키 비활성화
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          togglePlay();
          e.preventDefault();
          break;
        case 'a':
          if (e.shiftKey) {
            seek(-1);
          } else {
            seek(-5);
          }
          e.preventDefault();
          break;
        case 'd':
          if (e.shiftKey) {
            seek(1);
          } else {
            seek(5);
          }
          e.preventDefault();
          break;
        case 'r':
          handleRepeatToggle();
          e.preventDefault();
          break;
        case 'enter':
          if (currentLine !== null) {
            const currentTime = audioRef.current?.currentTime || 0;
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
          e.preventDefault();
          break;
        case '\\':
          if (currentLine !== null && modifiedLines.has(currentLine)) {
            restoreOriginalTimestamp(currentLine);
          }
          e.preventDefault();
          break;
        case 'f2':
          if (currentLine !== null) {
            const line = lyrics[currentLine];
            const displayText = line.replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '').trim();
            setEditingIndex(currentLine);
            setEditingText(displayText);
            setEditingTimestamp(false);
          }
          e.preventDefault();
          break;
        case 'f4':
          if (currentLine !== null) {
            const line = lyrics[currentLine];
            const timestamp = line.match(/^\[\d{2}:\d{2}\.\d{2}\]/)?.[0] || '[00:00.00]';
            setEditingIndex(currentLine);
            setEditingText(timestamp);
            setEditingTimestamp(true);
          }
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingIndex, currentLine, lyrics, timestamps, modifiedLines, isPlaying, repeatState]);

  const handleRepeatToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!repeatState) {
      // 첫 번째 R: 시작 지점 설정
      setRepeatState({
        start: audio.currentTime,
        end: null,
        active: false
      });
    } else if (repeatState.end === null) {
      // 두 번째 R: 끝 지점 설정
      const end = audio.currentTime;
      const start = repeatState.start;
      
      // 시작과 끝 지점을 자동으로 정렬
      setRepeatState({
        start: Math.min(start, end),
        end: Math.max(start, end),
        active: false // 재생 버튼 누를 때 활성화됨
      });
    } else {
      // 세 번째 R: 구간 반복 취소
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

  const handleSave = async () => {
    try {
      // 가사를 문자열로 변환
      const lyricsText = lyrics.join('\n');
      
      // DB 업데이트
      const response = await fetch(`/api/songs/${songId}/lyrics`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lyrics: lyricsText }),
      });

      if (!response.ok) {
        throw new Error('Failed to save lyrics');
      }

      // 부모 컴포넌트에 알림
      onSave(lyricsText);
    } catch (error) {
      console.error('Error saving lyrics:', error);
      alert('가사 저장에 실패했습니다.');
    }
  };

  const handleEditSubmit = (index: number) => {
    if (editingText.trim() === '') return;
    
    const newLyrics = [...lyrics];
    const currentLine = lyrics[index];
    
    if (editingTimestamp) {
      // 타임스탬프만 수정
      const displayText = currentLine.replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '').trim();
      if (/^\[\d{2}:\d{2}\.\d{2}\]/.test(editingText)) {
        newLyrics[index] = `${editingText}${displayText}`;
      }
    } else {
      // 가사만 수정
      const timestamp = currentLine.match(/^\[\d{2}:\d{2}\.\d{2}\]/)?.[0] || '';
      newLyrics[index] = `${timestamp}${editingText}`;
    }
    
    // 원본과 다른 경우에만 수정된 줄로 표시
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
    
    // 수정된 줄 목록에서 제거
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
    
    // 원래 타임스탬프 추출
    const originalTimestamp = originalLine.match(/^\[\d{2}:\d{2}\.\d{2}\]/)?.[0];
    if (originalTimestamp) {
      // 현재 가사 텍스트는 유지하고 타임스탬프만 복원
      const currentText = currentLine.replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '').trim();
      newLyrics[index] = `${originalTimestamp}${currentText}`;
      setLyrics(newLyrics);
      updateTimestamps(newLyrics);
      
      // 타임스탬프가 원래대로 돌아갔으므로 수정된 라인에서 제거
      const newModifiedLines = new Set(modifiedLines);
      newModifiedLines.delete(index);
      setModifiedLines(newModifiedLines);
    }
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

  // 파일 존재 여부 확인
  const checkFileExists = async (fileId: string) => {
    try {
      const response = await fetch(`/api/download/${fileId}?check=true`);
      const data = await response.json();
      setIsDownloaded(data.exists);
      if (data.exists) {
        setFileName(data.filename);
      }
    } catch (error) {
      console.error('파일 확인 실패:', error);
      setIsDownloaded(false);
    }
  };

  // URL이 변경될 때마다 파일 존재 여부 확인
  useEffect(() => {
    if (songUrl) {
      const fileId = songUrl.split('id=')[1];
      if (fileId) {
        checkFileExists(fileId);
      }
    }
  }, [songUrl]);

  // 파일 다운로드
  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError('파일 다운로드 중...');
      
      const fileId = songUrl.split('id=')[1];
      if (!fileId) {
        throw new Error('유효하지 않은 Google Drive URL입니다.');
      }

      const response = await fetch(`/api/download/${fileId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '파일 다운로드에 실패했습니다.');
      }

      const data = await response.json();
      setFileName(data.filename);
      setIsDownloaded(true);
      setError('');
    } catch (error: any) {
      console.error('파일 다운로드 실패:', error);
      setError(error?.message || '파일을 다운로드하는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 파일 로드
  const handleLoadFile = () => {
    try {
      setIsLoading(true);
      setIsAudioReady(false);
      setError('파일 불러오는 중...');
      
      if (!fileName) {
        throw new Error('파일명이 없습니다.');
      }

      if (audioRef.current) {
        audioRef.current.src = `/api/stream/${fileName}`;
        audioRef.current.load();
      }
    } catch (error: any) {
    console.error('파일 로드 실패:', error);
      setError(error?.message || '파일을 불러오는데 실패했습니다.');
      setIsLoading(false);
      setIsAudioReady(false);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      // 재생 시작할 때 반복 구간이 설정되어 있다면 활성화
      if (repeatState && repeatState.end !== null && !repeatState.active) {
        const newRepeatState = {
          start: repeatState.start,
          end: repeatState.end,
          active: true
        };
        setRepeatState(newRepeatState);
        audio.currentTime = newRepeatState.start;
      }
      audio.play();
    } else {
      audio.pause();
    }
    setIsPlaying(!audio.paused);
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

  const renderLyrics = () => {
    return lyrics.map((line, index) => {
      const isInRepeatSection = repeatState && 
        timestamps[index]?.time >= repeatState.start && 
        (repeatState.end === null || timestamps[index]?.time <= repeatState.end);

      return (
        <div
          key={index}
          className={`flex items-center space-x-2 p-2 rounded ${
            currentLine === index ? 'bg-gray-100 dark:bg-gray-700' : ''
          } ${isInRepeatSection ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
        >
          {/* 상태 아이콘 (재생 중인 가사 표시) */}
          <div className="w-4">
            {isPlaying && timestamps[index]?.time <= currentTime &&
            (index === timestamps.length - 1 || timestamps[index + 1]?.time > currentTime) ? (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            ) : null}
          </div>

          <div className="flex-grow font-medium">
            {editingIndex === index ? (
              <input
                ref={editInputRef}
                type="text"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={() => handleEditSubmit(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditSubmit(index);
                  } else if (e.key === 'Escape') {
                    setEditingIndex(null);
                    setEditingTimestamp(false);
                  }
                  e.stopPropagation();
                }}
                className={`w-full px-1 bg-white dark:bg-gray-800 border rounded ${
                  editingTimestamp 
                    ? 'border-yellow-500 font-mono' 
                    : 'border-blue-500'
                }`}
                placeholder={editingTimestamp ? '[MM:SS.CC]' : '가사 입력...'}
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">가사 타임스탬프 편집</h2>
            {isAudioReady && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">✕</button>
        </div>

        {/* 파일 경로 표시 */}
        {fileName && (
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded mb-2 text-sm font-mono">
            <span className="text-gray-600 dark:text-gray-300">현재 파일: </span>
            <span className="text-blue-600 dark:text-blue-400">C:\AI_MUSIC\{fileName}</span>
          </div>
        )}

        {error && (
          <div className="text-red-500 mb-2">{error}</div>
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
        <div className="flex flex-col h-full">
          <div className="flex flex-col space-y-4">
            <div className="relative">
              <audio
                ref={audioRef}
                className="hidden"
                preload="metadata"
                onLoadedMetadata={() => {
                  const audio = audioRef.current;
                  if (audio) {
                    setDuration(audio.duration);
                    setIsAudioReady(true);
                  }
                }}
                onTimeUpdate={() => {
                  const audio = audioRef.current;
                  if (!audio) return;

                  const newTime = audio.currentTime;
                  setCurrentTime(newTime);
                  
                  // 현재 가사 업데이트
                  const newCurrentLine = findCurrentLine(newTime);
                  if (newCurrentLine !== -1) {
                    setCurrentLine(newCurrentLine);
                  }

                  // 활성화된 반복 구간 내에서만 반복 재생
                  if (repeatState?.active && repeatState.end !== null && newTime >= repeatState.end) {
                    audio.currentTime = repeatState.start;
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onSeeking={() => {
                  console.log('Seeking started');
                }}
                onSeeked={() => {
                  console.log('Seeking ended');
                  const audio = audioRef.current;
                  if (audio) {
                    console.log('New time:', audio.currentTime);
                  }
                }}
                onError={(e) => {
                  console.error('Audio error:', e);
                  const audio = e.currentTarget;
                  if (audio.error) {
                    console.error('Error code:', audio.error.code);
                    console.error('Error message:', audio.error.message);
                  }
                }}
              />

              {/* 커스텀 타임라인 */}
              <div 
                className="relative h-2 bg-gray-200 rounded cursor-pointer"
                onClick={(e) => {
                  const audio = audioRef.current;
                  if (!audio || !duration) return;

                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                  const percent = x / rect.width;
                  const time = percent * duration;
                  seekTo(time);
                }}
                onMouseDown={(e) => {
                  const audio = audioRef.current;
                  if (!audio || !duration) return;

                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                  const percent = x / rect.width;
                  const time = percent * duration;
                  seekTo(time);
                }}
              >
                {/* 재생 진행바 */}
                <div
                  className="absolute h-full bg-blue-500 rounded"
                  style={{ 
                    width: `${(currentTime / (duration || 1)) * 100}%`,
                    transition: 'width 0.1s linear'
                  }}
                />

                {/* 반복 구간 표시 */}
                {repeatState && (
                  <div
                    className="absolute h-full bg-yellow-300 opacity-30 z-10"
                    style={{
                      left: `${(repeatState.start / duration) * 100}%`,
                      width: repeatState.end !== null
                        ? `${((repeatState.end - repeatState.start) / duration) * 100}%`
                        : `${((currentTime - repeatState.start) / duration) * 100}%`
                    }}
                  />
                )}

                {/* 반복 구간 시간 표시 */}
                {repeatState && (
                  <div className="absolute -top-6 left-0 right-0 flex justify-between text-xs text-blue-500 z-20">
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

              {/* 컨트롤 버튼 */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  {renderTimeControls()}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={togglePlay}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    disabled={!isAudioReady}
                  >
                    {isPlaying ? (
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        일시정지
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        재생
                      </span>
                    )}
                  </button>
                  <div className="text-sm text-gray-500 ml-3">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 가사 목록 */}
          <div className="mb-6 space-y-2">
            {renderLyrics()}
          </div>

          {renderRepeatStatus()}

          <div className="flex justify-end space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              저장
            </button>
            <button
              onClick={onClose}
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
