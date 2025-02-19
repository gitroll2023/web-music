'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Song, Chapter } from '@prisma/client';
import { FiEdit2, FiTrash2, FiStar, FiClock, FiList, FiPlusCircle, FiCopy } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import LyricsTimestampEditorV2 from '@/components/LyricsTimestampEditorV2';
import { getApiUrl } from '@/utils/config';

interface SongWithChapter extends Song {
  chapter: Chapter | null;
  popularSong: any;
}

interface FormData {
  title: string;
  artist: string;
  chapter: string;
  chapterId: number;
  genreId: string;
  audioFile: File | null;
  imageFile: File | null;
  lyrics: string;
  lyricsFile: File | null;
  isNew: boolean;
  driveFileId: string;
  fileUrl: string;
  duration: string;
  imageId: string;
  imageUrl: string;
}

interface Genre {
  id: string;
  name: string;
}

interface LyricsCard {
  id: number;
  timestamp: string;
  lyrics: string;
  musicStyle: string;
  explanation: string;
  section: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [songs, setSongs] = useState<SongWithChapter[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongWithChapter | null>(null);
  const [showLyricsEditorV2, setShowLyricsEditorV2] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'genres' | 'lyrics' | 'popular' | 'new'>('list');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    artist: 'Various Artists',
    chapter: '',
    chapterId: 0,
    genreId: '',
    audioFile: null,
    imageFile: null,
    lyrics: '',
    lyricsFile: null,
    isNew: false,
    driveFileId: '',
    fileUrl: '',
    duration: '',
    imageId: '',
    imageUrl: ''
  });
  const [genreFormData, setGenreFormData] = useState({ id: '', name: '' });
  const [editingGenreId, setEditingGenreId] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [lyricsCards, setLyricsCards] = useState<LyricsCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  type TabButtonProps = {
    active: boolean;
    onClick: () => void;
    icon: string;
    text: string;
    color: 'violet' | 'fuchsia' | 'blue' | 'emerald' | 'amber' | 'rose';
  };

  const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, text, color }) => {
    const colors: Record<TabButtonProps['color'], string> = {
      violet: 'hover:bg-violet-50 active:bg-violet-500',
      fuchsia: 'hover:bg-fuchsia-50 active:bg-fuchsia-500',
      blue: 'hover:bg-blue-50 active:bg-blue-500',
      emerald: 'hover:bg-emerald-50 active:bg-emerald-500',
      amber: 'hover:bg-amber-50 active:bg-amber-500',
      rose: 'hover:bg-rose-50 active:bg-rose-500',
    };

    const activeColors: Record<TabButtonProps['color'], string> = {
      violet: 'bg-violet-500',
      fuchsia: 'bg-fuchsia-500',
      blue: 'bg-blue-500',
      emerald: 'bg-emerald-500',
      amber: 'bg-amber-500',
      rose: 'bg-rose-500',
    };

    return (
      <button
        onClick={onClick}
        className={`flex items-center px-4 py-2 ${active ? `text-white ${activeColors[color]}` : `text-gray-600 ${colors[color]}`} ${text === '곡목록' ? 'pl-6' : ''}`}
      >
        <span className="mr-2">{icon}</span>
        {text}
      </button>
    );
  };

  // 챕터 목록 생성
  const chapters = Array.from({ length: 22 }, (_, i) => ({
    id: (i + 1).toString(),
    name: `계시록 ${i + 1}장`
  }));

  // 초기 데이터 로딩
  useEffect(() => {
    fetchSongs();
    fetchGenres();
  }, []);

  // 탭 변경시 데이터 다시 로딩
  useEffect(() => {
    if (activeTab === 'genres') {
      fetchGenres();
    } else if (activeTab === 'list') {
      fetchSongs();
    }
  }, [activeTab]);

  // 곡 목록 불러오기
  const fetchSongs = async () => {
    try {
      const response = await fetch(getApiUrl('/api/songs?limit=100')); // 한 번에 더 많은 곡을 가져오도록 수정
      if (!response.ok) throw new Error('Failed to fetch songs');
      const data = await response.json();
      setSongs(data.songs); // songs 배열은 data.songs에 있음
    } catch (error) {
      console.error('Error fetching songs:', error);
      toast.error('곡 목록을 불러오는데 실패했습니다.');
    }
  };

  // 장르 목록 불러오기
  const fetchGenres = async () => {
    try {
      const response = await fetch(getApiUrl('/api/genres'));
      if (!response.ok) throw new Error('Failed to fetch genres');
      const data = await response.json();
      setGenres(data);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = async (file: File, type: 'audio' | 'image') => {
    if (!file || !formData.chapter) return null;

    try {
      // Access Token 가져오기
      const tokenResponse = await fetch(getApiUrl('/api/auth/get-access-token'));
      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }
      const { accessToken } = await tokenResponse.json();

      // 파일 메타데이터 설정
      const metadata = {
        name: `${formData.chapter}_${type}_${file.name}`,
        parents: [formData.chapter] // 챕터 ID를 부모 폴더로 사용
      };

      // 폼 데이터 생성
      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', file);

      // Google Drive API 직접 호출
      const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to Google Drive');
      }

      const data = await uploadResponse.json();
      
      // 파일 권한 설정 (공개)
      await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });

      return {
        fileId: data.id,
        fileUrl: `https://drive.google.com/uc?export=view&id=${data.id}`,
        fileName: data.name
      };
    } catch (error) {
      console.error(`Error uploading ${type} file:`, error);
      toast.error(`${type === 'audio' ? '오디오' : '이미지'} 파일 업로드 중 오류가 발생했습니다.`);
      return null;
    }
  };

  // 곡 생성
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.chapter) return;

    setIsLoading(true);
    try {
      let audioUploadResult = null;
      let imageUploadResult = null;

      if (formData.audioFile) {
        audioUploadResult = await handleFileUpload(formData.audioFile, 'audio');
        if (!audioUploadResult) return;
      }

      if (formData.imageFile) {
        imageUploadResult = await handleFileUpload(formData.imageFile, 'image');
        if (!imageUploadResult) return;
      }

      const form = new FormData();
      form.append('title', formData.title);
      form.append('artist', formData.artist);
      form.append('chapter', formData.chapter);
      form.append('genreId', formData.genreId || '');
      form.append('lyrics', formData.lyrics || '');
      form.append('isNew', String(formData.isNew));

      if (audioUploadResult) {
        form.append('driveFileId', audioUploadResult.fileId);
        form.append('fileUrl', audioUploadResult.fileUrl);
      }

      if (imageUploadResult) {
        form.append('imageId', imageUploadResult.fileId);
        form.append('imageUrl', imageUploadResult.fileUrl);
      }

      const response = await fetch(getApiUrl('/api/songs'), {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        throw new Error('Failed to create song');
      }

      toast.success('곡이 성공적으로 추가되었습니다.');
      setIsLoading(false);
      setShowModal(false);
      setFormData({
        title: '',
        artist: 'Various Artists',
        chapter: '',
        chapterId: 0,
        genreId: '',
        audioFile: null,
        imageFile: null,
        lyrics: '',
        lyricsFile: null,
        isNew: false,
        driveFileId: '',
        fileUrl: '',
        duration: '',
        imageId: '',
        imageUrl: ''
      });
      fetchSongs();
    } catch (error) {
      console.error('Error creating song:', error);
      toast.error('곡 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 곡 수정
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSong || !formData.title || !formData.chapter) return;

    setIsLoading(true);
    try {
      // 기존 파일 정보
      const currentDriveFileId = selectedSong.driveFileId;
      const currentImageId = selectedSong.imageId;

      // 새 파일이 업로드된 경우 기존 파일 삭제
      if (formData.driveFileId && formData.driveFileId !== currentDriveFileId) {
        if (currentDriveFileId) {
          await fetch(getApiUrl(`/api/drive/delete/${currentDriveFileId}`), {
            method: 'DELETE'
          });
        }
      }

      if (formData.imageId && formData.imageId !== currentImageId) {
        if (currentImageId) {
          await fetch(getApiUrl(`/api/drive/delete/${currentImageId}`), {
            method: 'DELETE'
          });
        }
      }

      const response = await fetch(getApiUrl(`/api/songs/${selectedSong.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          artist: formData.artist,
          chapterId: parseInt(formData.chapter),
          genreId: formData.genreId,
          lyrics: formData.lyrics,
          isNew: formData.isNew,
          driveFileId: formData.driveFileId || currentDriveFileId,
          fileUrl: formData.fileUrl,
          duration: formData.duration,
          imageId: formData.imageId || currentImageId,
          imageUrl: formData.imageUrl
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update song');
      }

      // 성공적으로 업데이트된 경우
      toast.success('곡이 성공적으로 수정되었습니다.');
      setIsLoading(false);
      setShowModal(false);
      setIsEditing(false);
      setSelectedSong(null);
      fetchSongs(); // 목록 새로고침
    } catch (error) {
      console.error('Error updating song:', error);
      toast.error('곡 수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 곡 삭제
  const handleDelete = async (id: number) => {
    if (!window.confirm('정말로 이 곡을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/songs/${id}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete song');
      }

      // 성공적으로 삭제되면 목록에서도 제거
      setSongs(prev => prev.filter(song => song.id !== id));
      router.refresh();
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('곡을 삭제하는 중 오류가 발생했습니다.');
    }
  };

  // 수정 모드로 전환
  const handleEdit = (song: SongWithChapter) => {
    setSelectedSong(song);
    setIsEditing(true);
    setModalMode('edit');
    setShowModal(true);
    const newFormData: FormData = {
      title: song.title,
      artist: song.artist || 'Various Artists',
      chapter: String(song.chapterId),
      chapterId: song.chapterId,
      genreId: song.genreId || '',
      audioFile: null,
      imageFile: null,
      lyrics: song.lyrics || '',
      lyricsFile: null,
      isNew: song.isNew || false,
      driveFileId: song.driveFileId || '',
      fileUrl: song.fileUrl || '',
      duration: song.duration || '',
      imageId: song.imageId || '',
      imageUrl: song.imageUrl || ''
    };
    setFormData(newFormData);
  };

  // 인기곡 토글
  const togglePopularSong = async (song: SongWithChapter) => {
    try {
      if (song.popularSong) {
        // 인기곡에서 제거
        await fetch(getApiUrl(`/api/popular-songs?id=${song.popularSong.id}`), {
          method: 'DELETE',
        });
      } else {
        // 인기곡으로 추가
        await fetch(getApiUrl('/api/popular-songs'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ songId: song.id }),
        });
      }
      fetchSongs();
    } catch (error) {
      console.error('Error toggling popular song:', error);
    }
  };

  // 가사 파일 읽기 함수
  const handleLyricsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData(prev => ({ ...prev, lyricsFile: file }));

    try {
      const text = await file.text();
      setFormData(prev => ({ ...prev, lyrics: text }));
    } catch (error) {
      console.error('Error reading lyrics file:', error);
    }
  };

  // 폼 입력 처리
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 파일 입력 처리
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'image' | 'lyrics') => {
    const file = e.target.files?.[0];
    console.log(`Selected ${type} file:`, file);
    if (file) {
      if (type === 'lyrics') {
        // txt 파일 읽기
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setFormData(prev => ({
            ...prev,
            lyrics: content,
            lyricsFile: file
          }));
        };
        reader.readAsText(file);
      } else {
        setFormData(prev => ({
          ...prev,
          [type === 'audio' ? 'audioFile' : 'imageFile']: file
        }));
      }
    }
  };

  // 챕터별로 곡 정렬
  const sortedSongs = Array.isArray(songs) 
    ? [...songs].sort((a, b) => {
        const chapterNameA = a?.chapter?.name || '';
        const chapterNameB = b?.chapter?.name || '';
        
        if (chapterNameA < chapterNameB) return -1;
        if (chapterNameA > chapterNameB) return 1;
        return 0;
      }) 
    : [];

  // 필터링된 곡 목록을 반환하는 함수
  const getFilteredSongs = () => {
    return sortedSongs.filter(song => {
      const matchesChapter = selectedChapter === '전체' || song.chapter?.name === selectedChapter;
      const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesChapter && matchesSearch;
    });
  };

  // 챕터별로 곡을 그룹화하는 함수
  const getSongsByChapter = (): [string, SongWithChapter[]][] => {
    const filteredSongs = getFilteredSongs();
    const groupedSongs: { [key: string]: SongWithChapter[] } = {};
    
    // 전체 보기일 때는 챕터별로 그룹화
    if (selectedChapter === '전체') {
      filteredSongs.forEach(song => {
        const chapter = song.chapter?.name || '기타';
        if (!groupedSongs[chapter]) {
          groupedSongs[chapter] = [];
        }
        groupedSongs[chapter].push(song);
      });
      
      // 챕터 순서대로 정렬 (계시록 1장 ~ 22장)
      return Object.entries(groupedSongs).sort((a, b) => {
        const aNum = parseInt(a[0].match(/\d+/)?.[0] || '0');
        const bNum = parseInt(b[0].match(/\d+/)?.[0] || '0');
        return aNum - bNum;
      });
    } else {
      // 특정 챕터가 선택되었을 때는 해당 챕터만 표시
      return [[selectedChapter, filteredSongs]];
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedSong(null);
    setFormData({
      title: '',
      artist: 'Various Artists',
      chapter: '',
      chapterId: 0,
      genreId: '',
      audioFile: null,
      imageFile: null,
      lyrics: '',
      lyricsFile: null,
      isNew: false,
      driveFileId: '',
      fileUrl: '',
      duration: '',
      imageId: '',
      imageUrl: ''
    });
  };

  // 장르 생성
  const handleCreateGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genreFormData.id || !genreFormData.name) return;

    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/genres'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(genreFormData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const newGenre = await response.json();
      setGenres(prev => [...prev, newGenre]);
      setGenreFormData({ id: '', name: '' });
    } catch (error) {
      console.error('Error creating genre:', error);
      alert(error instanceof Error ? error.message : '장르 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 장르 수정
  const handleUpdateGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genreFormData.id || !genreFormData.name) return;

    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/genres'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(genreFormData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const updatedGenre = await response.json();
      setGenres(prev =>
        prev.map(genre => (genre.id === updatedGenre.id ? updatedGenre : genre))
      );
      setGenreFormData({ id: '', name: '' });
      setEditingGenreId(null);
    } catch (error) {
      console.error('Error updating genre:', error);
      alert(error instanceof Error ? error.message : '장르 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 장르 삭제
  const handleDeleteGenre = async (id: string) => {
    if (!confirm('정말 이 장르를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(getApiUrl(`/api/genres?id=${id}`), {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setGenres(prev => prev.filter(genre => genre.id !== id));
    } catch (error) {
      console.error('Error deleting genre:', error);
      alert(error instanceof Error ? error.message : '장르 삭제에 실패했습니다.');
    }
  };

  // 장르 수정 시작
  const handleEditGenre = (genre: Genre) => {
    setGenreFormData(genre);
    setEditingGenreId(genre.id);
  };

  // 장르 수정 취소
  const handleCancelEditGenre = () => {
    setGenreFormData({ id: '', name: '' });
    setEditingGenreId(null);
  };

  // AI 가사 생성
  const generateLyrics = async () => {
    if (!selectedChapter || selectedChapter === '전체' || !selectedGenre) {
      alert('장과 장르를 선택해주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(getApiUrl('/api/generate-lyrics'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter: parseInt(selectedChapter.match(/\d+/)?.[0] || '0'),
          genre: selectedGenre
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate lyrics');
      }
      
      setLyricsCards(data);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error generating lyrics:', error);
      alert(error?.message || '가사 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 가사 카드 복사
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('클립보드에 복사되었습니다.');
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('복사에 실패했습니다.');
    }
  };

  // 챕터 선택 시 아티스트도 자동으로 설정
  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedChapterId = e.target.value;
    const selectedChapter = chapters.find(ch => ch.id === selectedChapterId);
    
    setFormData(prev => ({
      ...prev,
      chapter: selectedChapterId,
      chapterId: parseInt(selectedChapterId)
    }));
  };

  // 인기곡 순서 변경
  const handleReorderPopularSong = async (songId: number, newOrder: number) => {
    try {
      await fetch(getApiUrl('/api/popular-songs/reorder'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId, newOrder }),
      });
      fetchSongs();
    } catch (error) {
      console.error('Error reordering popular song:', error);
    }
  };

  const handleSaveLyrics = async (lyrics: string) => {
    if (!selectedSong) return;
    
    if (!selectedSong.fileUrl) {
      toast.error('음원 파일이 없습니다. 먼저 음원을 업로드해주세요.');
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/songs/${selectedSong.id}/lyrics`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lyrics }),
      });

      if (!response.ok) {
        throw new Error('Failed to save lyrics');
      }

      fetchSongs();
      toast.success('가사가 저장되었습니다.');
      setSelectedSong(null);
      setShowLyricsEditorV2(false);
    } catch (error) {
      console.error('Error saving lyrics:', error);
      toast.error('가사 저장에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <span className="text-3xl">🎵</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Music Manager</h1>
              <p className="text-purple-100 text-sm">나만의 음악 라이브러리를 관리해보세요</p>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-6">
          <div className="flex space-x-2 overflow-x-auto py-3">
            <TabButton
              active={activeTab === 'list'}
              onClick={() => setActiveTab('list')}
              icon="🎵"
              text="곡 목록"
              color="violet"
            />
            <TabButton
              active={activeTab === 'genres'}
              onClick={() => setActiveTab('genres')}
              icon="🎸"
              text="장르"
              color="blue"
            />
            <TabButton
              active={activeTab === 'lyrics'}
              onClick={() => setActiveTab('lyrics')}
              icon="📝"
              text="가사"
              color="emerald"
            />
            <TabButton
              active={activeTab === 'popular'}
              onClick={() => setActiveTab('popular')}
              icon="🌟"
              text="인기곡"
              color="amber"
            />
            <TabButton
              active={activeTab === 'new'}
              onClick={() => setActiveTab('new')}
              icon="🆕"
              text="최신곡"
              color="rose"
            />
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'list' && (
          <div className="p-6">
            {/* 필터 및 검색 영역 */}
            <div className="mb-6 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  >
                    <option value="전체">전체 보기</option>
                    {Array.from({ length: 22 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={`계시록 ${num}장`}>계시록 {num}장</option>
                    ))}
                  </select>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="곡 제목 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-10 text-black"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setModalMode('add');
                    setShowModal(true);
                    setFormData({
                      title: '',
                      artist: 'Various Artists',
                      chapter: '',
                      chapterId: 0,
                      genreId: '',
                      audioFile: null,
                      imageFile: null,
                      lyrics: '',
                      lyricsFile: null,
                      isNew: false,
                      driveFileId: '',
                      fileUrl: '',
                      duration: '',
                      imageId: '',
                      imageUrl: ''
                    });
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2"
                >
                  <FiPlusCircle className="w-5 h-5" />
                  <span>곡 추가</span>
                </button>
              </div>
            </div>

            {/* 챕터별 곡 목록 */}
            <div className="space-y-8">
              {getSongsByChapter().map(([chapter, chapterSongs]) => (
                <div key={chapter} className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-800 pb-2 border-b border-gray-200">
                    {chapter}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {chapterSongs.map((song: SongWithChapter) => (
                      <div
                        key={song.id}
                        className="flex items-center justify-between p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {song.title}
                            </h3>
                            {song.genreId && (
                              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {genres.find(g => g.id === song.genreId)?.name || '장르 없음'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                          <button
                            onClick={() => {
                              handleEdit(song);
                              setActiveTab('list');
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="수정"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSong(song);
                              setShowLyricsEditorV2(true);
                            }}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors duration-200"
                            title="가사 타임스탬프 편집 V2"
                          >
                            <FiClock className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(song.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="삭제"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => togglePopularSong(song)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                              song.popularSong
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {song.popularSong ? '인기곡 해제' : '인기곡 등록'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'genres' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">장르 관리</h2>
            
            {/* 장르 추가/수정 폼 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <form onSubmit={editingGenreId ? handleUpdateGenre : handleCreateGenre}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="genreId" className="block text-sm font-medium text-gray-700">
                      ID (영문)
                    </label>
                    <input
                      type="text"
                      id="genreId"
                      value={genreFormData.id}
                      onChange={(e) => setGenreFormData({ ...genreFormData, id: e.target.value.toLowerCase() })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                      placeholder="k-pop"
                      required
                      disabled={!!editingGenreId}
                    />
                  </div>
                  <div>
                    <label htmlFor="genreName" className="block text-sm font-medium text-gray-700">
                      이름 (한글)
                    </label>
                    <input
                      type="text"
                      id="genreName"
                      value={genreFormData.name}
                      onChange={(e) => setGenreFormData({ ...genreFormData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                      placeholder="케이팝"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                  >
                    {isLoading ? '처리 중...' : editingGenreId ? '수정' : '추가'}
                  </button>
                  {editingGenreId && (
                    <button
                      type="button"
                      onClick={handleCancelEditGenre}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* 장르 목록 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {genres.map((genre) => (
                    <tr key={genre.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {genre.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {genre.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditGenre(genre)}
                          className="text-indigo-600 hover:text-indigo-900 mx-2"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteGenre(genre.id)}
                          className="text-red-600 hover:text-red-900 mx-2"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'lyrics' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">AI 가사 생성</h2>
            
            {/* 검색 조건 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="chapter" className="block text-sm font-medium text-gray-700">
                    장 선택
                  </label>
                  <select
                    id="chapter"
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                  >
                    <option value="전체">전체</option>
                    {Array.from({ length: 22 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={`계시록 ${num}장`}>계시록 {num}장</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="genre" className="block text-sm font-medium text-gray-700">
                    장르 선택
                  </label>
                  <select
                    id="genre"
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                  >
                    <option value="">장르 선택</option>
                    {genres.map((genre) => (
                      <option key={genre.id} value={genre.id}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={generateLyrics}
                    disabled={isGenerating || !selectedGenre}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                  >
                    {isGenerating ? '생성 중...' : '가사 생성'}
                  </button>
                </div>
              </div>
            </div>

            {/* 가사 카드 목록 */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {lyricsCards.map((card) => (
                <div key={card.id} className="bg-white rounded-lg shadow-md p-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-500">{card.timestamp}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(card.lyrics)}
                        className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
                      >
                        가사 복사
                      </button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">가사</h3>
                    <pre className="whitespace-pre-wrap text-gray-700 font-sans">{card.lyrics}</pre>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">스타일</h3>
                    <div className="text-sm text-gray-600">{card.musicStyle}</div>
                  </div>
                  <div className="mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">해석</h3>
                    <div className="text-sm text-gray-600">{card.explanation}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">섹션: {card.section}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalMode === 'add' ? '곡 추가' : '곡 수정'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setIsEditing(false);
                    setSelectedSong(null);
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={modalMode === 'add' ? handleCreate : handleUpdate} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    제목
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="chapter" className="block text-sm font-medium text-gray-700">
                    챕터
                  </label>
                  <select
                    id="chapter"
                    value={formData.chapter}
                    onChange={handleChapterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black"
                    required
                  >
                    <option value="">챕터를 선택하세요</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="genre" className="block text-sm font-medium text-gray-700">
                    장르
                  </label>
                  <select
                    id="genre"
                    value={formData.genreId}
                    onChange={(e) => setFormData({ ...formData, genreId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black"
                  >
                    <option value="">장르 선택</option>
                    {genres.map((genre) => (
                      <option key={genre.id} value={genre.id}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isNew"
                    checked={formData.isNew}
                    onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isNew" className="ml-2 block text-sm text-gray-900">
                    신규곡
                  </label>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    오디오 파일
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileChange(e, 'audio')}
                    className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {(formData.fileUrl || selectedSong?.fileUrl) && (
                    <p className="mt-2 text-sm text-gray-600">
                      현재 파일: {formData.fileUrl || selectedSong?.fileUrl}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이미지 파일
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'image')}
                    className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {(formData.imageUrl || selectedSong?.imageUrl) && (
                    <p className="mt-2 text-sm text-gray-600">
                      현재 파일: {formData.imageUrl || selectedSong?.imageUrl}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="lyrics" className="block text-sm font-medium text-gray-700">
                    가사
                  </label>
                  <textarea
                    id="lyrics"
                    value={formData.lyrics}
                    onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black"
                    rows={5}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    가사 파일 (txt)
                  </label>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={(e) => handleFileChange(e, 'lyrics')}
                    className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setIsEditing(false);
                      setSelectedSong(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    disabled={isLoading}
                  >
                    {isLoading ? '처리중...' : modalMode === 'add' ? '추가' : '수정'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showLyricsEditorV2 && selectedSong && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg w-full h-full max-w-7xl max-h-[90vh] overflow-auto">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">{selectedSong.title} - 가사 타임스탬프 편집 V2</h2>
                <button
                  onClick={() => setShowLyricsEditorV2(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
               
                </button>
              </div>
              <LyricsTimestampEditorV2
                songId={selectedSong.id}
                songUrl={selectedSong.fileUrl || ''}
                initialLyrics={selectedSong.lyrics || ''}
                onSave={handleSaveLyrics}
                onClose={() => setShowLyricsEditorV2(false)}
              />
            </div>
          </div>
        )}

        {activeTab === 'popular' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
                <h2 className="text-2xl font-bold text-white">인기곡 관리</h2>
                <p className="text-indigo-100 mt-1">현재 인기곡 목록을 관리하고 순서를 변경할 수 있습니다.</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {songs
                    .filter(song => song.popularSong)
                    .sort((a, b) => (a.popularSong?.order || 0) - (b.popularSong?.order || 0))
                    .map((song, index) => (
                      <div
                        key={song.id}
                        className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center justify-center w-8 h-8 text-lg font-semibold text-indigo-600 bg-indigo-50 rounded-full">
                              {(song.popularSong?.order || 0) + 1}
                            </span>
                            <div>
                              <h3 className="font-medium text-gray-900">{song.title}</h3>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {index > 0 && (
                            <button
                              onClick={() => handleReorderPopularSong(song.id, (song.popularSong?.order || 0) - 1)}
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors duration-200"
                              title="위로 이동"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                          )}
                          {index < songs.filter(s => s.popularSong).length - 1 && (
                            <button
                              onClick={() => handleReorderPopularSong(song.id, (song.popularSong?.order || 0) + 1)}
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors duration-200"
                              title="아래로 이동"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => togglePopularSong(song)}
                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                            title="인기곡에서 제거"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
                
                {songs.filter(song => song.popularSong).length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">등록된 인기곡이 없습니다</h3>
                    <p className="mt-1 text-sm text-gray-500">다른 탭에서 곡을 인기곡으로 등록해주세요.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'new' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600">
                <h2 className="text-2xl font-bold text-white">신규곡 관리</h2>
                <p className="text-emerald-100 mt-1">신규곡 목록을 관리할 수 있습니다.</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {songs
                    .filter(song => song.isNew)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((song) => (
                      <div
                        key={song.id}
                        className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center justify-center w-8 h-8 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-full">
                              NEW
                            </span>
                            <div>
                              <h3 className="font-medium text-gray-900">{song.title}</h3>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span>{song.artist}</span>
                                <span>•</span>
                                <span>{new Date(song.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => {
                              // 신규곡 해제
                              fetch(getApiUrl(`/api/songs/${song.id}/toggle-new`), {
                                method: 'PATCH',
                              }).then(() => fetchSongs());
                            }}
                            className="p-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors duration-200"
                            title="신규곡 해제"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(song)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors duration-200"
                            title="곡 정보 수정"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
                
                {songs.filter(song => song.isNew).length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">등록된 신규곡이 없습니다</h3>
                    <p className="mt-1 text-sm text-gray-500">곡 추가 탭에서 신규곡을 등록해주세요.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
