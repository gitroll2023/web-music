'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SongWithChapter } from '@/types';
import { 
  PlayIcon, 
  PauseIcon, 
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/solid';

interface SongListProps {
  songs: SongWithChapter[];
  onSongSelectAction: (song: SongWithChapter) => void;
  onPlayAllAction: (songs: SongWithChapter[]) => void;
  isDarkMode: boolean;
  showToastAction: (message: string) => void;
}

interface SongWithOrder extends SongWithChapter {
  order: number;
}

export default function SongList({
  songs,
  onSongSelectAction,
  onPlayAllAction,
  isDarkMode,
  showToastAction
}: SongListProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [sortedSongs, setSortedSongs] = useState<SongWithOrder[]>([]);
  const [sortField, setSortField] = useState<'title' | 'artist' | 'chapter' | 'genre'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const loadSongs = async () => {
      try {
        setIsLoading(true);
        const songsWithOrder = songs.map((song, index) => ({
          ...song,
          order: index + 1
        }));
        setSortedSongs(songsWithOrder);
      } catch (error) {
        console.error('곡 로드 중 오류:', error);
        showToastAction(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSongs();
  }, [songs, showToastAction]);

  const handleSort = useCallback((field: typeof sortField) => {
    setSortField(field);
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');

    const sorted = [...sortedSongs].sort((a, b) => {
      let comparison = 0;

      switch (field) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'artist':
          comparison = (a.artist || '').localeCompare(b.artist || '');
          break;
        case 'chapter':
          comparison = (a.chapter?.name || '').localeCompare(b.chapter?.name || '');
          break;
        case 'genre':
          comparison = (a.genre?.name || '').localeCompare(b.genre?.name || '');
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setSortedSongs(sorted);
  }, [sortDirection, sortedSongs]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              순서
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('title')}
            >
              제목 {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('artist')}
            >
              아티스트 {sortField === 'artist' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('chapter')}
            >
              챕터 {sortField === 'chapter' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('genre')}
            >
              장르 {sortField === 'genre' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              액션
            </th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700 bg-gray-900' : 'divide-gray-200 bg-white'}`}>
          {sortedSongs.map((song) => (
            <tr
              key={song.id}
              className={`${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors duration-150 ease-in-out`}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {song.order}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {song.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {song.artist || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {song.chapter?.name || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {song.genre?.name || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => onSongSelectAction(song)}
                  className={`text-indigo-600 hover:text-indigo-900 ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : ''}`}
                >
                  재생
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4">
        <button
          onClick={() => onPlayAllAction(sortedSongs)}
          className={`px-4 py-2 rounded-md ${
            isDarkMode
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
          }`}
        >
          전체 재생
        </button>
      </div>
    </div>
  );
}