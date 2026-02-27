'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import NavigationBar from '@/components/NavigationBar';
import { MagnifyingGlassIcon, XMarkIcon, ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/solid';
import CachedImage from '@/components/CachedImage';
import { getLocalFileUrl } from '@/utils/fileUtils';
import { motion, AnimatePresence } from 'framer-motion';
import type { SongWithChapter } from '@/types';
import { usePlayerContext } from '@/contexts/PlayerContext';
import BottomBar from '@/components/BottomBar';
import Toast from '@/components/Toast';

export default function SearchPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SongWithChapter[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [allSongs, setAllSongs] = useState<SongWithChapter[]>([]);
  const [recommendedSongs, setRecommendedSongs] = useState<SongWithChapter[]>([]);
  const [popularSongs, setPopularSongs] = useState<SongWithChapter[]>([]);
  const [newReleasedSongs, setNewReleasedSongs] = useState<SongWithChapter[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const { dragProps: recommendedDrag } = useDragScroll();
  const { dragProps: popularDrag } = useDragScroll();
  const { dragProps: newReleaseDrag } = useDragScroll();

  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    isReady,
    isShuffle,
    playMode,
    setCurrentSong: setPlayerCurrentSong,
    togglePlay,
    playlistSongs,
    seek,
    addToPlaylist,
    toggleShuffle,
    togglePlayMode,
    getNextSong,
    getPreviousSong,
  } = usePlayerContext();

  // 다음 곡 재생 핸들러
  const handleNext = useCallback(() => {
    const nextSong = getNextSong();
    if (nextSong) {
      setPlayerCurrentSong(nextSong);
      addToPlaylist(nextSong);
    }
  }, [getNextSong, setPlayerCurrentSong, addToPlaylist]);

  // 이전 곡 재생 핸들러
  const handlePrevious = useCallback(() => {
    const prevSong = getPreviousSong();
    if (prevSong) {
      setPlayerCurrentSong(prevSong);
      addToPlaylist(prevSong);
    }
  }, [getPreviousSong, setPlayerCurrentSong, addToPlaylist]);

  // 데이터 로드
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/songs');
        const data = await response.json();
        
        if (Array.isArray(data.songs)) {
          setAllSongs(data.songs);
          
          // 추천 곡 설정 (무작위 8곡)
          const shuffled = [...data.songs].sort(() => 0.5 - Math.random());
          setRecommendedSongs(shuffled.slice(0, 8));
          
          // 인기 곡 설정 (popularSong 속성이 있는 곡)
          const popular = data.songs
            .filter((song: SongWithChapter) => song.popularSong)
            .sort((a: SongWithChapter, b: SongWithChapter) => {
              if (a.popularSong && b.popularSong) {
                return a.popularSong.order - b.popularSong.order;
              }
              return 0;
            })
            .slice(0, 6);
          setPopularSongs(popular);
          
          // 새 출시 곡 설정 (isNew 속성이 true인 곡)
          const newReleased = data.songs
            .filter((song: SongWithChapter) => (song as any).isNew === true)
            .slice(0, 6);
          setNewReleasedSongs(newReleased);
        }
      } catch (error) {
        console.error('Failed to fetch songs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
    
    // 로컬 스토리지에서 최근 검색어 가져오기
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // 검색 로직
  const handleSearch = useCallback(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    
    // 검색어가 있으면 최근 검색어에 추가
    if (!recentSearches.includes(lowerQuery)) {
      const newRecentSearches = [lowerQuery, ...recentSearches.slice(0, 4)];
      setRecentSearches(newRecentSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
    }

    // 일반 검색어로 필터링
    const results = allSongs.filter(song => 
      song.title.toLowerCase().includes(lowerQuery) || 
      (song.artist && song.artist.toLowerCase().includes(lowerQuery)) ||
      (song.chapter?.name.toLowerCase().includes(lowerQuery))
    );
    
    console.log(`최종 검색 결과: ${results.length}곡 찾음`);
    
    setSearchResults(results);
  }, [query, recentSearches, allSongs]);

  // 엔터 키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 노래 선택 핸들러
  const handleSongSelect = useCallback((song: SongWithChapter) => {
    // 이미 재생목록에 있는지 확인
    const isAlreadyInPlaylist = playlistSongs.some(s => s.id === song.id);
    
    if (isAlreadyInPlaylist) {
      // 이미 재생목록에 있는 경우 토스트 메시지 표시
      showToast(`"${song.title}"은(는) 이미 재생목록에 있습니다`);
    } else {
      setPlayerCurrentSong(song);
      addToPlaylist(song);
      showToast(`"${song.title}"이(가) 재생목록에 추가되었습니다`);
    }
  }, [setPlayerCurrentSong, addToPlaylist, playlistSongs]);

  // 검색 결과를 재생목록에 추가
  const handleAddAllToPlaylist = useCallback(() => {
    if (searchResults.length > 0) {
      // 이미 재생목록에 있는 노래와 새로 추가된 노래 구분
      const alreadyInPlaylist: SongWithChapter[] = [];
      const newlyAdded: SongWithChapter[] = [];
      
      searchResults.forEach(song => {
        const isAlreadyInPlaylist = playlistSongs.some(s => s.id === song.id);
        
        if (isAlreadyInPlaylist) {
          alreadyInPlaylist.push(song);
        } else {
          addToPlaylist(song);
          newlyAdded.push(song);
        }
      });
      
      // 토스트 메시지 표시
      if (newlyAdded.length > 0 && alreadyInPlaylist.length > 0) {
        showToast(`${newlyAdded.length}곡이 재생목록에 추가되었습니다 (${alreadyInPlaylist.length}곡은 이미 존재)`);
      } else if (newlyAdded.length > 0) {
        showToast(`${newlyAdded.length}곡이 재생목록에 추가되었습니다`);
      } else if (alreadyInPlaylist.length > 0) {
        showToast(`모든 곡(${alreadyInPlaylist.length}곡)이 이미 재생목록에 있습니다`);
      }
    }
  }, [searchResults, addToPlaylist, playlistSongs]);

  // 토스트 메시지 표시 함수
  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    
    // 3초 후 토스트 숨기기
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  // 최근 검색어 클릭 핸들러
  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  // 최근 검색어 삭제 핸들러
  const handleRemoveRecentSearch = (search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newRecentSearches = recentSearches.filter(s => s !== search);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
  };

  return (
    <MainLayout>
      <div className="bg-black text-white min-h-screen pb-36">
        {/* 검색 헤더 */}
        <div className="sticky top-0 z-10 bg-black py-3 px-4 flex items-center gap-3 border-b border-white/10">
          <button 
            onClick={() => router.back()} 
            className="text-white p-1"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="노래, 아티스트 또는 장 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full bg-white/10 rounded-full py-2 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 py-4">
          {/* 검색 결과 또는 추천 콘텐츠 */}
          {query && searchResults.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-2">검색 결과</h2>
              <div className="mb-4">
                <button
                  onClick={handleAddAllToPlaylist}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 text-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>전체 재생목록에 추가</span>
                </button>
              </div>
              <div className="space-y-2">
                {searchResults.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 cursor-pointer group"
                    onClick={() => handleSongSelect(song)}
                  >
                    <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden">
                      <CachedImage
                        src={getLocalFileUrl(song.fileName, 'image')}
                        alt={song.title}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{song.title}</h3>
                      <p className="text-xs text-white/60 truncate">{song.artist}</p>
                    </div>
                    <button 
                      className="p-2 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        // 이미 재생목록에 있는지 확인
                        const isAlreadyInPlaylist = playlistSongs.some(s => s.id === song.id);
                        
                        if (isAlreadyInPlaylist) {
                          showToast(`"${song.title}"은(는) 이미 재생목록에 있습니다`);
                        } else {
                          addToPlaylist(song);
                          showToast(`"${song.title}"이(가) 재생목록에 추가되었습니다`);
                        }
                      }}
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : query ? (
            <div className="py-8 text-center text-white/60">
              <p>검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 최근 검색어 */}
              {recentSearches.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold mb-3">최근 검색어</h2>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <div
                        key={search}
                        className="px-3 py-1.5 bg-white/10 rounded-full flex items-center gap-1 cursor-pointer hover:bg-white/20"
                        onClick={() => handleRecentSearchClick(search)}
                      >
                        <span className="text-sm">{search}</span>
                        <button
                          onClick={(e) => handleRemoveRecentSearch(search, e)}
                          className="text-white/60 hover:text-white"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 추천 곡 */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-3">추천 곡</h2>
                <div {...recommendedDrag} className="overflow-x-auto hide-scrollbar pb-3">
                  <div className="flex space-x-3" style={{ minWidth: 'fit-content' }}>
                    {recommendedSongs.map((song) => (
                      <div
                        key={song.id}
                        className="w-36 flex-shrink-0 cursor-pointer"
                        onClick={() => handleSongSelect(song)}
                      >
                        <div className="relative">
                          <div className="aspect-square rounded-lg overflow-hidden">
                            <CachedImage
                              src={getLocalFileUrl(song.fileName, 'image')}
                              alt={song.title}
                              width={144}
                              height={144}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-black text-xs">▶</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <h3 className="text-sm font-medium truncate">{song.title}</h3>
                          <p className="text-xs text-white/60 truncate">{song.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 인기 차트 */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-3">인기 차트</h2>
                <div {...popularDrag} className="overflow-x-auto hide-scrollbar pb-3">
                  <div className="flex space-x-3" style={{ minWidth: 'fit-content' }}>
                    {popularSongs.map((song, index) => (
                      <div
                        key={song.id}
                        className="w-36 flex-shrink-0 cursor-pointer"
                        onClick={() => handleSongSelect(song)}
                      >
                        <div className="relative">
                          <div className="aspect-square rounded-lg overflow-hidden">
                            <CachedImage
                              src={getLocalFileUrl(song.fileName, 'image')}
                              alt={song.title}
                              width={144}
                              height={144}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-0 left-0 bg-gradient-to-r from-black/70 to-transparent w-12 h-12 flex items-center justify-center">
                              <span className="text-white font-bold text-lg">{index + 1}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <h3 className="text-sm font-medium truncate">{song.title}</h3>
                          <p className="text-xs text-white/60 truncate">{song.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 신규 곡 */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-3">신규 곡</h2>
                <div {...newReleaseDrag} className="overflow-x-auto hide-scrollbar pb-3">
                  <div className="flex space-x-3" style={{ minWidth: 'fit-content' }}>
                    {newReleasedSongs.map((song) => (
                      <div
                        key={song.id}
                        className="w-36 flex-shrink-0 cursor-pointer group"
                        onClick={() => handleSongSelect(song)}
                      >
                        <div className="relative">
                          <div className="aspect-square rounded-lg overflow-hidden">
                            <CachedImage
                              src={getLocalFileUrl(song.fileName, 'image')}
                              alt={song.title}
                              width={144}
                              height={144}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-yellow-500 text-white text-xs font-bold py-1 px-2 rounded-full shadow-lg">
                            NEW
                          </div>
                        </div>
                        <div className="mt-2">
                          <h3 className="text-sm font-medium truncate">{song.title}</h3>
                          <p className="text-xs text-white/60 truncate">{song.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 토스트 알림 */}
        <Toast message={toast.message} isVisible={toast.isVisible} />
        
        {/* 네비게이션 바 */}
        <NavigationBar />
        
        {/* 하단 플레이어 */}
        {currentSong && (
          <BottomBar
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlayPause={togglePlay}
            onPrevious={handlePrevious}
            onNext={handleNext}
            currentTime={currentTime}
            duration={duration}
            onSeek={seek}
            isReady={isReady}
            isShuffle={isShuffle}
            onShuffleToggle={toggleShuffle}
            playMode={playMode}
            onPlayModeAction={togglePlayMode}
            onSeekBackward5={() => seek(Math.max(0, currentTime - 5))}
            onSeekForward5={() => seek(Math.min(duration, currentTime + 5))}
            onSeekToStart={() => seek(0)}
            songs={playlistSongs}
            isDarkMode={true}
            onSongSelect={handleSongSelect}
          />
        )}
      </div>
    </MainLayout>
  );
}