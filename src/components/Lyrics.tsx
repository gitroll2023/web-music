'use client';

import { useState } from 'react';

interface LyricsProps {
  lyrics?: string;
  isVisible: boolean;
  onCloseAction: () => void;
  title?: string;
  isDarkMode: boolean;
}

export default function Lyrics({ lyrics, isVisible, onCloseAction, title, isDarkMode }: LyricsProps) {
  const [fontSize, setFontSize] = useState<number>(18); // 기본 폰트 크기 18px

  if (!isVisible) return null;

  return (
    <div className={`
      fixed inset-0 bottom-[144px]
      z-[200]
      bg-gradient-to-br from-black via-black to-black
      ${isDarkMode ? 'text-white' : 'text-gray-900'}
      overflow-y-auto
      transition-all duration-300
      ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `}>
      <div 
        className="absolute inset-0 overflow-auto p-4 pt-16 px-8 sm:px-12 md:px-16"
        onClick={e => e.stopPropagation()}
      >
        {/* 폰트 크기 조절 버튼 */}
        <div className="fixed top-4 left-4 flex items-center gap-2">
          <button
            onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
            className="p-2 rounded-full text-white/60 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
            className="p-2 rounded-full text-white/60 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onCloseAction}
          className="fixed top-4 right-4 text-white/60 hover:text-white"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
          </svg>
        </button>

        <div className="max-w-3xl mx-auto">
          {title && (
            <h2 className="text-white/80 text-lg font-medium mb-6 text-center">{title}</h2>
          )}
          {lyrics ? (
            <div 
              className="text-white/80 space-y-8 text-center leading-relaxed"
              style={{ fontSize: `${fontSize}px` }}
            >
              {lyrics.split('\n\n').map((stanza, index) => (
                <p key={index} className="space-y-1">
                  {stanza.split('\n').map((line, lineIndex) => (
                    <span key={lineIndex} className="block px-4 break-words whitespace-pre-wrap">
                      {line || '\u00A0'}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          ) : (
            <div className="text-white/40 text-center">
              가사가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 