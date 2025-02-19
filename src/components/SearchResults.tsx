import React from 'react';
import type { SongWithChapter } from '@/types';
import CachedImage from './CachedImage';

interface SearchResultsProps {
  songs: SongWithChapter[];
  onSongSelect: (song: SongWithChapter) => void;
  isDarkMode: boolean;
  searchQuery: string;
  selectedGenres: string[];
}

const SearchResults = ({
  songs,
  onSongSelect,
  isDarkMode,
  searchQuery,
  selectedGenres
}: SearchResultsProps) => {
  if (songs.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        <p className="text-lg font-medium mb-2">검색 결과가 없습니다</p>
        <p className="text-sm text-gray-500">다른 검색어로 시도해보세요</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className={`px-4 py-3 mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg`}>
        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          검색 결과 ({songs.length}곡)
        </h2>
        {searchQuery && (
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            &quot;{searchQuery}&quot;에 대한 검색 결과입니다
          </p>
        )}
        {selectedGenres.length > 0 && (
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            선택된 장르: {selectedGenres.length}개
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {songs.map((song) => (
          <div
            key={song.id}
            onClick={() => onSongSelect(song)}
            className={`
              p-4 rounded-lg cursor-pointer transition-all duration-200
              ${isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700' 
                : 'bg-white hover:bg-gray-50 shadow-sm'
              }
            `}
          >
            <div className="relative aspect-square mb-3 rounded-lg overflow-hidden">
              <CachedImage
                src={song.imageUrl || '/placeholder.jpg'}
                alt={song.title}
                fill
                className="object-cover"
              />
            </div>
            <h3 className={`font-medium mb-1 truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {song.title}
            </h3>
            {song.artist && (
              <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {song.artist}
              </p>
            )}
            {song.genre && (
              <span className={`
                inline-block mt-2 px-2 py-1 text-xs rounded-full
                ${isDarkMode 
                  ? 'bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {song.genre.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
