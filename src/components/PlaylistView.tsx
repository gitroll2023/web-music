'use client';

import { useState, useEffect } from 'react';
import { QueueListIcon, ArrowPathIcon, MusicalNoteIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { SongWithChapter } from '@/types';
import CachedImage from './CachedImage';
import { getLocalFileUrl } from '@/utils/fileUtils';
import { Tab } from '@headlessui/react';

interface PlaylistViewProps {
  playlist: SongWithChapter[];
  allSongs?: SongWithChapter[]; // 모든 음원 목록
  currentSong: SongWithChapter | null;
  onSongSelect: (song: SongWithChapter) => void;
  onSongSelectAndPlay?: (song: SongWithChapter) => void; // 선택 및 재생 시작 함수
  onRemoveSong?: (songs: SongWithChapter[]) => void;
  onShufflePlaylist?: () => void;
  onRepeatModeChange?: () => void;
  onReorderPlaylist?: any;
  onAddToPlaylist?: (song: SongWithChapter) => void; // 재생목록에 추가하는 함수
  isDarkMode: boolean;
  isAudioReady?: boolean;
}

const PlaylistView = ({
  playlist,
  allSongs = [],
  currentSong,
  onSongSelect,
  onSongSelectAndPlay,
  onRemoveSong,
  onShufflePlaylist,
  onRepeatModeChange,
  onReorderPlaylist,
  onAddToPlaylist,
  isDarkMode,
  isAudioReady = false
}: PlaylistViewProps) => {
  const [selectedSongs, setSelectedSongs] = useState<Set<string | number>>(new Set());
  
  // 한 곡 선택/해제 토글
  const toggleSelectSong = (songId: string | number) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongs(newSelected);
    console.log('[디버그] 선택된 곡 수:', newSelected.size);
  };

  // 전체 선택/해제 토글
  const toggleSelectAllSongs = () => {
    if (selectedSongs.size === playlist.length) {
      // 모든 곡이 이미 선택되어 있으면 선택 해제
      setSelectedSongs(new Set());
      console.log('[디버그] 모든 곡 선택 해제');
    } else {
      // 모든 곡 선택
      const allSongIds = playlist.map(song => song.id);
      setSelectedSongs(new Set(allSongIds));
      console.log('[디버그] 모든 곡 선택:', allSongIds.length, '곡');
    }
  };

  const handleRemoveSelected = () => {
    if (!onRemoveSong) return;
    if (selectedSongs.size === 0) return;
    
    console.log('[디버그] 선택된 곡 삭제 시도:', selectedSongs.size, '곡');
    
    // 전체 선택인 경우 (모든 곡 삭제)
    if (selectedSongs.size === playlist.length) {
      console.log('[디버그] 전체 선택 상태에서 삭제 - 재생목록 초기화');
      
      // 로컬 스토리지에서 재생목록 제거
      try {
        localStorage.removeItem('userPlaylist');
        console.log('[디버그] 로컬 스토리지에서 재생목록 삭제 완료');
      } catch (err) {
        console.error('[디버그] 로컬 스토리지 삭제 오류:', err);
      }
    }
    
    const songsToRemove = playlist.filter(song => selectedSongs.has(song.id));
    onRemoveSong(songsToRemove);
    setSelectedSongs(new Set());
  };

  return (
    <div className="h-full flex flex-col bg-opacity-50 backdrop-blur-lg">
      <div className={`sticky top-0 z-10 px-4 py-3 ${
        isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'
      } border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <QueueListIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              음악
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {selectedSongs.size > 0 ? (
              <>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {selectedSongs.size}곡 선택됨
                </span>
                <button
                  onClick={() => setSelectedSongs(new Set())}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  선택 취소
                </button>
                <button
                  onClick={handleRemoveSelected}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  <TrashIcon className="w-4 h-4" />
                  삭제
                </button>
              </>
            ) : (
              <>
                {onShufflePlaylist && (
                  <button
                    className={`p-2 rounded-full ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                    } transition-colors`}
                    onClick={onShufflePlaylist}
                    title="재생목록 섞기"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                  </button>
                )}
                {onRepeatModeChange && (
                  <button
                    className={`p-2 rounded-full ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                    } transition-colors`}
                    onClick={onRepeatModeChange}
                    title="반복 모드 변경"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                      />
                    </svg>
                  </button>
                )}
                {/* 재생목록 초기화 버튼 */}
                {onRemoveSong && (
                  <button
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                      isDarkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'
                    } transition-colors`}
                    onClick={() => {
                      if (window.confirm('재생목록을 모두 초기화하시겠습니까?')) {
                        console.log('[디버그] 재생목록 초기화');
                        
                        try {
                          // 먼저 로컬 스토리지에서 재생목록 제거
                          localStorage.removeItem('userPlaylist');
                          console.log('[디버그] 로컬 스토리지에서 재생목록 삭제 완료');
                          
                          // 모든 곡 제거 - 전체 playlist 배열을 전달하여 제거
                          if (onRemoveSong && playlist.length > 0) {
                            console.log('[디버그] 재생목록에서 모든 곡 제거 시도:', playlist.length, '곡');
                            onRemoveSong(playlist);
                          }
                          
                          // 작업 완료 메시지
                          alert('재생목록이 초기화되었습니다.');
                        } catch (error) {
                          console.error('[디버그] 재생목록 초기화 중 오류:', error);
                          alert('재생목록 초기화 중 오류가 발생했습니다.');
                        }
                      }
                    }}
                    title="재생목록 초기화"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>전체 삭제</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Tab.Group>
        <Tab.List className={`px-4 py-2 flex space-x-1 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <Tab
            className={({ selected }) =>
              `px-4 py-2 text-sm font-medium rounded-t-lg ${
                selected
                  ? isDarkMode
                    ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                    : 'bg-gray-100 text-gray-900 border-b-2 border-blue-500'
                  : isDarkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            내 재생목록 ({playlist.length})
          </Tab>
          <Tab
            className={({ selected }) =>
              `px-4 py-2 text-sm font-medium rounded-t-lg ${
                selected
                  ? isDarkMode
                    ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                    : 'bg-gray-100 text-gray-900 border-b-2 border-blue-500'
                  : isDarkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            전체 음악 ({allSongs.length})
          </Tab>
        </Tab.List>
        
        <Tab.Panels className="flex-1 overflow-auto">
          {/* 재생목록 탭 */}
          <Tab.Panel className="h-full overflow-y-auto pb-48">
            {playlist.length === 0 ? (
              <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <MusicalNoteIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">재생목록이 비어 있습니다</p>
                <p className="mt-2 text-sm">'전체 음악' 탭에서 음악을 재생목록에 추가해보세요</p>
              </div>
            ) : (
              <>
                {/* 재생목록 전체선택 헤더 - 더 크고 눈에 띄게 */}
                <div className={`sticky top-0 p-3 flex items-center justify-between ${
                  isDarkMode ? 'bg-gray-800/90' : 'bg-gray-100/95'
                } shadow-sm border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center">
                    <button
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        selectedSongs.size === playlist.length 
                          ? isDarkMode 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-blue-500 text-white' 
                          : isDarkMode 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } transition-colors`}
                      onClick={toggleSelectAllSongs}
                      title={selectedSongs.size === playlist.length ? "전체 선택 해제" : "전체 선택"}
                    >
                      {selectedSongs.size === playlist.length ? (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>전체 선택 해제</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 12h16M12 4v16" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>전체 선택</span>
                        </>
                      )}
                    </button>
                    
                    {selectedSongs.size > 0 && (
                      <span className={`ml-3 text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {`${selectedSongs.size}/${playlist.length}곡 선택됨`}
                      </span>
                    )}
                  </div>
                  
                  {selectedSongs.size > 0 && (
                    <button
                      onClick={handleRemoveSelected}
                      className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDarkMode 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      <TrashIcon className="w-5 h-5" />
                      선택 항목 삭제
                    </button>
                  )}
                </div>
                
                {/* 재생목록 곡 목록 */}
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {playlist.map((song) => (
                    <div 
                      key={song.id}
                      className={`flex items-center p-3 ${
                        currentSong?.id === song.id 
                        ? isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50' 
                        : ''
                      }`}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="relative w-12 h-12 mr-3 flex-shrink-0 rounded overflow-hidden">
                          <CachedImage
                            src={getLocalFileUrl(song.fileName, 'image')}
                            alt={song.title}
                            width={48}
                            height={48}
                            className="object-cover h-full w-full"
                          />
                          {currentSong?.id === song.id && (
                            <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-40`}>
                              {isAudioReady && (
                                <div className="w-3 h-3 rounded-full bg-white"></div>
                              )}
                            </div>
                          )}
                        </div>
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            console.log('[디버그] 재생목록에서 곡 선택:', song.title);
                            onSongSelect(song);
                          }}
                        >
                          <h3 className={`text-sm font-medium truncate ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {song.title}
                          </h3>
                          <p className={`text-xs truncate ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {song.artist || '알 수 없는 아티스트'}
                          </p>
                        </div>
                      </div>
                      <div className="ml-2">
                        <button
                          className={`p-1.5 rounded-full ${
                            isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                          }`}
                          onClick={() => toggleSelectSong(song.id)}
                        >
                          {selectedSongs.has(song.id) ? (
                            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-500 text-white">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          ) : (
                            <div className={`w-5 h-5 rounded-full border ${
                              isDarkMode ? 'border-gray-600' : 'border-gray-300'
                            }`}></div>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Tab.Panel>
          
          {/* 모든 음악 탭 */}
          <Tab.Panel className="h-full overflow-y-auto pb-48">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 mb-2 text-center rounded-lg mx-2 text-sm">
              음악을 재생목록에 추가하려면 + 버튼을 누르세요
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {allSongs.map((song) => (
                <div 
                  key={song.id}
                  className={`flex items-center p-3 ${
                    currentSong?.id === song.id 
                    ? isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50' 
                    : ''
                  }`}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="relative w-12 h-12 mr-3 flex-shrink-0 rounded overflow-hidden">
                      <CachedImage
                        src={getLocalFileUrl(song.fileName, 'image')}
                        alt={song.title}
                        width={48}
                        height={48}
                        className="object-cover h-full w-full"
                      />
                      {currentSong?.id === song.id && (
                        <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-40`}>
                          {isAudioReady && (
                            <div className="w-3 h-3 rounded-full bg-white"></div>
                          )}
                        </div>
                      )}
                    </div>
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        console.log('[디버그] 전체 목록에서 곡 선택:', song.title, '/ 재생목록에 추가 여부:', !playlist.some(p => p.id === song.id));
                        if (onSongSelectAndPlay) {
                          onSongSelectAndPlay(song);
                        } else {
                          onSongSelect(song);
                        }
                      }}
                    >
                      <h3 className={`text-sm font-medium truncate ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {song.title}
                      </h3>
                      <p className={`text-xs truncate ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {song.artist || '알 수 없는 아티스트'}
                      </p>
                    </div>
                  </div>
                  <div className="ml-2">
                    {onAddToPlaylist && playlist.some(p => p.id === song.id) ? (
                      <div className="flex items-center">
                        <span className={`mr-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>재생목록에 있음</span>
                        {onRemoveSong && (
                          <button
                            className={`p-1.5 rounded-full ${
                              isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'
                            }`}
                            onClick={() => {
                              console.log('[디버그] 재생목록에서 제거:', song.title);
                              onRemoveSong([song]);
                            }}
                            title="재생목록에서 제거"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      onAddToPlaylist && (
                        <button
                          className={`p-1.5 rounded-full ${
                            isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                          }`}
                          onClick={() => {
                            console.log('[디버그] 재생목록에 추가:', song.title);
                            onAddToPlaylist(song);
                          }}
                          title="재생목록에 추가"
                        >
                          <PlusCircleIcon className="w-5 h-5" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default PlaylistView;