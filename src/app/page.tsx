'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { SongWithChapter, Song } from '@/types';
import type { DropResult } from '@hello-pangea/dnd';
import {
  QueueListIcon,
  HomeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { getCachedImage } from '@/utils/imageCache';
import { getProxiedImageUrl } from '@/utils/imageUtils';

// 모든 컴포넌트를 dynamic import로 변경
const Toast = dynamic(() => import('@/components/Toast'), { ssr: false });
const Settings = dynamic(() => import('@/components/Settings'), { ssr: false });
const PlaylistView = dynamic(() => import('@/components/PlaylistView'), { ssr: false });
const LoadingScreen = dynamic(() => import('@/components/LoadingScreen'), { ssr: false });
const SearchBar = dynamic(() => import('@/components/SearchBar'), { ssr: false });
const SongGrid = dynamic(() => import('@/components/SongGrid'), { ssr: false });
const NewSongsGrid = dynamic(() => import('@/components/NewSongsGrid'), { ssr: false });
const Player = dynamic(() => import('@/components/Player'), { ssr: false });
const SongList = dynamic(() => import('@/components/SongList'), { ssr: false });
const PlaylistManager = dynamic(() => import('@/components/PlaylistManager'), { ssr: false });
const SearchResults = dynamic(() => import('@/components/SearchResults'), { ssr: false });
const SongDetailModal = dynamic(() => import('@/components/SongDetailModal'), { ssr: false });
const TopSongsGrid = dynamic(() => import('@/components/TopSongsGrid'), { ssr: false });

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [currentSong, setCurrentSong] = useState<SongWithChapter | null>(null);
  const [playlist, setPlaylist] = useState<SongWithChapter[]>([]);
  const [currentTab, setCurrentTab] = useState<'home' | 'playlist' | 'settings' | 'search'>('home');
  const [isShuffleMode, setIsShuffleMode] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinLoadingComplete, setIsMinLoadingComplete] = useState(false);
  const [isDataLoadingComplete, setIsDataLoadingComplete] = useState(false);
  const [defaultVolume, setDefaultVolume] = useState(1);
  const [autoScroll, setAutoScroll] = useState(false);
  const [lyricsFontSize, setLyricsFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [songsLoaded, setSongsLoaded] = useState(false);
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [showOnlyWithLyrics, setShowOnlyWithLyrics] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState<SongWithChapter[]>([]);
  const [allSongs, setAllSongs] = useState<SongWithChapter[]>([]);
  const [genres, setGenres] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(defaultVolume);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPosition, setLastPosition] = useState(0);
  const [isSearchPage, setIsSearchPage] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsClient(true);
    setIsLoading(true);
    
    const fetchData = async () => {
      try {
        // 곡 데이터 가져오기
        const songsResponse = await fetch('/api/songs');
        const songsData = await songsResponse.json();
        if (Array.isArray(songsData.songs)) {
          const convertedSongs = songsData.songs.map((song: any) => ({
            id: song.id,
            title: song.title,
            fileName: song.fileName,
            artist: song.artist,
            driveFileId: song.driveFileId,
            fileUrl: song.fileUrl,
            duration: song.duration,
            imageId: song.imageId,
            imageUrl: song.imageUrl,
            lyrics: song.lyrics,
            chapterId: song.chapterId,
            genreId: song.genreId,
            isNew: song.isNew,
            createdAt: new Date(song.createdAt),
            updatedAt: new Date(song.updatedAt),
            url: song.fileUrl || '',
            chapter: song.chapter,
            genre: song.genre,
            popularSong: song.popularSong
          }));
          setAllSongs(convertedSongs);
          setFilteredSongs(convertedSongs);
        } else {
          console.error('Invalid songs data format:', songsData);
        }

        // 장르 데이터 가져오기
        const genresResponse = await fetch('/api/genres');
        const genresData = await genresResponse.json();
        if (Array.isArray(genresData)) {
          setGenres(genresData.map((genre: any) => ({
            id: genre.id,
            name: genre.name,
            createdAt: genre.createdAt,
            updatedAt: genre.updatedAt
          })));
        } else {
          console.error('Invalid genres data format:', genresData);
        }

        setIsDataLoadingComplete(true);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();

    const minLoadingTimer = setTimeout(() => {
      setIsMinLoadingComplete(true);
    }, 2000);

    return () => clearTimeout(minLoadingTimer);
  }, []);

  useEffect(() => {
    if (isMinLoadingComplete && isDataLoadingComplete) {
      setIsLoading(false);
    }
  }, [isMinLoadingComplete, isDataLoadingComplete]);

  useEffect(() => {
    if (!isClient) return;
    
    const loadSettings = () => {
      const savedVolume = localStorage.getItem('defaultVolume');
      const savedAutoScroll = localStorage.getItem('autoScroll');
      const savedShowLyrics = localStorage.getItem('showLyrics');
      const savedFontSize = localStorage.getItem('lyricsFontSize');
      const savedDarkMode = localStorage.getItem('darkMode');

      if (savedVolume) setDefaultVolume(Number(savedVolume));
      if (savedAutoScroll) setAutoScroll(savedAutoScroll === 'true');
      if (savedShowLyrics) setShowLyrics(savedShowLyrics === 'true');
      if (savedFontSize) setLyricsFontSize(savedFontSize as 'small' | 'medium' | 'large');
      if (savedDarkMode) setIsDarkMode(savedDarkMode === 'true');
    };

    loadSettings();
  }, [isClient]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('autoScroll', autoScroll.toString());
      localStorage.setItem('showLyrics', showLyrics.toString());
      localStorage.setItem('lyricsFontSize', lyricsFontSize);
      localStorage.setItem('darkMode', isDarkMode.toString());
      localStorage.setItem('defaultVolume', defaultVolume.toString());
    }
  }, [autoScroll, showLyrics, lyricsFontSize, isDarkMode, defaultVolume]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('darkMode');
      setIsDarkMode(savedDarkMode === 'true');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', isDarkMode.toString());
    }
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = defaultVolume;  // 100으로 나누지 않음

    // 이전 업데이트 시간을 저장할 변수
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 50; // 50ms로 줄여서 더 부드럽게

    const handleTimeUpdate = () => {
      const now = Date.now();
      // 마지막 업데이트로부터 일정 시간이 지났을 때만 업데이트
      if (now - lastUpdateTime >= UPDATE_INTERVAL) {
        requestAnimationFrame(() => {
          setCurrentTime(audio.currentTime);
        });
        lastUpdateTime = now;
      }
    };
    const handleLoadedMetadata = () => {
      const audio = audioRef.current;
      if (audio) {
        setDuration(audio.duration);
        setIsAudioReady(true);
        
        // 저장된 위치가 있으면 해당 위치로 이동
        if (lastPosition > 0 && lastPosition < audio.duration) {
          console.log('Restoring position on loadedmetadata:', lastPosition);
          audio.currentTime = lastPosition;
        }
        
        // 시킹 가능 여부 확인
        const seekable = audio.seekable;
        if (seekable && seekable.length > 0) {
          console.log('Seekable ranges:', 
            Array.from({length: seekable.length}, (_, i) => 
              `${seekable.start(i)}-${seekable.end(i)}`
            )
          );
        }
      }
    };
    const handleEnded = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (repeatMode === 'one') {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error replaying song:', error);
          });
        }
      } else {
        const currentIndex = playlist.findIndex(s => s.id === currentSong?.id);
        
        // 다음 곡 인덱스 계산
        let nextIndex = currentIndex + 1;
        if (nextIndex >= playlist.length) {
          if (repeatMode === 'all') {
            nextIndex = 0;
          } else {
            setIsPlaying(false);
            return;
          }
        }

        // lastPosition 초기화 및 다음 곡 재생
        setLastPosition(0);
        setCurrentSong(playlist[nextIndex]);
        setIsPlaying(true);
      }
    };
    const handleError = (e: ErrorEvent) => {
      console.error('Audio error:', e);
      const audio = audioRef.current;
      if (audio && audio.error) {
        console.error('Error code:', audio.error.code);
        console.error('Error message:', audio.error.message);
      }
      setError('오디오 파일을 로드하는 중 오류가 발생했습니다.');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audioRef.current = null;
    };
  }, [lastPosition, repeatMode, playlist.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.fileUrl) return;
    
    setIsAudioReady(false);
    setError(null);

    try {
      // Google Drive 파일 ID 추출
      const fileId = currentSong.fileUrl.split('id=')[1];
      if (!fileId) {
        throw new Error('유효하지 않은 Google Drive URL입니다.');
      }

      // 프록시 API를 통해 스트리밍
      const proxyUrl = `/api/proxy/${fileId}`;
      
      // 현재 재생 중인 곡과 같은 곡이면 소스를 변경하지 않음
      if (audio.src !== proxyUrl) {
        audio.src = proxyUrl;
        audio.preload = 'metadata';
        
        // 메타데이터 로드 후 자동재생
        const handleLoaded = () => {
          if (isPlaying) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error('Error auto-playing:', error);
                setIsPlaying(false);
              });
            }
          }
          audio.removeEventListener('loadedmetadata', handleLoaded);
        };
        
        audio.addEventListener('loadedmetadata', handleLoaded);
      }
    } catch (error) {
      console.error('Error setting audio source:', error);
      setError('오디오 소스를 설정하는 중 오류가 발생했습니다.');
    }
  }, [currentSong, isPlaying]);

  const filterSongs = useCallback((songs: SongWithChapter[]) => {
    let filtered = songs;

    // 검색어 필터 적용
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(searchLower) ||
        (song.artist?.toLowerCase() || '').includes(searchLower)
      );
    }

    // 장르 필터 적용
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(song =>
        song.genre?.id && selectedGenres.includes(song.genre.id)
      );
    }

    // 새로운 곡 필터 적용
    if (showOnlyNew) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(song =>
        new Date(song.createdAt) > thirtyDaysAgo
      );
    }

    setFilteredSongs(filtered);
  }, [debouncedSearchTerm, selectedGenres, showOnlyNew]);

  useEffect(() => {
    filterSongs(allSongs);
  }, [allSongs, filterSongs, debouncedSearchTerm, selectedGenres]);

  useEffect(() => {
    console.log('Current filtered songs:', filteredSongs);
  }, [filteredSongs]);

  const handleTabChange = useCallback((tab: 'home' | 'playlist' | 'settings' | 'search') => {
    if (currentTab === tab || isTabTransitioning) return;
    
    setIsTabTransitioning(true);
    setCurrentTab(tab);
    
    // 300ms 후에 전환 상태 해제
    setTimeout(() => {
      setIsTabTransitioning(false);
    }, 300);
  }, [currentTab, isTabTransitioning]);

  const handleSongSelect = useCallback((song: SongWithChapter) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
    setIsAudioReady(false);
    setError(null);

    // 현재 재생 중인 곡의 장르와 챕터 정보 저장
    try {
      const chapter = song.chapter;
      const genre = song.genre;

      if (chapter?.id !== undefined && chapter?.id !== null) {
        localStorage.setItem('lastChapterId', chapter.id.toString());
      }
      if (genre?.id !== undefined && genre?.id !== null) {
        localStorage.setItem('lastGenreId', genre.id);
      }
    } catch (error) {
      console.error('Failed to save song info to localStorage:', error);
    }

    // 노래 선택 시 재생목록에 추가
    if (!playlist.some(s => s.id === song.id)) {
      setPlaylist(prev => [...prev, song]);
    }
  }, [playlist]);

  const handleAddToPlaylist = async (song: Song) => {
    if (!playlist.some(s => s.id === song.id)) {
      try {
        const addPosition = await showAddPositionModal();
        const songWithChapter = convertToSongWithChapter(song);
        let newPlaylist = [...playlist];
        
        if (addPosition === 'after_current' && currentSong) {
          const currentIndex = playlist.findIndex(s => s.id === currentSong.id);
          newPlaylist.splice(currentIndex + 1, 0, songWithChapter);
        } else if (addPosition === 'at_end') {
          newPlaylist.push(songWithChapter);
        }
        
        setPlaylist(newPlaylist);
        localStorage.setItem('playlist', JSON.stringify(newPlaylist));
        
        // 현재 재생 중인 곡이 없을 때는 추가된 곡을 바로 재생
        if (!currentSong) {
          setLastPosition(0);  // lastPosition 초기화
          localStorage.removeItem('lastPosition');
          setCurrentSong(songWithChapter);
          setIsPlaying(true);
        }
        
        toast('재생목록에 추가되었습니다');
      } catch (error) {
        console.error('Failed to add song to playlist:', error);
      }
    } else {
      toast('이미 재생목록에 있는 곡입니다');
    }
  };

  const handleNextSong = () => {
    if (!currentSong || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(s => s.id === currentSong?.id);
    if (currentIndex < playlist.length - 1) {
      setCurrentSong(playlist[currentIndex + 1]);
    }
  };

  const handlePrevSong = () => {
    if (!currentSong || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(s => s.id === currentSong?.id);
    if (currentIndex > 0) {
      setCurrentSong(playlist[currentIndex - 1]);
    }
  };

  const handleRemoveSongAction = (songsToRemove: SongWithChapter[]) => {
    const newPlaylist = playlist.filter(
      song => !songsToRemove.some(s => s.id === song.id)
    );
    setPlaylist(newPlaylist);
    localStorage.setItem('playlist', JSON.stringify(newPlaylist));
    toast('선택한 곡이 재생목록에서 제거되었습니다');
  };

  const handleShufflePlaylistAction = () => {
    setIsShuffleMode(!isShuffleMode);
    if (!isShuffleMode) {
      const shuffledPlaylist = [...playlist].sort(() => Math.random() - 0.5);
      setPlaylist(shuffledPlaylist);
      toast('재생목록이 셔플되었습니다');
    } else {
      const sortedPlaylist = [...playlist].sort((a, b) => {
        return a.title.localeCompare(b.title);
      });
      setPlaylist(sortedPlaylist);
      toast('재생목록이 원래 순서로 정렬되었습니다');
    }
  };

  const handleRepeatModeChangeAction = useCallback(() => {
    setRepeatMode(prev => {
      const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
      const currentIndex = modes.indexOf(prev);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      
      let message = '';
      switch (nextMode) {
        case 'none':
          message = '반복 재생이 해제되었습니다';
          break;
        case 'one':
          message = '한 곡 반복 재생이 설정되었습니다';
          break;
        case 'all':
          message = '전체 반복 재생이 설정되었습니다';
          break;
      }
      toast(message);
      
      return nextMode;
    });
  }, []);

  const handleReorderPlaylist = useCallback((result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(playlist);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setPlaylist(items);
    localStorage.setItem('playlist', JSON.stringify(items));
  }, [playlist]);

  const handleSongChange = (song: Song) => {
    setCurrentSong(convertToSongWithChapter(song));
  };

  const handlePlayAll = async (songs: Song[]) => {
    // 기존 재생목록 초기화
    setPlaylist([]);
    localStorage.removeItem('playlist');
    
    // 새로운 재생목록 설정 (fileName 기준으로 정렬)
    const songsWithChapter = songs.map(convertToSongWithChapter);
    const sortedSongs = [...songsWithChapter].sort((a, b) => {
      if (a.fileName && b.fileName) {
        // fileName 형식: "1-1", "1-2" 등
        const [chapterA, numberA] = a.fileName.split('-').map(Number);
        const [chapterB, numberB] = b.fileName.split('-').map(Number);
        
        // 장 번호로 먼저 비교
        if (chapterA !== chapterB) {
          return chapterA - chapterB;
        }
        // 같은 장이면 순번으로 비교
        return numberA - numberB;
      }
      return 0;
    });
    
    setPlaylist(sortedSongs);
    localStorage.setItem('playlist', JSON.stringify(sortedSongs));
    
    // 첫 번째 곡부터 재생
    if (sortedSongs.length > 0) {
      setCurrentSong(sortedSongs[0]);
      setIsPlaying(true);
    }
    
    toast('전체 곡이 재생목록에 추가되었습니다');
  };

  const handleThemeChange = (isDark: boolean) => {
    setIsDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('light', !isDark);
    }
  };

  const handleSettingsClick = () => {
    handleTabChange('settings');
    setShowLyrics(false);
  };

  // 추가 위치 선택 모달
  const showAddPositionModal = () => {
    return new Promise<'after_current' | 'at_end' | null>((resolve, reject) => {
      if (typeof window === 'undefined') return reject('cancelled');

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 flex items-center justify-center bg-black/50 z-50';
      modal.innerHTML = `
        <div class="bg-[#191919] rounded-lg p-4 w-80">
          <h3 class="text-white text-lg font-bold mb-4">추가 위치 선택</h3>
          <div class="space-y-2">
            <button class="w-full py-2 px-4 rounded bg-white/10 hover:bg-white/20 text-white" id="afterCurrent">
              현재 곡 다음에 추가
            </button>
            <button class="w-full py-2 px-4 rounded bg-white/10 hover:bg-white/20 text-white" id="atEnd">
              재생목록 맨 뒤에 추가
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // 모달 제거 함수
      const removeModal = () => {
        document.body.removeChild(modal);
      };

      modal.querySelector('#afterCurrent')?.addEventListener('click', () => {
        removeModal();
        resolve('after_current');
      });

      modal.querySelector('#atEnd')?.addEventListener('click', () => {
        removeModal();
        resolve('at_end');
      });

      // 배경 클릭 시 취소
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          removeModal();
          reject('cancelled');
        }
      });

      // ESC 키 누를 때 취소
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          removeModal();
          reject('cancelled');
          window.removeEventListener('keydown', handleEsc);
        }
      };
      window.addEventListener('keydown', handleEsc);
    });
  };

  const handleLyricsChange = (show: boolean) => {
    setShowLyrics(show);
    if (typeof window !== 'undefined') {
      localStorage.setItem('showLyrics', String(show));
    }
  };

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setDefaultVolume(newVolume);
    localStorage.setItem('defaultVolume', String(newVolume));
  }, []);

  const handleSeek = useCallback((newTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    
    if (isPlaying) {
      // 일시정지 시 현재 위치 저장
      const currentPos = audio.currentTime;
      setLastPosition(currentPos);
      localStorage.setItem('lastPosition', currentPos.toString());
      console.log('Saving position:', currentPos);
      
      audio.pause();
      setIsPlaying(false);
      
      // 일시정지 시 Seekable ranges 로그
      const seekable = audio.seekable;
      if (seekable && seekable.length > 0) {
        console.log('Seekable ranges:', 
          Array.from({length: seekable.length}, (_, i) => 
            `${seekable.start(i)}-${seekable.end(i)}`
          )
        );
      }
    } else {
      // 저장된 위치가 있으면 해당 위치부터 재생
      const savedPosition = parseFloat(localStorage.getItem('lastPosition') || '0');
      if (savedPosition > 0 && savedPosition < audio.duration) {
        console.log('Restoring position:', savedPosition);
        audio.currentTime = savedPosition;
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            // 재생 시 Seekable ranges 로그
            const seekable = audio.seekable;
            if (seekable && seekable.length > 0) {
              console.log('Seekable ranges after play:', 
                Array.from({length: seekable.length}, (_, i) => 
                  `${seekable.start(i)}-${seekable.end(i)}`
                )
              );
            }
          })
          .catch((error: Error) => {
            console.error('Error playing audio:', error);
            setError('재생 중 오류가 발생했습니다.');
            setIsPlaying(false);
          });
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    const savedPosition = parseFloat(localStorage.getItem('lastPosition') || '0');
    if (savedPosition > 0) {
      setLastPosition(savedPosition);
    }
  }, []);

  useEffect(() => {
    if (currentSong) {
      localStorage.removeItem('lastPosition');
      setLastPosition(0);
    }
  }, [currentSong?.id]);

  const toast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 2000);
  };

  // 타입 캐스팅을 위한 헬퍼 함수
  const convertToSongWithChapter = (song: Song): SongWithChapter => {
    return {
      id: song.id,
      title: song.title,
      fileName: song.fileName,
      artist: song.artist,
      driveFileId: song.driveFileId,
      fileUrl: song.fileUrl || '',
      duration: song.duration,
      imageId: song.imageId,
      imageUrl: song.imageUrl,
      lyrics: song.lyrics || '',
      chapterId: song.chapterId,
      genreId: song.genreId,
      isNew: song.isNew,
      createdAt: new Date(song.createdAt),
      updatedAt: new Date(song.updatedAt),
      url: song.fileUrl || '',
      chapter: (song as any).chapter,
      genre: (song as any).genre,
      popularSong: (song as any).popularSong
    };
  };

  const handleSearchChange = useCallback((query: string) => {
    setSearchTerm(query);
    if (query || selectedGenres.length > 0) {
      setIsSearchPage(true);
    }
  }, [selectedGenres.length]);

  const handleGenreSelect = useCallback((selectedGenres: string[]) => {
    setSelectedGenres(selectedGenres);
    if (selectedGenres.length > 0 || searchTerm) {
      setIsSearchPage(true);
    }
  }, [searchTerm]);

  const handleBackToHome = useCallback(() => {
    setIsSearchPage(false);
    setSearchTerm('');
    setSelectedGenres([]);
  }, []);

  const handleAutoScrollChange = useCallback((value: boolean) => {
    setAutoScroll(value);
  }, []);

  const handleLyricsFontSizeChange = useCallback((size: 'small' | 'medium' | 'large') => {
    setLyricsFontSize(size);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchModalOpen(false);
  }, []);

  const handlePlayPauseAction = useCallback(() => {
    handlePlayPause();
  }, [handlePlayPause]);

  const handlePrevAction = useCallback(() => {
    handlePrevSong();
  }, [handlePrevSong]);

  const handleNextAction = useCallback(() => {
    handleNextSong();
  }, [handleNextSong]);

  const handleSeekAction = useCallback((time: number) => {
    handleSeek(time);
  }, [handleSeek]);

  const handleVolumeChangeAction = useCallback((volume: number) => {
    handleVolumeChange(volume);
  }, [handleVolumeChange]);

  const handleToggleLyricsAction = useCallback(() => {
    setShowLyrics(prev => !prev);
  }, []);

  const handleShuffleModeAction = useCallback(() => {
    setIsShuffleMode(!isShuffleMode);
  }, [isShuffleMode]);

  const handleSeekBackward5Action = useCallback(() => {
    handleSeek(currentTime - 5);
  }, [currentTime, handleSeek]);

  const handleSeekForward5Action = useCallback(() => {
    handleSeek(currentTime + 5);
  }, [currentTime, handleSeek]);

  const handleSeekToStartAction = useCallback(() => {
    handleSeek(0);
  }, [handleSeek]);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <main className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {isLoading && <LoadingScreen isDarkMode={isDarkMode} />}
        
        {/* 메인 컨텐츠 */}
        <div className="flex-1 overflow-y-auto pb-32">
          {currentTab === 'playlist' ? (
            <PlaylistManager
              currentSong={currentSong}
              playlist={playlist}
              onSongSelectAction={handleSongSelect}
              onRemoveSongAction={handleRemoveSongAction}
              isDarkMode={isDarkMode}
              isAudioReady={isAudioReady}
              onReorderPlaylistAction={handleReorderPlaylist}
            />
          ) : currentTab === 'settings' ? (
            <div className="px-4">
              <Settings 
                isDarkMode={isDarkMode}
                onThemeChangeAction={handleThemeChange}
                defaultVolume={defaultVolume}
                onVolumeChangeAction={handleVolumeChange}
              />
            </div>
          ) : (
            <div>
              <SongGrid
                songs={filteredSongs}
                onSongSelect={handleSongSelect}
                onPlayAllAction={handlePlayAll}
                isDarkMode={isDarkMode}
                genres={genres}
                selectedGenres={selectedGenres}
                onGenreSelect={handleGenreSelect}
                showOnlyNew={false}
                showOnlyWithLyrics={false}
                toast={toast}
                id="all"
                name="전체 곡"
              />
            </div>
          )}
        </div>

        {/* 플레이어 */}
        <Player
          currentSong={currentSong}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onPrevious={handlePrevSong}
          onNext={handleNextSong}
          onSeek={handleSeek}
          isShuffle={isShuffleMode}
          onShuffleToggle={handleShuffleModeAction}
          playMode={repeatMode}
          onPlayModeAction={handleRepeatModeChangeAction}
          onSeekBackward5={handleSeekBackward5Action}
          onSeekForward5={handleSeekForward5Action}
          onSeekToStart={handleSeekToStartAction}
          disabled={!isAudioReady}
          songs={playlist}
          isDarkMode={isDarkMode}
        />

        {/* 하단 네비게이션 */}
        <nav className={`
          fixed bottom-0 left-0 right-0 z-40 border-t
          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        `}>
          <div className="flex items-center justify-around h-14">
            <button
              onClick={() => setCurrentTab('home')}
              className={`
                flex flex-col items-center justify-center w-full h-full
                ${currentTab === 'home'
                  ? isDarkMode ? 'text-blue-400' : 'text-blue-500'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }
              `}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="text-xs mt-1">홈</span>
            </button>

            <button
              onClick={() => setCurrentTab('playlist')}
              className={`
                flex flex-col items-center justify-center w-full h-full
                ${currentTab === 'playlist'
                  ? isDarkMode ? 'text-blue-400' : 'text-blue-500'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }
              `}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <span className="text-xs mt-1">재생목록</span>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`
                flex flex-col items-center justify-center w-full h-full
                ${currentTab === 'settings'
                  ? isDarkMode ? 'text-blue-400' : 'text-blue-500'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }
              `}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              <span className="text-xs mt-1">설정</span>
            </button>
          </div>
        </nav>

        {/* 토스트 메시지 */}
        {isToastVisible && (
          <Toast
            message={toastMessage}
            isVisible={isToastVisible}
          />
        )}

        {/* 검색 모달 */}
        {isSearchModalOpen && (
          <div className={`
            fixed inset-0 z-50 flex items-center justify-center p-4
            ${isDarkMode ? 'bg-black/50' : 'bg-gray-500/50'}
          `}>
            <div className={`
              w-full max-w-md rounded-lg shadow-xl p-6
              ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
            `}>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="곡 제목 또는 아티스트 검색..."
                  className={`
                    w-full px-4 py-2 rounded-lg mb-4
                    ${isDarkMode
                      ? 'bg-gray-700 text-white placeholder-gray-400'
                      : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                    }
                  `}
                  autoFocus
                />
              </form>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setIsSearchModalOpen(false);
                  }}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    ${isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  초기화
                </button>
                <button
                  onClick={() => setIsSearchModalOpen(false)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    ${isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 장르 필터 모달 */}
        {isGenreModalOpen && (
          <div className={`
            fixed inset-0 z-50 flex items-center justify-center p-4
            ${isDarkMode ? 'bg-black/50' : 'bg-gray-500/50'}
          `}>
            <div className={`
              w-full max-w-md rounded-lg shadow-xl p-6
              ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
            `}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                장르 선택
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {genres.map(genre => (
                  <button
                    key={genre.id}
                    onClick={() => handleGenreSelect([genre.id])}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-colors
                      ${selectedGenres.includes(genre.id)
                        ? isDarkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setIsGenreModalOpen(false)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    ${isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 전체 가사 모달 */}
        {showDetail && currentSong && (
          <SongDetailModal
            song={currentSong}
            onClose={() => setShowDetail(false)}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onPlayPauseAction={handlePlayPause}
            onPrevAction={handlePrevSong}
            onNextAction={handleNextSong}
            onSeekAction={handleSeek}
            onSeekBackward5Action={handleSeekBackward5Action}
            onSeekForward5Action={handleSeekForward5Action}
            onSeekToStartAction={handleSeekToStartAction}
            playMode={repeatMode}
            onPlayModeAction={handleRepeatModeChangeAction}
            isShuffle={isShuffleMode}
            onShuffleAction={handleShuffleModeAction}
            isDarkMode={isDarkMode}
          />
        )}
      </main>
    </div>
  );
}
