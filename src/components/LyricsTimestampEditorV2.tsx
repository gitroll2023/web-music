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
  const audioRef = useRef<HTMLAudioElement>(null);
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

  const processLyrics = useCallback(() => {
    try {
      let lines = initialLyrics.split('\n')
        .filter(line => line.trim() !== '')
        .filter(line => !line.trim().startsWith('---'));

      // 첫 번째 라인에 [00:00.00] 공백 라인이 없으면 추가
      if (lines.length === 0 || (lines[0] !== '[00:00.00]' && lines[0] !== '[00:00.00] ')) {
        lines.unshift('[00:00.00]');
      }

      // 나머지 라인들에 대해 타임스탬프가 전혀 없는 경우 처리
      const hasAnyTimestamp = lines.slice(1).some(line => /^\[\d{2}:\d{2}\.\d{2}\]/.test(line));
      if (!hasAnyTimestamp) {
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
  }, [initialLyrics]);

  useEffect(() => {
    processLyrics();
  }, [processLyrics]);

  useEffect(() => {
    const initializeAudio = async () => {
      if (!songUrl) return;

      try {
        setIsLoading(true);
        const fileId = songUrl.split('id=')[1];
        if (!fileId) {
          throw new Error('유효하지 않은 Google Drive URL입니다.');
        }

        // 프록시 API를 통해 스트리밍
        const proxyUrl = `/api/proxy/${fileId}`;
        
        if (audioRef.current) {
          audioRef.current.src = proxyUrl;
          audioRef.current.preload = 'metadata';
          audioRef.current.load();
          
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

          audioRef.current.onerror = (e) => {
            console.error('Audio error:', e);
            const audio = audioRef.current as HTMLAudioElement;
            if (audio && audio.error) {
              console.error('Error code:', audio.error.code);
              console.error('Error message:', audio.error.message);
            }
            setError('오디오 파일을 로드하는 중 오류가 발생했습니다.');
            setIsLoading(false);
          };
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
        setError('오디오 초기화 중 오류가 발생했습니다.');
        setIsLoading(false);
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
    const audio = audioRef.current;
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
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(audio.currentTime + seconds, audio.duration));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    
    const newCurrentLine = findCurrentLine(newTime);
    if (newCurrentLine !== -1) {
      setCurrentLine(newCurrentLine);
    }
  };

  const seekTo = async (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      const wasPlaying = !audio.paused;
      if (wasPlaying) {
        await audio.pause();
      }

      audio.currentTime = Math.max(0, Math.min(time, audio.duration));
      setCurrentTime(time);
      
      const newCurrentLine = findCurrentLine(time);
      if (newCurrentLine !== -1) {
        setCurrentLine(newCurrentLine);
      }

      if (wasPlaying) {
        try {
          await audio.play();
        } catch (playError) {
          if (playError instanceof Error && playError.name === 'AbortError') {
            // AbortError는 무시
            return;
          }
          throw playError;
        }
      }
    } catch (error) {
      console.error('Seeking error:', error);
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
        break;
    }
  }, [editingIndex, currentTime, currentLine, lyrics, timestamps, modifiedLines, isPlaying, repeatState]);

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
    const audio = audioRef.current;
    if (!audio) return;

    if (!repeatState) {
      setRepeatState({
        start: audio.currentTime,
        end: null,
        active: false
      });
    } else if (repeatState.end === null) {
      const end = audio.currentTime;
      const start = repeatState.start;
      
      setRepeatState({
        start: Math.min(start, end),
        end: Math.max(start, end),
        active: false 
      });
    } else {
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
      const lyricsText = lyrics.join('\n');
      
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
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        if (repeatState && repeatState.end !== null && !repeatState.active) {
          const newRepeatState = {
            start: repeatState.start,
            end: repeatState.end,
            active: true
          };
          setRepeatState(newRepeatState);
          audio.currentTime = newRepeatState.start;
        }
        await audio.play();
        setIsPlaying(true);
      } else {
        await audio.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // AbortError는 무시
        return;
      }
      console.error('Playback error:', error);
      setError('재생 중 오류가 발생했습니다.');
    }
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
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">✕</button>
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
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                  setIsPlaying(false);
                }}
              />

              <div 
                className="relative h-2 bg-gray-200 rounded cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percent = x / rect.width;
                  const time = percent * duration;
                  seekTo(time);
                }}
              >
                <div
                  className="absolute h-full bg-blue-500 rounded"
                  style={{ 
                    width: `${(currentTime / duration) * 100}%`
                  }}
                />

                {repeatState && (
                  <div
                    className="absolute h-full bg-yellow-300 opacity-30 z-10"
                    style={{
                      left: `${(repeatState.start / duration) * 100}%`,
                      width: `${((repeatState.end || currentTime) - repeatState.start) / duration * 100}%`
                    }}
                  />
                )}

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

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  {renderTimeControls()}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={togglePlay}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {isPlaying ? '일시정지' : '재생'}
                  </button>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {formatTime(currentTime)} / {formatTime(duration)}
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
          </div>
          <div className="flex items-center space-x-2">
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
