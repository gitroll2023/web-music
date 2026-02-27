'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import CachedImage from './CachedImage';
import { getLocalFileUrl } from '@/utils/fileUtils';
import type { SongWithChapter } from '@/types';

interface PlaylistManagerProps {
  isVisible: boolean;
  onClose: () => void;
  songs: SongWithChapter[];
  currentSong: SongWithChapter | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSelectSong: (song: SongWithChapter) => void;
  onMoveSong?: (fromIndex: number, toIndex: number) => void;
  onDeleteSongs?: (songIds: (string | number)[]) => void;
}

export default function PlaylistManager({
  isVisible,
  onClose,
  songs,
  currentSong,
  isPlaying,
  onPlayPause,
  onSelectSong,
  onMoveSong,
  onDeleteSongs
}: PlaylistManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSongs, setFilteredSongs] = useState<SongWithChapter[]>(songs);
  const [reorderEnabled, setReorderEnabled] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);
  const [reorderedSongs, setReorderedSongs] = useState<SongWithChapter[]>(songs);
  
  const controls = useDragControls();

  // 검색어에 따라 노래 필터링
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSongs(reorderedSongs);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = reorderedSongs.filter(
        song => 
          song.title.toLowerCase().includes(term) || 
          (song.artist && song.artist.toLowerCase().includes(term))
      );
      setFilteredSongs(filtered);
    }
  }, [searchTerm, reorderedSongs]);

  // songs prop이 변경될 때 reorderedSongs 업데이트
  useEffect(() => {
    console.log('Songs prop 변경됨:', songs?.length);
    if (songs && Array.isArray(songs)) {
      setReorderedSongs(songs);
      
      // 검색어가 비어있을 때만 필터링된 목록도 업데이트
      if (searchTerm.trim() === '') {
        setFilteredSongs(songs);
      } else {
        // 검색어가 있으면 새로운 songs로 필터링 다시 수행
        const term = searchTerm.toLowerCase();
        const filtered = songs.filter(
          song => 
            song.title.toLowerCase().includes(term) || 
            (song.artist && song.artist.toLowerCase().includes(term))
        );
        setFilteredSongs(filtered);
      }
    }
  }, [songs, searchTerm]);

  // 재정렬 변경 시 처리
  const handleReorder = (newOrder: SongWithChapter[]) => {
    setReorderedSongs(newOrder);
    // 부모 컴포넌트에 변경 사항 알림
    if (onMoveSong) {
      // 이전 순서의 인덱스와 새 순서의 인덱스를 찾아 전달
      const songIds = songs.map(song => song.id);
      const reorderedIds = newOrder.map(song => song.id);
      
      // 변경된 항목 찾기
      for (let i = 0; i < songIds.length; i++) {
        if (songIds[i] !== reorderedIds[i]) {
          // 변경된 항목을 찾았으면, 원래 위치와 새 위치 확인
          const movedSongId = reorderedIds[i];
          const originalIndex = songIds.indexOf(movedSongId);
          onMoveSong(originalIndex, i);
          break;
        }
      }
    }
  };

  // 선택한 항목 토글
  const toggleItemSelection = (id: string | number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };
  
  // 전체 선택/해제 토글
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredSongs.length) {
      // 모든 항목이 선택되어 있으면 선택 해제
      setSelectedItems([]);
      console.log('[디버그] 모든 항목 선택 해제');
    } else {
      // 모든 항목 선택
      const allIds = filteredSongs.map(song => song.id);
      setSelectedItems(allIds);
      console.log('[디버그] 모든 항목 선택:', allIds.length, '곡');
    }
  };

  // 선택한 항목 삭제
  const deleteSelectedItems = () => {
    // 선택된 항목이 없으면 아무 작업도 하지 않음
    if (selectedItems.length === 0) return;
    
    console.log('재생목록에서 삭제할 항목:', selectedItems);
    
    // 부모 컴포넌트에 삭제 요청 전달
    if (onDeleteSongs) {
      onDeleteSongs(selectedItems);
    }
    
    // 삭제 모드 종료 및 선택 항목 초기화
    setSelectedItems([]);
    setIsDeleteMode(false);
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black z-[300] overflow-hidden"
      initial={{ x: '100%' }}
      animate={{ x: isVisible ? 0 : '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div className="h-full flex flex-col bg-gradient-to-b from-[#2C7C98]/20 to-black/95">
        {/* 헤더 영역 */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold">재생목록</h2>
          <div className="flex items-center space-x-2">
            {isDeleteMode ? (
              <>
                <button 
                  onClick={toggleSelectAll}
                  className="px-3 py-1 rounded-full bg-[#2C7C98] text-white text-sm"
                >
                  {selectedItems.length === filteredSongs.length ? '전체 해제' : '전체 선택'}
                </button>
                <button 
                  onClick={deleteSelectedItems}
                  disabled={selectedItems.length === 0}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedItems.length > 0 
                      ? 'bg-[#256E8C] text-white' 
                      : 'bg-gray-700 text-white/50'
                  }`}
                >
                  삭제 ({selectedItems.length})
                </button>
                <button 
                  onClick={() => {
                    setIsDeleteMode(false);
                    setSelectedItems([]);
                  }}
                  className="px-3 py-1 rounded-full bg-white/10 text-white text-sm"
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setReorderEnabled(!reorderEnabled)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    reorderEnabled ? 'bg-[#2C7C98]' : 'bg-white/10'
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
                <button 
                  onClick={() => setIsDeleteMode(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 검색 영역 */}
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="노래 또는 아티스트 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 rounded-full py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-white/30"
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60"
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 현재 재생 중인 곡 */}
        {currentSong && (
          <div className="px-4 py-4 mb-2 bg-gradient-to-r from-[#2C7C98]/50 to-[#256E8C]/70 rounded-lg mx-4">
            <div className="text-sm text-white/80 mb-3 font-medium">현재 재생 중</div>
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-lg overflow-hidden mr-3 flex-shrink-0 shadow-lg">
                <CachedImage
                  src={getLocalFileUrl(currentSong.fileName, 'image')}
                  alt={currentSong.title}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="text-base font-medium truncate text-white">{currentSong.title}</h4>
                <p className="text-sm text-white/60 truncate">{currentSong.artist}</p>
              </div>
              <button 
                onClick={onPlayPause}
                className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center ml-2 hover:bg-white/30 transition-colors"
              >
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 재생목록 */}
        <div className="flex-grow overflow-y-auto px-4">
          <div className="py-2 text-sm font-medium text-white/70">재생목록 ({filteredSongs.length}곡)</div>
          
          {filteredSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <svg className="w-16 h-16 text-white/30 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
              <p className="text-white/50 text-lg font-medium mb-2">재생목록이 비어있습니다</p>
              <p className="text-white/40 text-sm max-w-xs">
                메인 페이지에서 곡을 선택하여 재생목록에 추가해보세요.
              </p>
            </div>
          ) : reorderEnabled ? (
            <Reorder.Group 
              as="div" 
              axis="y" 
              values={filteredSongs} 
              onReorder={handleReorder}
              className="space-y-1"
            >
              {filteredSongs.map((song) => (
                <Reorder.Item
                  key={song.id}
                  value={song}
                  dragControls={controls}
                  className={`flex items-center p-3 rounded-lg ${
                    currentSong?.id === song.id ? 'bg-white/10' : 'hover:bg-white/5'
                  } transition-colors`}
                >
                  <div className="w-4 h-8 flex items-center justify-center mr-2 cursor-grab">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/50">
                      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                    </svg>
                  </div>
                  <div 
                    className="w-10 h-10 rounded overflow-hidden mr-3 flex-shrink-0 cursor-pointer"
                    onClick={() => onSelectSong(song)}
                  >
                    <CachedImage
                      src={getLocalFileUrl(song.fileName, 'image')}
                      alt={song.title}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div 
                    className="flex-grow min-w-0 cursor-pointer"
                    onClick={() => onSelectSong(song)}
                  >
                    <h4 className={`text-sm font-medium truncate ${
                      currentSong?.id === song.id ? 'text-white' : 'text-white/80'
                    }`}>
                      {song.title}
                    </h4>
                    <p className="text-xs text-white/60 truncate">{song.artist}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentSong?.id === song.id && isPlaying && (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <span className="text-white/80 text-xs">▶</span>
                      </div>
                    )}
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : isDeleteMode ? (
            <div className="space-y-1">
              {/* 삭제 모드 상단 정보 */}
              <div className="mb-3 p-2 bg-[#2C7C98]/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="text-white text-sm">
                    전체 <span className="font-bold">{filteredSongs.length}</span>곡 중 <span className="font-bold text-[#78D8F5]">{selectedItems.length}</span>곡 선택됨
                  </div>
                  <button 
                    onClick={toggleSelectAll}
                    className="px-3 py-1 rounded-full text-xs bg-[#2C7C98]/80 text-white hover:bg-[#2C7C98]"
                  >
                    {selectedItems.length === filteredSongs.length ? '전체 해제' : '전체 선택'}
                  </button>
                </div>
              </div>
              
              {filteredSongs.map((song) => (
                <div 
                  key={song.id}
                  className={`flex items-center p-3 rounded-lg ${
                    selectedItems.includes(song.id) ? 'bg-[#2C7C98]/30' : 'hover:bg-white/5'
                  } transition-colors`}
                  onClick={() => toggleItemSelection(song.id)}
                >
                  <div className="w-6 h-6 mr-2 flex items-center justify-center">
                    <div className={`w-5 h-5 rounded-sm border ${
                      selectedItems.includes(song.id) 
                        ? 'border-[#2C7C98] bg-[#2C7C98]' 
                        : 'border-white/30'
                    } flex items-center justify-center`}>
                      {selectedItems.includes(song.id) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded overflow-hidden mr-3 flex-shrink-0">
                    <CachedImage
                      src={getLocalFileUrl(song.fileName, 'image')}
                      alt={song.title}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className={`text-sm font-medium truncate ${
                      currentSong?.id === song.id ? 'text-white' : 'text-white/80'
                    }`}>
                      {song.title}
                    </h4>
                    <p className="text-xs text-white/60 truncate">{song.artist}</p>
                  </div>
                  {currentSong?.id === song.id && isPlaying && (
                    <div className="w-6 h-6 flex items-center justify-center">
                      <span className="text-white/80 text-xs">▶</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredSongs.map((song) => (
                <div 
                  key={song.id}
                  className={`flex items-center p-3 rounded-lg ${
                    currentSong?.id === song.id ? 'bg-white/10' : 'hover:bg-white/5'
                  } transition-colors`}
                >
                  <div 
                    className="w-10 h-10 rounded overflow-hidden mr-3 flex-shrink-0 cursor-pointer"
                    onClick={() => onSelectSong(song)}
                  >
                    <CachedImage
                      src={getLocalFileUrl(song.fileName, 'image')}
                      alt={song.title}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div 
                    className="flex-grow min-w-0 cursor-pointer"
                    onClick={() => onSelectSong(song)}
                  >
                    <h4 className={`text-sm font-medium truncate ${
                      currentSong?.id === song.id ? 'text-white' : 'text-white/80'
                    }`}>
                      {song.title}
                    </h4>
                    <p className="text-xs text-white/60 truncate">{song.artist}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentSong?.id === song.id && isPlaying && (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <span className="text-white/80 text-xs">▶</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}