'use client';

import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import NewSongsGrid from './NewSongsGrid';
import TopSongsGrid from './TopSongsGrid';
import { motion, AnimatePresence } from 'framer-motion';
import type { SongWithChapter, Chapter } from '@/types';
import CachedImage from './CachedImage';
import { getProxiedImageUrl } from '@/utils/imageUtils';

// 앨범 커버 색상 매핑
const getAlbumColor = (chapter: number | undefined) => {
  if (!chapter) return 'from-gray-400 to-gray-500'; // 기본 색상

  const colors = [
    'from-rose-400 to-purple-500',
    'from-blue-400 to-indigo-500',
    'from-green-400 to-emerald-500',
    'from-yellow-400 to-orange-500',
    'from-pink-400 to-red-500',
    'from-violet-400 to-purple-500',
    'from-indigo-400 to-blue-500',
    'from-teal-400 to-cyan-500'
  ];
  
  return colors[(chapter - 1) % colors.length];
};

interface SongGridProps {
  songs: SongWithChapter[];
  onSongSelect: (song: SongWithChapter) => void;
  onPlayAllAction: (songs: SongWithChapter[]) => Promise<void>;
  isDarkMode: boolean;
  toast: (message: string) => void;
  genres: Array<{ id: string; name: string }>;
  id: string;
  name: string;
  selectedGenres: string[];
  onGenreSelect: (selectedGenres: string[]) => void;
  showOnlyNew?: boolean;
  showOnlyWithLyrics?: boolean;
}

interface SearchFormProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  onReset: () => void;
  selectedGenre: string | '';
  setSelectedGenre: (genre: string | '') => void;
  isSearchMode: boolean;
  setIsSearchMode: (mode: boolean) => void;
  isDarkMode: boolean;
  genres: Array<{ id: string; name: string }>;
  selectedGenres: string[];
  onGenreSelect: (genres: string[]) => void;
}

// SearchForm을 독립적인 컴포넌트로 분리
const SearchForm = memo(({ 
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onReset,
  selectedGenre,
  setSelectedGenre,
  isSearchMode,
  setIsSearchMode,
  isDarkMode,
  genres,
  selectedGenres,
  onGenreSelect
}: SearchFormProps) => {
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // 검색어 입력 핸들러
  const searchInputValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  // 검색 폼 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery);
      setIsSearchModalOpen(false);
      setIsSearchMode(true);
    }
  };

  // 검색 입력 필드 키 입력 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSubmit(e);
    }
  };

  // 장르 선택 핸들러
  const handleGenreSelect = (genreId: string) => {
    if (genreId === '') {
      // '전체' 선택 시
      onGenreSelect([]);
    } else {
      // 단일 장르 선택으로 변경
      onGenreSelect([genreId]);
    }
    setIsGenreModalOpen(false);
    setIsSearchMode(true);
  };

  return (
    <div className="flex items-center space-x-2 mb-4">
      {/* 장르 필터 버튼 */}
      <button
        onClick={() => setIsGenreModalOpen(true)}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium
          ${isDarkMode
            ? selectedGenres.length > 0
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-white hover:bg-gray-600'
            : selectedGenres.length > 0
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
      >
        <div className="flex items-center">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          장르
          {selectedGenres.length > 0 && (
            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {selectedGenres.length}
            </span>
          )}
        </div>
      </button>

      {/* 장르 선택 모달 */}
      {isGenreModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`
            w-full max-w-md rounded-lg shadow-xl p-6
            ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
          `}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                장르 선택
              </h3>
              <button
                onClick={() => setIsGenreModalOpen(false)}
                className={`
                  p-2 rounded-full hover:bg-opacity-80
                  ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                ✕
              </button>
            </div>

            {/* 장르 버튼 그리드 */}
            <div className="grid grid-cols-2 gap-2">
              {/* 전체 버튼 */}
              <button
                onClick={() => handleGenreSelect('')}
                className={`
                  p-2 rounded-lg text-sm font-medium transition-colors
                  ${selectedGenres.length === 0
                    ? isDarkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                전체
              </button>

              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreSelect(genre.id)}
                  className={`
                    p-2 rounded-lg text-sm font-medium transition-colors
                    ${selectedGenres.includes(genre.id)
                      ? isDarkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SearchForm.displayName = 'SearchForm';

// SearchFormWrapper 컴포넌트
const SearchFormWrapper = memo(({ 
  searchQuery, 
  setSearchQuery, 
  selectedGenre, 
  setSelectedGenre, 
  isSearchMode,
  setIsSearchMode, 
  isDarkMode,
  genres,
  selectedGenres,
  onGenreSelect
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedGenre: string | '';
  setSelectedGenre: (genre: string | '') => void;
  isSearchMode: boolean;
  setIsSearchMode: (mode: boolean) => void;
  isDarkMode: boolean;
  genres: Array<{ id: string; name: string }>;
  selectedGenres: string[];
  onGenreSelect: (genres: string[]) => void;
}) => {
  return (
    <SearchForm
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      onSearchSubmit={setSearchQuery}
      onReset={() => {
        setSearchQuery('');
        setSelectedGenre('');
        setIsSearchMode(false);
      }}
      selectedGenre={selectedGenre}
      setSelectedGenre={setSelectedGenre}
      isSearchMode={isSearchMode}
      setIsSearchMode={setIsSearchMode}
      isDarkMode={isDarkMode}
      genres={genres}
      selectedGenres={selectedGenres}
      onGenreSelect={onGenreSelect}
    />
  );
});

SearchFormWrapper.displayName = 'SearchFormWrapper';

const SongGrid = ({ songs, onSongSelect, onPlayAllAction, isDarkMode, toast, genres, selectedGenres, onGenreSelect, showOnlyNew, showOnlyWithLyrics }: SongGridProps) => {
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | ''>('');
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isNoticeVisible, setIsNoticeVisible] = useState(() => {
    const hiddenUntil = localStorage.getItem('noticeHiddenUntil');
    if (!hiddenUntil) return true;
    return new Date().getTime() > parseInt(hiddenUntil);
  });

  const handleCloseNotice = () => {
    const expiryTime = new Date().getTime() + (60 * 60 * 1000); // 1시간
    localStorage.setItem('noticeHiddenUntil', expiryTime.toString());
    setIsNoticeVisible(false);
  };

  // 검색어 변경 핸들러
  const handleSearchChange = useCallback((value: string) => {
    setTempSearchQuery(value);
  }, []);

  // 검색 실행 핸들러
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearchMode(true);
  }, []);

  // 검색 초기화 핸들러
  const handleReset = useCallback(() => {
    setTempSearchQuery('');
    setSearchQuery('');
    setSelectedGenre('');
    setIsSearchMode(false);
  }, []);

  // 장르 변경 핸들러
  const handleGenreChange = useCallback((genre: string | '') => {
    setSelectedGenre(genre);
  }, []);

  // 검색 폼 props
  const searchFormProps = useMemo(() => ({
    searchQuery: tempSearchQuery,
    setSearchQuery: handleSearchChange,
    onSearchSubmit: handleSearch,
    onReset: handleReset,
    selectedGenre,
    setSelectedGenre: handleGenreChange,
    isSearchMode,
    setIsSearchMode,
    isDarkMode,
    genres,
    selectedGenres,
    onGenreSelect
  }), [tempSearchQuery, handleSearchChange, handleSearch, isSearchMode, setIsSearchMode, handleReset, selectedGenre, handleGenreChange, isDarkMode, genres, selectedGenres, onGenreSelect]);

  // 노래 정렬 로직
  const sortSongs = (songs: SongWithChapter[]) => {
    const sorted = [...songs].sort((a, b) => {
      // 챕터 ID로 정렬 (숫자로 변환하여 비교)
      const chapterIdA = parseInt(String(a.chapterId));
      const chapterIdB = parseInt(String(b.chapterId));
      if (chapterIdA !== chapterIdB) {
        return chapterIdA - chapterIdB;
      }
      // 장르 ID로 정렬
      const genreIdA = parseInt(String(a.genreId));
      const genreIdB = parseInt(String(b.genreId));
      if (genreIdA !== genreIdB) {
        return genreIdA - genreIdB;
      }
      // 제목으로 정렬
      return a.title.localeCompare(b.title);
    });
    return sorted;
  };

  const sortedSongs = useMemo(() => sortSongs(songs), [songs]);

  // 챕터별로 노래 그룹화
  const songsByChapter = sortedSongs.reduce((acc, song) => {
    const chapter = song.chapterId;
    if (!chapter) return acc;
    
    const chapterName = `계시록 ${song.chapterId}장`;
    if (!acc[chapterName]) {
      acc[chapterName] = [];
    }
    acc[chapterName].push(song);
    return acc;
  }, {} as Record<string, SongWithChapter[]>);

  // 필터링된 곡 목록
  const filteredSongs = useMemo(() => {
    let filtered = [...songs];

    // 검색어로 필터링
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(query) ||
        (song.artist && song.artist.toLowerCase().includes(query)) ||
        (song.lyrics && song.lyrics.toLowerCase().includes(query))
      );
    }

    // 선택된 챕터로 필터링
    if (selectedChapter) {
      filtered = filtered.filter(song => song.chapter?.id.toString() === selectedChapter);
    }

    // 장르 필터링 (selectedGenres가 비어있으면 모든 곡 표시)
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(song => song.genre && selectedGenres.includes(song.genre.id.toString()));
    }

    // 새로운 곡만 보기
    if (showOnlyNew) {
      filtered = filtered.filter(song => song.isNew);
    }

    // 가사 있는 곡만 보기
    if (showOnlyWithLyrics) {
      filtered = filtered.filter(song => song.lyrics);
    }

    return filtered;
  }, [songs, selectedChapter, searchQuery, selectedGenres, showOnlyNew, showOnlyWithLyrics]);

  useEffect(() => {
    if (selectedChapter) {
      const mainContent = document.getElementById('main-content');
      if (mainContent && typeof window !== 'undefined') {
        setTimeout(() => {
          mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      }
    }
  }, [selectedChapter]);

  if (isSearchMode) {
    return (
      <div id="main-content" className="p-6">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleReset}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium
              ${isDarkMode 
                ? 'bg-surface text-white hover:bg-surface-light' 
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}
            `}
          >
            ◀
          </button>
        </div>
      
        {searchFormProps && <SearchFormWrapper {...searchFormProps} />}

        {/* 검색 결과 요약 */}
        <div className="mb-6">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            검색 결과 ({filteredSongs.length}곡)
          </h2>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {searchQuery && `"${searchQuery}" 검색 결과`}
            {searchQuery && selectedGenre && ' • '}
            {selectedGenre && `장르: ${selectedGenre}`}
          </p>
        </div>

        {/* 전체 재생 버튼 */}
        {filteredSongs.length > 0 && (
          <div className="mb-8">
            <motion.button
              onClick={() => onPlayAllAction(filteredSongs)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium
                flex items-center gap-2
                ${isDarkMode 
                  ? 'bg-primary/90 text-white hover:bg-primary' 
                  : 'bg-primary/90 text-white hover:bg-primary'
                }
                transition-all duration-300 shadow-md hover:shadow-lg
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg 
                className="w-4 h-4" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
              <span>검색 결과 전체 재생</span>
            </motion.button>
          </div>
        )}

        {/* 검색 결과 목록 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              onClick={() => onSongSelect(song)}
              className={`p-4 rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 
                ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}
            >
              <div className="flex items-center space-x-4">
                {/* 곡 이미지 */}
                {song.imageUrl ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <CachedImage
                      src={song.imageUrl}
                      alt={song.title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-rose-400 to-purple-500 
                    flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-2xl opacity-20">♪</span>
                  </div>
                )}
                
                {/* 곡 정보 */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <div className="font-medium text-sm truncate flex-1">
                      {song.title}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      계시록 {song.chapterId}장
                    </div>
                    {song.genre?.name && (
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200`}>
                        {song.genre.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* NEW 뱃지 */}
                {song.isNew && (
                  <span className="flex-shrink-0 px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
                    NEW
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredSongs.length === 0 && (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            검색 결과가 없습니다
          </div>
        )}
      </div>
    );
  }

  if (selectedChapter) {
    const chapterSongs = songsByChapter[selectedChapter];
    return (
      <div id="main-content" className="p-6">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => setSelectedChapter(null)}
          className={`mb-6 flex items-center space-x-2 ${
            isDarkMode ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-700'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-lg font-medium">뒤로 가기</span>
        </button>

        {/* 챕터 제목 */}
        <h2 className={`text-3xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {selectedChapter}
        </h2>

        {/* 전체 재생 버튼 */}
        <motion.button
          onClick={() => onPlayAllAction(chapterSongs)}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium
            flex items-center gap-2 mb-6
            ${isDarkMode 
              ? 'bg-primary/90 text-white hover:bg-primary' 
              : 'bg-primary/90 text-white hover:bg-primary'
            }
            transition-all duration-300 shadow-lg hover:shadow-xl
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg 
            className="w-4 h-4" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M8 5.14v14l11-7-11-7z" />
          </svg>
          <span>전체 재생</span>
        </motion.button>

        {/* 노래 목록 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {chapterSongs.map((song) => (
            <div
              key={song.id}
              onClick={() => onSongSelect(song)}
              className={`p-4 rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 
                ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}
            >
              <div className="flex items-center space-x-4">
                {/* 곡 이미지 */}
                {song.imageUrl ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <CachedImage
                      src={song.imageUrl}
                      alt={song.title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-rose-400 to-purple-500 
                    flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-2xl opacity-20">♪</span>
                  </div>
                )}
                
                {/* 곡 정보 */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <div className="font-medium text-sm truncate flex-1">
                      {song.title}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      계시록 {song.chapterId}장
                    </div>
                    {song.genre?.name && (
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200`}>
                        {song.genre.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* NEW 뱃지 */}
                {song.isNew && (
                  <span className="flex-shrink-0 px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
                    NEW
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 챕터 앨범 그리드 보기
  return (
    <div id="main-content" className="p-6">
      <div className="flex justify-between items-center mb-6">
        <motion.h2 
          className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-wide`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
        >
          AI MUSIC
        </motion.h2>

        <motion.button
          onClick={() => onPlayAllAction(songs)}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium
            flex items-center gap-2
            ${isDarkMode 
              ? 'bg-primary/90 text-white hover:bg-primary' 
              : 'bg-primary/90 text-white hover:bg-primary'
            }
            transition-all duration-300 shadow-lg hover:shadow-xl
          `}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg 
            className="w-4 h-4" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M8 5.14v14l11-7-11-7z" />
          </svg>
          <span>전체 재생</span>
        </motion.button>
      </div>

      <div className="px-4 py-6">
        {searchFormProps && <SearchFormWrapper {...searchFormProps} />}

        {/* 앱 설명 */}
        {isNoticeVisible && (
          <div className="relative mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm animate-fade-in">
            <button
              onClick={handleCloseNotice}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">앱사용 주의사항</h2>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              해당 앱은 요한계시록 <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full">개역한글</span>로 제작한 성경 AI노래앱입니다. 
              노래 제작 AI가 부드럽게 노래를 부르려고 하다보니, 구절이나 토시가 
              사라지는 경우도 있습니다. 최대한 괄호()로 처리해놓고 있습니다.
              <br /><br />
              <div className="p-3 bg-yellow-50 dark:bg-gray-700 border-l-4 border-yellow-400 dark:border-yellow-500">
                <p className="font-medium text-yellow-800 dark:text-yellow-100">
                  혹여 해당 이유로 듣기 불편하시거나 문제 될 것 같다면, 
                  이 앱 사용을 중지하십시오. 가볍게 듣고 암기목적으로 만든 앱이오나, 
                  사용을 거부하시는 분들은 사용을 금해주세요.
                </p>
              </div>
            </p>
          </div>
        )}

        {/* 인기 TOP 5 */}
        {!isSearchMode && (
          <div className="mb-12">
            <div className={`h-px w-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} mb-8`}></div>
            <TopSongsGrid
              songs={songs}
              onSongSelectAction={onSongSelect}
              isDarkMode={isDarkMode}
              onPlayAllAction={onPlayAllAction}
            />
          </div>
        )}

        {/* 최신곡 */}
        {!isSearchMode && (
          <div className="mb-12">
            <div className={`h-px w-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} mb-8`}></div>
            <NewSongsGrid
              songs={songs}
              onSongSelectAction={onSongSelect}
              isDarkMode={isDarkMode}
              onPlayAllAction={onPlayAllAction}
            />
          </div>
        )}

        {/* 메인 곡 목록 */}
        <div className="mb-8">
          <div className={`h-px w-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} mb-8`}></div>
          <div className={`text-center mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <p className="whitespace-pre-line text-lg leading-relaxed">
              이 앱은 <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full">개역한글</span> 요한계시록의{'\n'}말씀을 그대로 암송할 수 있도록{'\n'}AI가 작곡한 음악과 함께 제공됩니다.{'\n'}말씀과 음악으로 은혜로운 시간 보내세요.
            </p>
          </div>
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            각 장별 듣기
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {Object.keys(songsByChapter).sort((a, b) => {
                // 숫자만 추출하여 정수로 변환
                const chapterA = parseInt(a.replace(/[^0-9]/g, ''));
                const chapterB = parseInt(b.replace(/[^0-9]/g, ''));
                return chapterA - chapterB;
              }).map((chapterName) => {
                return (
                  <div
                    key={chapterName}
                    onClick={() => setSelectedChapter(chapterName)}
                    className="cursor-pointer group"
                  >
                    {/* 챕터 앨범 커버 */}
                    <div className="aspect-square rounded-2xl overflow-hidden shadow-xl relative
                      transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl
                      bg-gradient-to-br {getAlbumColor(Number(songsByChapter[chapterName][0]?.chapterId))}
                    ">
                      {/* 챕터 이미지 */}
                      <CachedImage 
                        src={`/images/chapters/${songsByChapter[chapterName][0]?.chapterId}.jpg`}
                        alt={`계시록 ${songsByChapter[chapterName][0]?.chapterId}장`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      />

                      {/* 챕터 번호 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-6xl font-bold opacity-30">
                          {songsByChapter[chapterName][0]?.chapterId}
                        </span>
                      </div>

                      {/* 재생 버튼 오버레이 */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
                          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5.14v14l11-7-11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* 챕터 정보 */}
                    <div className="mt-4">
                      <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        계시록 {songsByChapter[chapterName][0]?.chapterId}장
                      </h3>
                      <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {songsByChapter[chapterName].length}곡
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongGrid;
