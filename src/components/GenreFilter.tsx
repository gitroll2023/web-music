import { useState } from 'react';

interface GenreFilterProps {
  selectedGenres: string[];
  onGenreChangeAction: (genres: string[]) => void;
  isDarkMode: boolean;
}

export default function GenreFilter({ selectedGenres, onGenreChangeAction, isDarkMode }: GenreFilterProps) {
  const genres = [
    { id: 'all', label: '전체보기' },
    { id: 'acoustic', label: '어쿠스틱' },
    { id: 'hiphop', label: '힙합' },
    { id: 'kids', label: '어린이(비트만)' },
    { id: 'upbeat', label: '신나는' },
    { id: 'epic', label: '웅장한' },
    { id: 'trot', label: '트로트' },
    { id: 'indie', label: '인디뮤직' },
    { id: 'ccm', label: 'CCM' },
    { id: 'other', label: '기타' },
    { id: 'unclassified', label: '분류X' },
  ];

  const handleGenreClick = (genreId: string) => {
    if (genreId === 'all') {
      onGenreChangeAction([]);
      return;
    }

    let newSelectedGenres: string[];
    if (selectedGenres.includes(genreId)) {
      newSelectedGenres = selectedGenres.filter(g => g !== genreId);
    } else {
      newSelectedGenres = [...selectedGenres, genreId];
    }
    onGenreChangeAction(newSelectedGenres);
  };

  return (
    <div className="w-full overflow-hidden">
      <div 
        className={`flex gap-2 pb-2 overflow-x-auto scrollbar-hide whitespace-nowrap`}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => handleGenreClick(genre.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ease-in-out flex-shrink-0
              ${
                selectedGenres.includes(genre.id)
                  ? isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            {genre.label}
          </button>
        ))}
      </div>
    </div>
  );
} 