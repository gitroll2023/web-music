'use client';

import { useState, useEffect, useMemo } from 'react';

interface LyricLine {
  text: string;
  time: number; // 초 단위 시간
}

interface LyricsProps {
  lyrics?: string;
  isVisible: boolean;
  onCloseAction: () => void;
  title?: string;
  isDarkMode: boolean;
  currentTime?: number; // 현재 재생 시간 (초)
  onSeek?: (time: number) => void; // 특정 시간으로 이동
}

export default function Lyrics({ lyrics, isVisible, onCloseAction, title, isDarkMode, currentTime = 0, onSeek }: LyricsProps) {
  const [fontSize, setFontSize] = useState<number>(20); // 기본 폰트 크기 20px
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [activeLine, setActiveLine] = useState<number>(-1);
  const [autoScroll, setAutoScroll] = useState<boolean>(true); // 자동 추적 토글
  
  // 창 크기 변경 감지
  useEffect(() => {
    // 클라이언트 측에서만 실행
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // 창 크기에 따라 기본 폰트 크기 조정
  useEffect(() => {
    if (windowWidth > 0) {
      if (windowWidth >= 1024) { // 데스크톱
        setFontSize(20);
      } else if (windowWidth >= 768) { // 태블릿
        setFontSize(20);
      } else { // 모바일
        setFontSize(20);
      }
    }
  }, [windowWidth]);

  // 가사 파싱
  const parsedLyrics = useMemo(() => {
    if (!lyrics) return { lines: [], stanzas: [] };

    // 타임스탬프 정규식
    const timestampRegex = /\[(\d{2}):(\d{2})\.(\d{2})\]/;
    
    // 각 줄을 파싱
    const lines: LyricLine[] = [];
    const rawLines = lyrics.split('\n');
    
    rawLines.forEach(line => {
      const match = line.match(timestampRegex);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const centiseconds = parseInt(match[3]);
        const timeInSeconds = minutes * 60 + seconds + centiseconds / 100;
        
        // 타임스탬프 제거한 텍스트
        const text = line.replace(timestampRegex, '').trim();
        
        if (text) { // 빈 줄이 아닌 경우만 추가
          lines.push({
            text,
            time: timeInSeconds
          });
        }
      } else if (line.trim()) {
        // 타임스탬프 없는 일반 텍스트 줄
        lines.push({
          text: line,
          time: -1 // 타임스탬프 없는 줄은 -1로 표시
        });
      }
    });
    
    // 스탠자(문단) 분리
    const stanzas: LyricLine[][] = [];
    let currentStanza: LyricLine[] = [];
    
    lines.forEach(line => {
      if (line.text.trim()) {
        currentStanza.push(line);
      } else if (currentStanza.length > 0) {
        stanzas.push([...currentStanza]);
        currentStanza = [];
      }
    });
    
    // 마지막 스탠자 추가
    if (currentStanza.length > 0) {
      stanzas.push(currentStanza);
    }
    
    return { lines, stanzas };
  }, [lyrics]);
  
  // 현재 시간에 따른 활성 줄 업데이트
  useEffect(() => {
    if (!parsedLyrics.lines.length || currentTime === undefined) return;
    
    // 현재 시간에 맞는 가사 줄 찾기
    let newActiveLine = -1;
    
    for (let i = parsedLyrics.lines.length - 1; i >= 0; i--) {
      if (parsedLyrics.lines[i].time <= currentTime && parsedLyrics.lines[i].time !== -1) {
        newActiveLine = i;
        break;
      }
    }
    
    setActiveLine(newActiveLine);
    
    // 자동 추적이 켜져 있을 때만 해당 줄로 스크롤
    if (autoScroll && newActiveLine !== -1) {
      const activeElement = document.getElementById(`lyric-line-${newActiveLine}`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, parsedLyrics.lines, autoScroll]);

  if (!isVisible) return null;

  return (
    <div className={`
      fixed inset-0 bottom-[144px] sm:bottom-[144px] md:bottom-[120px]
      z-[200]
      bg-gradient-to-br from-black via-black to-black
      ${isDarkMode ? 'text-white' : 'text-gray-900'}
      overflow-y-auto
      transition-all duration-300
      ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `}>
      <div 
        className="absolute inset-0 overflow-auto p-4 pt-12 sm:pt-16 px-4 sm:px-8 md:px-12 lg:px-16"
        onClick={e => e.stopPropagation()}
      >
        {/* 폰트 크기 조절 + 자동추적 버튼 그룹 */}
        <div className="fixed top-3 sm:top-4 left-3 sm:left-4 flex items-center gap-1 sm:gap-2 bg-black/50 backdrop-blur-sm rounded-full p-1 z-10">
          <button
            onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
            className="p-1.5 sm:p-2 rounded-full text-white/60 hover:text-white"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-xs sm:text-sm text-white/60">{fontSize}px</span>
          <button
            onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
            className="p-1.5 sm:p-2 rounded-full text-white/60 hover:text-white"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="w-px h-5 bg-white/20 mx-1"></div>
          <button
            onClick={() => setAutoScroll(prev => !prev)}
            className={`p-1.5 sm:p-2 rounded-full transition-colors ${autoScroll ? 'text-white bg-white/20' : 'text-white/40 hover:text-white/60'}`}
            title={autoScroll ? '자동추적 끄기' : '자동추적 켜기'}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onCloseAction}
          className="fixed top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 text-white/60 hover:text-white bg-black/50 backdrop-blur-sm rounded-full z-10"
        >
          <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
          </svg>
        </button>

        <div className="max-w-3xl mx-auto pt-8 sm:pt-10">
          {title && (
            <h2 className="text-white/80 text-base sm:text-lg md:text-xl font-medium mb-4 sm:mb-6 text-center">
              {title}
            </h2>
          )}
          {lyrics ? (
            <div 
              className="text-white/80 space-y-6 sm:space-y-8 text-center leading-relaxed"
              style={{ fontSize: `${fontSize}px` }}
            >
              {parsedLyrics.stanzas.map((stanza, stanzaIndex) => (
                <div key={stanzaIndex} className="space-y-1">
                  {stanza.map((line, lineIndex) => {
                    // 원본 배열에서의 인덱스 찾기
                    const originalIndex = parsedLyrics.lines.findIndex(l => 
                      l.text === line.text && l.time === line.time);
                    
                    const hasTimestamp = line.time !== -1;

                    return (
                      <div
                        key={lineIndex}
                        id={`lyric-line-${originalIndex}`}
                        className={`block px-2 sm:px-4 break-words whitespace-pre-wrap py-1 transition-all duration-300 ${
                          originalIndex === activeLine
                            ? 'text-white font-medium bg-white/10 rounded-lg scale-105 transform'
                            : 'text-white/40'
                        } ${hasTimestamp && onSeek ? 'cursor-pointer hover:text-white/70 active:scale-95' : ''}`}
                        style={{
                          fontSize: originalIndex === activeLine ? `${fontSize}px` : `${fontSize - 2}px`
                        }}
                        onClick={() => {
                          if (hasTimestamp && onSeek) {
                            onSeek(line.time);
                          }
                        }}
                      >
                        {line.text || '\u00A0'}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white/40 text-center text-base sm:text-lg md:text-xl">
              가사가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 