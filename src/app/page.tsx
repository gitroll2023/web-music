'use client';

import { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import TopBar from '@/components/TopBar';
import StatusBar from '@/components/StatusBar';
import MixedForYou from '@/components/MixedForYou';
import RecentlyPlaying from '@/components/RecentlyPlaying';
import PopularThisMonth from '@/components/PopularThisMonth';
import TopSongs from '@/components/TopSongs';
import ListenAgain from '@/components/ListenAgain';
import TitleSongs from '@/components/TitleSongs';
import PlayHistory from '@/components/PlayHistory';
import NavigationBar from '@/components/NavigationBar';
import BottomBar from '@/components/BottomBar';
import type { SongWithChapter } from '@/types';
import { usePlayerContext } from '@/contexts/PlayerContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { addToHistory } from '@/utils/playHistory';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [songs, setSongs] = useState<SongWithChapter[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<SongWithChapter[]>([]);
  const [chapterSongs, setChapterSongs] = useState<SongWithChapter[]>([]);
  const [keyVerseSongs, setKeyVerseSongs] = useState<SongWithChapter[]>([]);
  const [titleSongs, setTitleSongs] = useState<SongWithChapter[]>([]);
  const [newSongs, setNewSongs] = useState<SongWithChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const {
    currentSong,
    playlistSongs,
    isPlaying,
    isShuffle,
    playMode,
    volume,
    currentTime,
    duration,
    isReady,
    setPlaylist,
    initializePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    seek,
    togglePlay,
    setCurrentSong,
    getNextSong: getPlayerNextSong,
    getPreviousSong: getPlayerPreviousSong,
    toggleShuffle,
    togglePlayMode,
    setVolume,
  } = usePlayerContext();

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        // 재미있는 로딩 메시지 배열
        const loadingMessages = [
          "🎵 음악을 찾아 우주 저편까지 여행 중...",
          "🎧 천상의 멜로디를 다운로드하는 중...",
          "🎸 기타 솔로를 준비하는 중...",
          "🥁 드럼 소리가 들리시나요? 곧 준비됩니다!",
          "🎹 건반 위의 마법사가 음악을 불러오는 중...",
          "🎤 마이크 테스트 중... 1, 2, 3!",
          "🎼 악보를 정리하는 중... 조금만 기다려주세요!",
          "📻 주파수를 맞추는 중... 곧 최고의 음악이 흘러나옵니다!",
          "🎶 음표들이 줄을 서서 기다리고 있어요...",
          "🔊 볼륨을 최적화하는 중... 귀에 딱 맞는 소리로!"
        ];
        
        // 로딩 메시지 업데이트 인터벌 설정
        const messageInterval = setInterval(() => {
          const randomIndex = Math.floor(Math.random() * loadingMessages.length);
          setLoadingMessage(loadingMessages[randomIndex]);
        }, 2000);
        
        // 초기 메시지 설정
        setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        
        const response = await fetch('/api/songs');
        const data = await response.json();
        console.log('Fetched songs:', data.songs);
        
        // 인터벌 정리
        clearInterval(messageInterval);
        
        if (Array.isArray(data.songs)) {
          setSongs(data.songs);
          setFilteredSongs(data.songs);
          
          // 카테고리별로 노래 필터링 (타입 단언 사용)
          interface SongWithRevelationFlags extends SongWithChapter {
            isRevelationChapter: boolean;
            isRevelationKeyVerse: boolean;
            isRevelationTitle: boolean;
            isNew: boolean;
          }
          
          const songsWithFlags = data.songs.map((song: SongWithChapter) => ({
            ...song,
            isRevelationChapter: (song as any).isRevelationChapter === true,
            isRevelationKeyVerse: (song as any).isRevelationKeyVerse === true,
            isRevelationTitle: (song as any).isRevelationTitle === true,
            isNew: (song as any).isNew === true
          })) as SongWithRevelationFlags[];
          
          const chaptersOnly = songsWithFlags.filter(song => song.isRevelationChapter);
          const keyVersesOnly = songsWithFlags.filter(song => song.isRevelationKeyVerse);
          const titlesOnly = songsWithFlags.filter(song => song.isRevelationTitle);
          const newSongsOnly = songsWithFlags.filter(song => song.isNew);
          
          console.log('계시록 전장 노래:', chaptersOnly.length);
          console.log('계시록 핵심성구 노래:', keyVersesOnly.length);
          console.log('계시록 제목 노래:', titlesOnly.length);
          console.log('신규 노래:', newSongsOnly.length);
          
          // 신규 노래만 표시 (isNew가 true인 경우만)
          setNewSongs(newSongsOnly);
          
          setChapterSongs(chaptersOnly);
          setKeyVerseSongs(keyVersesOnly);
          setTitleSongs(titlesOnly);
          
          // 재생목록은 초기화하지 않음 (빈 상태로 유지)
        }
      } catch (error) {
        console.error('Failed to fetch songs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, [setPlaylist]);

  const handleCategoryChange = useCallback((category: string) => {
    console.log('카테고리 변경:', category);
    
    if (category === 'all') {
      // 모든 계시록 전장 노래 표시
      const allChapterSongs = songs.filter(song => (song as any).isRevelationChapter === true);
      setChapterSongs(allChapterSongs);
    } else {
      // 선택한 장에 해당하는 노래만 필터링
      const chapterNumber = category.replace('chapter-', '');
      console.log('선택한 장 번호:', chapterNumber);
      
      // 해당 장 번호에 맞는 노래만 필터링
      const filteredByChapter = songs.filter(song => {
        // 계시록 전장 노래이면서
        const isChapterSong = (song as any).isRevelationChapter === true;
        
        // 선택한 장 번호와 일치하는지 확인
        const matchesChapter = song.chapter?.name.includes(`계시록 ${chapterNumber}장`);
        
        return isChapterSong && matchesChapter;
      });
      
      console.log(`계시록 ${chapterNumber}장 노래:`, filteredByChapter.length);
      setChapterSongs(filteredByChapter);
    }
  }, [songs]);

  const handleSongSelect = useCallback((song: SongWithChapter) => {
    console.log('Selected song:', song);
    setCurrentSong(song);

    // 선택한 곡을 재생목록에 추가
    addToPlaylist(song);

    // 재생 기록에 추가
    addToHistory({ id: song.id, title: song.title, fileName: song.fileName });
    setHistoryRefreshKey((k) => k + 1);
  }, [setCurrentSong, addToPlaylist]);

  // 전체 듣기 핸들러
  const handlePlayAll = useCallback((songsToPlay: SongWithChapter[]) => {
    if (songsToPlay.length === 0) return;

    console.log('Playing all songs:', songsToPlay.length);

    // 재생 목록 초기화하고 선택된 곡들 추가
    initializePlaylist(songsToPlay);

    // 첫 번째 곡 재생
    setCurrentSong(songsToPlay[0]);
  }, [initializePlaylist, setCurrentSong]);

  // 전체 재생목록에 추가 핸들러
  const handleAddAllToPlaylist = useCallback((songsToAdd: SongWithChapter[]) => {
    if (songsToAdd.length === 0) return;
    
    console.log('Adding all songs to playlist:', songsToAdd.length);
    
    // 현재 곡 위치 찾기
    let currentIndex = -1;
    if (currentSong) {
      currentIndex = playlistSongs.findIndex(song => song.id === currentSong.id);
    }
    
    // 현재 재생 목록 가져오기
    const currentPlaylist = [...playlistSongs];
    
    // 현재 곡이 있으면 그 뒤에 추가, 없으면 그냥 추가
    if (currentIndex >= 0) {
      // 현재 곡 뒤에 새 곡들 삽입
      currentPlaylist.splice(currentIndex + 1, 0, ...songsToAdd);
      initializePlaylist(currentPlaylist);
    } else {
      // 그냥 추가
      songsToAdd.forEach(song => addToPlaylist(song));
    }
    
    toast.success(`${songsToAdd.length}곡이 재생목록에 추가되었습니다.`);
  }, [currentSong, playlistSongs, initializePlaylist, addToPlaylist]);

  const getNextSong = useCallback(() => {
    if (!currentSong || songs.length === 0) return null;
    const currentIndex = songs.findIndex(song => song.fileName === currentSong.fileName);
    if (currentIndex === -1) return songs[0];
    return songs[(currentIndex + 1) % songs.length];
  }, [currentSong, songs]);

  const getPreviousSong = useCallback(() => {
    if (!currentSong || songs.length === 0) return null;
    const currentIndex = songs.findIndex(song => song.fileName === currentSong.fileName);
    if (currentIndex === -1) return songs[songs.length - 1];
    return songs[(currentIndex - 1 + songs.length) % songs.length];
  }, [currentSong, songs]);

  const handlePlayPause = () => {
    togglePlay();
  };

  const handleNext = () => {
    // 재생목록에 여러 곡이 있으면 재생목록 기준, 아니면 전체 곡 목록 기준
    const nextSong = playlistSongs.length > 1 ? getPlayerNextSong() : getNextSong();
    if (nextSong) {
      handleSongSelect(nextSong);
    }
  };

  const handlePrevious = () => {
    const previousSong = playlistSongs.length > 1 ? getPlayerPreviousSong() : getPreviousSong();
    if (previousSong) {
      handleSongSelect(previousSong);
    }
  };

  const handleSeek = (time: number) => {
    seek(time);
  };

  const handleShuffleToggle = () => {
    toggleShuffle();
  };

  const handlePlayModeAction = () => {
    togglePlayMode();
  };

  const handleSeekBackward5 = () => {
    seek(Math.max(0, currentTime - 5));
  };

  const handleSeekForward5 = () => {
    seek(Math.min(duration, currentTime + 5));
  };

  const handleSeekToStart = () => {
    seek(0);
  };

  const handleVolumeUp = useCallback(() => {
    const newVolume = Math.min(1, volume + 0.1);
    setVolume(newVolume);
  }, [volume, setVolume]);

  const handleVolumeDown = useCallback(() => {
    const newVolume = Math.max(0, volume - 0.1);
    setVolume(newVolume);
  }, [volume, setVolume]);

  // 키보드 단축키: Space(재생/일시정지), 방향키(탐색/볼륨)
  useKeyboardShortcuts({
    onTogglePlay: handlePlayPause,
    onSeekBackward: handleSeekBackward5,
    onSeekForward: handleSeekForward5,
    onVolumeUp: handleVolumeUp,
    onVolumeDown: handleVolumeDown,
    isEnabled: !isLoading,
  });

  const handleMoveSong = (fromIndex: number, toIndex: number) => {
    const updatedSongs = [...playlistSongs];
    const [movedSong] = updatedSongs.splice(fromIndex, 1);
    updatedSongs.splice(toIndex, 0, movedSong);
    
    // 재생목록만 업데이트
    initializePlaylist(updatedSongs);
  };

  const handleDeleteSongs = (songIds: (string | number)[]) => {
    if (songIds.length === 0) return;

    const isCurrentSongDeleted = currentSong && songIds.includes(currentSong.id);

    // 재생목록에서만 삭제
    removeFromPlaylist(songIds);

    // 현재 재생 중인 곡이 삭제된 경우 처리
    if (isCurrentSongDeleted) {
      const remainingSongs = playlistSongs.filter(song => !songIds.includes(song.id));
      if (remainingSongs.length > 0) {
        setCurrentSong(remainingSongs[0]);
      } else {
        setCurrentSong(null);
      }
    }
  };

  return (
    <MainLayout>
      <StatusBar />
      <TopBar isLoading={isLoading} />
      <div className="pb-16">
        <AnimatePresence>
          {isLoading ? (
            <motion.div 
              className="flex flex-col items-center justify-center h-[70vh] px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="w-16 h-16 mb-8 relative"
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  rotate: {
                    repeat: Infinity,
                    duration: 2,
                    ease: "linear"
                  },
                  scale: {
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut"
                  }
                }}
              >
                <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-red-500"></div>
                <div className="absolute inset-0 rounded-full border-l-4 border-r-4 border-blue-500" style={{ transform: 'rotate(45deg)' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    className="w-8 h-8 bg-gradient-to-br from-red-500 to-blue-600 rounded-full"
                    animate={{
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              </motion.div>
              
              <motion.div
                className="text-center"
                animate={{
                  y: [0, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <motion.h3 
                  className="text-xl font-bold text-white mb-2"
                  animate={{
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  음악 불러오는 중...
                </motion.h3>
                
                <motion.p 
                  className="text-white/80 text-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key={loadingMessage}
                >
                  {loadingMessage}
                </motion.p>
              </motion.div>
            </motion.div>
          ) : (
            <>
              <MixedForYou 
                songs={chapterSongs} 
                onSongSelect={handleSongSelect}
                currentSong={currentSong}
                isPlaying={isPlaying}
                onCategoryChange={handleCategoryChange}
                onPlayAll={handlePlayAll}
                onAddAllToPlaylist={handleAddAllToPlaylist}
              />
              <PopularThisMonth
                songs={filteredSongs}
                onSongSelect={handleSongSelect}
                currentSong={currentSong}
                isPlaying={isPlaying}
                onPlayAll={handlePlayAll}
                onAddAllToPlaylist={handleAddAllToPlaylist}
              />
              <TopSongs
                songs={filteredSongs}
                onSongSelect={handleSongSelect}
                currentSong={currentSong}
                isPlaying={isPlaying}
              />
              <RecentlyPlaying
                songs={newSongs} 
                onSongSelect={handleSongSelect}
                currentSong={currentSong}
                isPlaying={isPlaying}
                onPlayAll={handlePlayAll}
                onAddAllToPlaylist={handleAddAllToPlaylist}
              />
              <ListenAgain 
                songs={keyVerseSongs}
                onSongSelect={handleSongSelect}
                currentSong={currentSong}
                isPlaying={isPlaying}
              />
              <TitleSongs
                songs={titleSongs}
                onSongSelect={handleSongSelect}
                currentSong={currentSong}
                isPlaying={isPlaying}
              />
              <PlayHistory
                songs={songs}
                onSongSelect={handleSongSelect}
                currentSong={currentSong}
                isPlaying={isPlaying}
                refreshKey={historyRefreshKey}
              />
            </>
          )}
        </AnimatePresence>
      </div>
      
      {!isLoading && <NavigationBar />}
      
      {!isLoading && (
        <BottomBar
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onPrevious={handlePrevious}
          onNext={handleNext}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          isReady={isReady}
          isShuffle={isShuffle}
          onShuffleToggle={handleShuffleToggle}
          playMode={playMode}
          onPlayModeAction={handlePlayModeAction}
          onSeekBackward5={handleSeekBackward5}
          onSeekForward5={handleSeekForward5}
          onSeekToStart={handleSeekToStart}
          songs={playlistSongs}
          isDarkMode={true}
          onSongSelect={handleSongSelect}
          onMoveSong={handleMoveSong}
          onDeleteSongs={handleDeleteSongs}
        />
      )}
    </MainLayout>
  );
}
