'use client';

import { useState, useRef } from 'react';
import type { SongWithChapter } from '@/types';
import { getProxiedImageUrl } from '@/utils/imageUtils';
import Image from 'next/image';
import { TrashIcon, ArrowsUpDownIcon } from '@heroicons/react/24/solid';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface PlaylistManagerProps {
  currentSong: SongWithChapter | null;
  playlist: SongWithChapter[];
  onSongSelectAction: (song: SongWithChapter) => void;
  onRemoveSongAction: (songs: SongWithChapter[]) => void;
  isDarkMode: boolean;
  isAudioReady: boolean;
  onReorderPlaylistAction: (result: DropResult) => void;
}

export default function PlaylistManager({ 
  currentSong, 
  playlist, 
  onSongSelectAction,
  onRemoveSongAction,
  isDarkMode,
  isAudioReady,
  onReorderPlaylistAction
}: PlaylistManagerProps) {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const swipeThreshold = 100;
  const longPressThreshold = 500;
  const [swipingItemId, setSwipingItemId] = useState<string | null>(null);
  const [isTouchMoved, setIsTouchMoved] = useState(false);

  const handleTouchStart = (e: React.TouchEvent, song: SongWithChapter) => {
    if (isReorderMode) return;
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    setIsTouchMoved(false);

    // 롱프레스 타이머 시작
    longPressTimer.current = setTimeout(() => {
      if (!isTouchMoved) {
        setIsSelectMode(true);
        setSelectedSongs(new Set([song.id.toString()]));
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
    }, longPressThreshold);
  };

  const handleTouchMove = (e: React.TouchEvent, song: SongWithChapter) => {
    if (isReorderMode) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;

    // 터치가 이동했다고 표시
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      setIsTouchMoved(true);
      
      // 롱프레스 타이머 취소
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    if (!isSelectMode && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      
      if (deltaX < 0) {
        setSwipingItemId(song.id.toString());
      } else {
        setSwipingItemId(null);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, song: SongWithChapter) => {
    if (isReorderMode) return;

    // 롱프레스 타이머 취소
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;

    if (isSelectMode) {
      if (!isTouchMoved) {
        // 선택 모드에서 탭으로 선택/해제
        setSelectedSongs(prev => {
          const next = new Set(prev);
          if (next.has(song.id.toString())) {
            next.delete(song.id.toString());
          } else {
            next.add(song.id.toString());
          }
          return next;
        });
      }
    } else if (!isTouchMoved) {
      // 움직이지 않은 터치는 곡 재생
      onSongSelectAction(song);
    } else if (deltaX < -swipeThreshold) {
      // 왼쪽으로 스와이프하여 삭제
      onRemoveSongAction([song]);
    }

    setSwipingItemId(null);
    setIsTouchMoved(false);
  };

  const handleDeleteSelected = () => {
    if (selectedSongs.size > 0) {
      const songsToRemove = playlist.filter(song => selectedSongs.has(song.id.toString()));
      onRemoveSongAction(songsToRemove);
      setSelectedSongs(new Set());
      setIsSelectMode(false);
    }
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedSongs(new Set());
  };

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className={`sticky top-0 z-10 p-2 border-b ${
        isDarkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          {isSelectMode ? (
            <>
              <button
                onClick={exitSelectMode}
                className={`p-3 rounded-full transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="text-sm">취소</span>
              </button>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedSongs.size}곡 선택됨
              </span>
              <button
                onClick={handleDeleteSelected}
                className={`p-3 rounded-full transition-colors ${
                  isDarkMode
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-red-600 hover:text-red-500'
                }`}
              >
                <TrashIcon className="w-6 h-6" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsReorderMode(!isReorderMode)}
                className={`p-3 rounded-full transition-colors ${
                  isReorderMode
                    ? 'text-blue-500 bg-blue-500/10'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowsUpDownIcon className="w-6 h-6" />
              </button>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {isReorderMode ? '드래그하여 순서 변경' : '길게 눌러서 여러 곡 선택'}
              </span>
            </>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onReorderPlaylistAction}>
        <Droppable droppableId="playlist">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 overflow-y-auto"
            >
              <div className="space-y-1">
                {playlist.map((song, index) => (
                  <Draggable
                    key={`${song.id}-${index}`}
                    draggableId={`${song.id}-${index}`}
                    index={index}
                    isDragDisabled={!isReorderMode}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`group relative flex items-center p-3 select-none touch-manipulation overflow-hidden ${
                          snapshot.isDragging
                            ? isDarkMode
                              ? 'bg-gray-800 shadow-lg'
                              : 'bg-gray-100 shadow-lg'
                            : selectedSongs.has(song.id.toString())
                              ? isDarkMode
                                ? 'bg-blue-500/20'
                                : 'bg-blue-50'
                              : currentSong?.id === song.id 
                                ? isDarkMode 
                                  ? 'bg-gray-800' 
                                  : 'bg-gray-100'
                                : isDarkMode
                                  ? 'hover:bg-gray-800/50'
                                  : 'hover:bg-gray-50'
                        }`}
                        onTouchStart={(e) => handleTouchStart(e, song)}
                        onTouchMove={(e) => handleTouchMove(e, song)}
                        onTouchEnd={(e) => handleTouchEnd(e, song)}
                      >
                        {/* 삭제 배경 */}
                        {!isSelectMode && (
                          <div 
                            className={`absolute inset-0 right-0 bg-red-500 transition-opacity ${
                              swipingItemId === song.id.toString() ? 'opacity-100' : 'opacity-0'
                            }`}
                          >
                            <div className="absolute right-4 inset-y-0 flex items-center">
                              <TrashIcon className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        )}

                        <div className={`flex items-center gap-4 flex-1 min-w-0 transition-transform ${
                          swipingItemId === song.id.toString() && !isSelectMode ? '-translate-x-20' : 'translate-x-0'
                        }`}>
                          <div className="relative w-12 h-12 flex-shrink-0">
                            {song.imageUrl ? (
                              <div className="relative">
                                <Image
                                  src={getProxiedImageUrl(song.imageUrl)}
                                  alt={song.title}
                                  width={48}
                                  height={48}
                                  className={`rounded object-cover ${
                                    currentSong?.id === song.id
                                      ? 'animate-pulse'
                                      : ''
                                  }`}
                                />
                                {currentSong?.id === song.id && (
                                  <div className="absolute inset-0 bg-blue-500/10 rounded animate-pulse" />
                                )}
                              </div>
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center rounded ${
                                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                              } ${
                                currentSong?.id === song.id
                                  ? 'animate-pulse'
                                  : ''
                              }`}>
                                <span className="text-xl">🎵</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium truncate text-base ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            } ${currentSong?.id === song.id ? 'text-blue-500' : ''}`}>
                              {song.title}
                            </h3>
                            <p className={`text-sm truncate ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {song.artist || '알 수 없는 아티스트'}
                            </p>
                          </div>
                          <span className={`w-8 text-center text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {playlist.length === 0 && (
        <div className={`flex flex-col items-center justify-center flex-1 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p className="text-lg">플레이리스트가 비어있습니다</p>
          <p className="text-sm mt-1">곡을 추가해보세요</p>
        </div>
      )}
    </div>
  );
}