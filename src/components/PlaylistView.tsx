import { useState, useCallback, useMemo } from 'react';
import type { SongWithChapter } from '@/types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import CachedImage from './CachedImage';
import { PlayIcon, PauseIcon, TrashIcon, QueueListIcon } from '@heroicons/react/24/solid';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';

interface PlaylistViewProps {
  playlist: SongWithChapter[];
  currentSong: SongWithChapter | null;
  onSongSelect: (song: SongWithChapter) => void;
  onRemoveSong: (songs: SongWithChapter[]) => void;
  onShufflePlaylist: () => void;
  onRepeatModeChange: () => void;
  onReorderPlaylist: (result: DropResult) => void;
  isDarkMode: boolean;
  isAudioReady?: boolean;
}

const PlaylistView = ({
  playlist,
  currentSong,
  onSongSelect,
  onRemoveSong,
  onShufflePlaylist,
  onRepeatModeChange,
  onReorderPlaylist,
  isDarkMode = false,
  isAudioReady = false
}: PlaylistViewProps) => {
  const [selectedSongs, setSelectedSongs] = useState<Set<number>>(new Set());
  const [isReorderMode, setIsReorderMode] = useState(false);

  const toggleSongSelection = useCallback((songId: number) => {
    setSelectedSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  }, []);

  const handleRemoveSelected = useCallback(() => {
    const songsToRemove = playlist.filter(song => selectedSongs.has(song.id));
    onRemoveSong(songsToRemove);
    setSelectedSongs(new Set());
  }, [playlist, selectedSongs, onRemoveSong]);

  const handleDragEnd = useCallback((result: DropResult) => {
    onReorderPlaylist(result);
  }, [onReorderPlaylist]);

  return (
    <div className="h-full flex flex-col bg-opacity-50 backdrop-blur-lg">
      <div className={`sticky top-0 z-10 px-4 py-3 ${
        isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'
      } border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <QueueListIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              재생목록 ({playlist?.length || 0})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {selectedSongs.size > 0 ? (
              <button
                onClick={handleRemoveSelected}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                <TrashIcon className="w-4 h-4" />
                {selectedSongs.size}곡 삭제
              </button>
            ) : (
              <button
                onClick={() => setIsReorderMode(!isReorderMode)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isDarkMode
                    ? isReorderMode 
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    : isReorderMode
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ChevronUpDownIcon className="w-4 h-4" />
                {isReorderMode ? '순서변경 완료' : '순서변경'}
              </button>
            )}
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="playlist">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex-1 overflow-y-auto px-2 py-2"
            >
              <div className="space-y-1">
                {playlist.map((song, index) => (
                  <Draggable 
                    key={song.id} 
                    draggableId={String(song.id)} 
                    index={index}
                    isDragDisabled={!isReorderMode}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`group flex items-center p-2 rounded-lg transition-all ${
                          snapshot.isDragging
                            ? isDarkMode
                              ? 'bg-gray-700/80 shadow-lg'
                              : 'bg-gray-100/80 shadow-lg'
                            : isDarkMode
                              ? 'bg-gray-800/40 hover:bg-gray-700/60'
                              : 'bg-white/40 hover:bg-gray-50/60'
                        } ${currentSong?.id === song.id 
                          ? isDarkMode
                            ? 'ring-2 ring-blue-500/50'
                            : 'ring-2 ring-blue-500/30'
                          : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {!isReorderMode && (
                            <input
                              type="checkbox"
                              checked={selectedSongs.has(song.id)}
                              onChange={() => toggleSongSelection(song.id)}
                              className={`w-4 h-4 rounded border-2 ${
                                isDarkMode
                                  ? 'border-gray-600 bg-gray-800'
                                  : 'border-gray-300 bg-white'
                              }`}
                            />
                          )}
                          <div className="relative w-10 h-10 flex-shrink-0">
                            {song.imageUrl ? (
                              <CachedImage
                                src={song.imageUrl}
                                alt={song.title}
                                width={48}
                                height={48}
                                className="rounded object-cover"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center rounded-md ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                              }`}>
                                <span className="text-xl">🎵</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium truncate ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {song.title}
                            </h3>
                            <p className={`text-sm truncate ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {song.artist || '알 수 없는 아티스트'}
                            </p>
                          </div>
                        </div>
                        {isReorderMode ? (
                          <ChevronUpDownIcon className={`w-5 h-5 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                        ) : (
                          <button
                            onClick={() => onSongSelect(song)}
                            className={`p-2 rounded-full transition-colors ${
                              currentSong?.id === song.id
                                ? 'text-blue-500'
                                : isDarkMode
                                  ? 'text-gray-400'
                                  : 'text-gray-600'
                            }`}
                          >
                            {currentSong?.id === song.id ? (
                              <PauseIcon className="w-5 h-5" />
                            ) : (
                              <PlayIcon className="w-5 h-5" />
                            )}
                          </button>
                        )}
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
    </div>
  );
};

export default PlaylistView;