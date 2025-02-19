import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Dialog } from '@headlessui/react';
import { SongWithChapter } from '@/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface PopularSongsProps {
  songs: SongWithChapter[];
  onUpdatePopularSongs: () => void;
}

export function PopularSongs({ songs, onUpdatePopularSongs }: PopularSongsProps) {
  const [popularSongs, setPopularSongs] = useState<SongWithChapter[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongWithChapter | null>(null);

  // 드래그 앤 드롭 핸들러
  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(popularSongs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPopularSongs(items);

    // API 호출하여 순서 업데이트
    try {
      const updates = items.map((song, index) => ({
        id: song.popularSong!.id,
        order: index + 1,
      }));

      const response = await fetch('/api/popular-songs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update popular songs order');
      }
    } catch (error) {
      console.error('Error updating popular songs order:', error);
    }
  };

  // 인기곡 추가
  const handleAddPopularSong = async () => {
    if (!selectedSong) return;

    try {
      const response = await fetch('/api/popular-songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId: selectedSong.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to add popular song');
      }

      onUpdatePopularSongs();
      setIsModalOpen(false);
      setSelectedSong(null);
    } catch (error) {
      console.error('Error adding popular song:', error);
    }
  };

  // 인기곡 삭제
  const handleDeletePopularSong = async (songId: number) => {
    try {
      const response = await fetch(`/api/popular-songs?id=${songId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete popular song');
      }

      onUpdatePopularSongs();
    } catch (error) {
      console.error('Error deleting popular song:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">인기곡 관리</h2>
        <Button
          onClick={() => setIsModalOpen(true)}
          disabled={popularSongs.length >= 5}
        >
          인기곡 추가
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="popular-songs">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {popularSongs.map((song, index) => (
                <Draggable
                  key={song.id}
                  draggableId={song.id.toString()}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="flex items-center justify-between p-3 bg-white rounded-lg shadow"
                    >
                      <div>
                        <p className="font-medium">{song.title}</p>
                        <p className="text-sm text-gray-500">
                          {song.artist || 'Various Artists'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleDeletePopularSong(song.popularSong!.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSong(null);
        }}
        title="인기곡 추가"
      >
        <div className="space-y-4">
          <div className="grid gap-4">
            {songs
              .filter((song) => !song.popularSong)
              .map((song) => (
                <div
                  key={song.id}
                  className={`p-3 rounded-lg cursor-pointer ${
                    selectedSong?.id === song.id
                      ? 'bg-blue-100'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedSong(song)}
                >
                  <p className="font-medium">{song.title}</p>
                  <p className="text-sm text-gray-500">
                    {song.artist || 'Various Artists'}
                  </p>
                </div>
              ))}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedSong(null);
              }}
            >
              취소
            </Button>
            <Button onClick={handleAddPopularSong} disabled={!selectedSong}>
              추가
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
