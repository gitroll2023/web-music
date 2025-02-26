'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Song, Chapter as PrismaChapter, Genre as PrismaGenre } from '@prisma/client';
import { FiEdit2, FiTrash2, FiStar, FiClock, FiList, FiPlusCircle, FiCopy } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import LyricsTimestampEditorV2 from '@/components/LyricsTimestampEditorV2';
import { getApiUrl } from '@/utils/config';
import crypto from 'crypto';

interface SongWithChapter extends Song {
  chapter: PrismaChapter | null;
  genre: PrismaGenre | null;
  popularSong: any;
}

interface LocalChapter {
  id: number;
  name: string;
}

interface FormData {
  title: string;
  artist: string;
  chapterId: string; 
  genreId: string;
  audioFile: File | null;
  imageFile: File | null;
  lyrics: string;
  isNew: boolean;
  duration: string;
  driveFileId: string;
  fileUrl: string;
  imageId: string;
  imageUrl: string;
  fileName: string;
}

interface Genre {
  id: string;
  name: string;
}

interface NewGenre {
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

const initialFormData: FormData = {
  title: '',
  artist: 'Various Artists',
  chapterId: '', 
  genreId: '',
  audioFile: null,
  imageFile: null,
  lyrics: '',
  isNew: false,
  duration: '',
  driveFileId: '',
  fileUrl: '',
  imageId: '',
  imageUrl: '',
  fileName: ''
};

// 색상 팔레트
const colorPalettes = [
  { bg: 'bg-pink-100', text: 'text-pink-800' },
  { bg: 'bg-blue-100', text: 'text-blue-800' },
  { bg: 'bg-purple-100', text: 'text-purple-800' },
  { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { bg: 'bg-red-100', text: 'text-red-800' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  { bg: 'bg-green-100', text: 'text-green-800' },
  { bg: 'bg-orange-100', text: 'text-orange-800' },
  { bg: 'bg-teal-100', text: 'text-teal-800' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  { bg: 'bg-lime-100', text: 'text-lime-800' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  { bg: 'bg-sky-100', text: 'text-sky-800' },
  { bg: 'bg-violet-100', text: 'text-violet-800' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' },
  { bg: 'bg-rose-100', text: 'text-rose-800' }
];

// 장르 ID를 기반으로 일관된 색상 생성
const getGenreColor = (genreId: string) => {
  // 미리 정의된 색상이 있으면 사용
  const predefinedColors: { [key: string]: string } = {
    'k-pop': 'bg-pink-100 text-pink-800',
    'ballad': 'bg-blue-100 text-blue-800',
    'dance': 'bg-purple-100 text-purple-800',
    'hiphop': 'bg-yellow-100 text-yellow-800',
    'rock': 'bg-red-100 text-red-800',
    'rnb': 'bg-indigo-100 text-indigo-800',
    'indie': 'bg-green-100 text-green-800'
  };

  if (predefinedColors[genreId]) {
    return predefinedColors[genreId];
  }

  // 없으면 genreId를 기반으로 일관된 색상 선택
  const hash = genreId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const index = Math.abs(hash) % colorPalettes.length;
  const palette = colorPalettes[index];
  return `${palette.bg} ${palette.text}`;
};

// 클라이언트 사이드에서 비밀번호 해시 생성 (대소문자 구분 없이)
const hashPassword = (pwd: string) => {
  return crypto.createHash('sha256').update(pwd.toLowerCase()).digest('hex');
};

// 세션 타이머 컴포넌트
function SessionTimer({ onExtend }: { onExtend: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [showExtendButton, setShowExtendButton] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const expiry = localStorage.getItem('adminAuthExpiry');
      if (!expiry) return;

      const timeLeftMs = parseInt(expiry) - new Date().getTime();
      if (timeLeftMs <= 0) {
        window.location.reload();
        return;
      }

      const minutes = Math.floor(timeLeftMs / (60 * 1000));
      const seconds = Math.floor((timeLeftMs % (60 * 1000)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      
      // 10분 이하로 남으면 연장 버튼 표시
      setShowExtendButton(timeLeftMs < 10 * 60 * 1000);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50 flex items-center gap-4 md:bottom-8 md:right-8">
      <div className="text-sm text-gray-900 dark:text-gray-100">
        <span className="font-medium">세션 남은 시간:</span>{' '}
        <span className={showExtendButton ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}>
          {timeLeft}
        </span>
      </div>
      {showExtendButton && (
        <button
          onClick={onExtend}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          1시간 연장
        </button>
      )}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [songs, setSongs] = useState<SongWithChapter[]>([]);
  const [genres, setGenres] = useState<PrismaGenre[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongWithChapter | null>(null);
  const [showLyricsEditorV2, setShowLyricsEditorV2] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'genres' | 'lyrics' | 'popular' | 'new'>('list');
  const [formDataState, setFormDataState] = useState<FormData>(initialFormData);
  const [newGenre, setNewGenre] = useState<NewGenre>({
    id: '',
    name: ''
  });
  const [editingGenreId, setEditingGenreId] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [lyricsCards, setLyricsCards] = useState<LyricsCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
  const chapters: LocalChapter[] = Array.from({ length: 22 }, (_, i) => ({
    id: i + 1,
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
      const response = await fetch(getApiUrl('/api/songs?limit=100')); 
      if (!response.ok) throw new Error('Failed to fetch songs');
      const data = await response.json();
      console.log('API Response Data:', data);  // API 응답 데이터 로깅
      setSongs(data.songs); 
    } catch (error) {
      console.error('Error fetching songs:', error);
      toast.error('곡 목록을 불러오는데 실패했습니다.');
    }
  };

  // 장르 목록 가져오기
  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/genres');
      if (!response.ok) {
        throw new Error('Failed to fetch genres');
      }
      const data = await response.json();
      setGenres(data);
    } catch (error) {
      console.error('Error fetching genres:', error);
      toast.error('장르 목록을 가져오는데 실패했습니다.');
    }
  };

  // 오디오 파일 duration 가져오기
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };
    });
  };

  // 파일 업로드 핸들러
  const onFileUpload = async (file: File, type: 'audio' | 'image' | 'lyrics', fileName?: string) => {
    if (!file) return null;

    try {
      // 리프레시 토큰으로 새 액세스 토큰 얻기
      const tokenResponse = await fetch('/api/auth/get-access-token');
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }

      const { accessToken } = await tokenResponse.json();

      // 파일 확장자 결정
      const extension = type === 'audio' ? 'mp3' : 'jpg';

      // 파일 업로드
      const uploadForm = new FormData();
      const metadata = {
        name: fileName ? `${fileName}.${extension}` : `${formDataState.fileName}.${extension}`,  // 예: 2-5.mp3 또는 2-5.jpg
        mimeType: file.type
      };
      
      uploadForm.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      uploadForm.append('file', file);

      // Google Drive API로 파일 업로드
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // Content-Type 헤더를 제거하여 브라우저가 자동으로 설정하도록 함
        },
        body: uploadForm
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error('Failed to upload file');
      }

      const result = await response.json();
      console.log('Upload result:', result);

      // URL 생성
      if (result.id) {
        result.url = `https://drive.google.com/uc?export=view&id=${result.id}`;
      }

      return result;
    } catch (error) {
      console.error(`Error uploading ${type} file:`, error);
      toast.error(`${type} 파일 업로드에 실패했습니다.`);
      return null;
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDataState.title || !formDataState.chapterId) {
      toast.error('제목과 챕터는 필수 입력 항목입니다.');
      return;
    }

    if (modalMode === 'add') {
      handleCreate();
    } else if (selectedSong?.id) {
      handleUpdate(selectedSong.id);
    } else {
      toast.error('선택된 곡이 없습니다.');
    }
  };

  // 선택된 챕터에 따라 아티스트 이름 생성
  const getArtistNameFromChapter = (chapterId: string | number) => {
    const chapterIdNum = typeof chapterId === 'string' ? parseInt(chapterId) : chapterId;
    const chapter = chapters.find(ch => ch.id === chapterIdNum);
    if (!chapter) return '';
    const chapterNumber = chapter.name.replace(/[^0-9]/g, '');
    return `계시록 ${chapterNumber}장`;
  };

  // 곡 생성
  const handleCreate = async () => {
    setIsLoading(true); 

    try {
      if (!formDataState.chapterId || !formDataState.title || !formDataState.lyrics) {
        toast.error('필수 정보를 모두 입력해주세요.');
        return;
      }

      // 챕터 기반으로 아티스트 이름 설정
      const artistName = getArtistNameFromChapter(formDataState.chapterId);

      // 먼저 파일명 생성 요청
      const fileNameResponse = await fetch(`/api/songs/generate-filename?chapterId=${formDataState.chapterId}`);
      if (!fileNameResponse.ok) {
        throw new Error('Failed to generate file name');
      }
      const { fileName } = await fileNameResponse.json();
      
      // 생성된 파일명을 formDataState에 설정
      setFormDataState(prev => ({ ...prev, fileName }));

      // 오디오 파일 업로드
      let audioUploadResult = null;
      let audioDuration = 0;
      
      if (formDataState.audioFile) {
        // 오디오 파일의 duration 가져오기
        try {
          audioDuration = await getAudioDuration(formDataState.audioFile);
        } catch (error) {
          console.error('Error getting audio duration:', error);
        }

        audioUploadResult = await onFileUpload(formDataState.audioFile, 'audio', fileName);
        if (!audioUploadResult) return;
      }

      // 이미지 파일 업로드
      let imageUploadResult = null;
      if (formDataState.imageFile) {
        imageUploadResult = await onFileUpload(formDataState.imageFile, 'image', fileName);
        if (!imageUploadResult) return;
      }

      // 곡 생성 요청
      const formData = new FormData();
      formData.append('title', formDataState.title);
      formData.append('artist', artistName);
      formData.append('chapterId', formDataState.chapterId.toString());
      formData.append('genreId', formDataState.genreId || 'hiphop');
      formData.append('lyrics', formDataState.lyrics || '');
      formData.append('isNew', formDataState.isNew.toString());

      if (audioUploadResult) {
        formData.append('driveFileId', audioUploadResult.id);
        formData.append('fileUrl', audioUploadResult.url || `https://drive.google.com/uc?export=view&id=${audioUploadResult.id}`);
        console.log('Audio upload result:', audioUploadResult);
        console.log('Audio URL being set:', audioUploadResult.url || `https://drive.google.com/uc?export=view&id=${audioUploadResult.id}`);
        const minutes = Math.floor(audioDuration / 60);
        const seconds = Math.floor(audioDuration % 60);
        formData.append('duration', `${minutes}:${seconds.toString().padStart(2, '0')}`);
      }

      if (imageUploadResult) {
        formData.append('imageId', imageUploadResult.id);
        formData.append('imageUrl', imageUploadResult.url || `https://drive.google.com/uc?export=view&id=${imageUploadResult.id}`);
        console.log('Image upload result:', imageUploadResult);
        console.log('Image URL being set:', imageUploadResult.url || `https://drive.google.com/uc?export=view&id=${imageUploadResult.id}`);
      }
      
      const createSongResponse = await fetch(getApiUrl('/api/songs'), {
        method: 'POST',
        body: formData,
      });

      const responseText = await createSongResponse.text();
      console.log('API Response text:', responseText);

      if (!createSongResponse.ok) {
        let error;
        try {
          error = JSON.parse(responseText);
        } catch {
          error = { message: responseText };
        }
        console.error('Server error:', error);
        throw new Error(error.message || 'Failed to create song');
      }

      const result = JSON.parse(responseText);
      console.log('Song created:', result);

      toast.success('노래가 성공적으로 생성되었습니다. 콘솔을 확인한 후 목록으로 이동 버튼을 클릭하세요.');
      setIsLoading(false);
    } catch (error) {
      console.error('Error creating song:', error);
      toast.error('노래 생성 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 곡 수정
  const handleUpdate = async (id: number) => {
    if (!selectedSong) return;

    try {
      setIsLoading(true);

      // 챕터 기반으로 아티스트 이름 설정
      const artistName = getArtistNameFromChapter(formDataState.chapterId);

      let newImageId = selectedSong.imageId;
      let newImageUrl = selectedSong.imageUrl;

      // 새 이미지가 선택된 경우
      if (formDataState.imageFile) {
        try {
          const imageUploadResult = await onFileUpload(formDataState.imageFile, 'image', selectedSong.fileName);
          if (!imageUploadResult) return;

          newImageId = imageUploadResult.id;
          newImageUrl = `https://drive.google.com/uc?export=view&id=${imageUploadResult.id}`;

          // 기존 이미지 삭제
          if (selectedSong.imageId) {
            const imageDeleted = await deleteFile(selectedSong.imageId);
            if (!imageDeleted) {
              console.error('Failed to delete old image file');
            }
          }
        } catch (error) {
          console.error('Error uploading new image:', error);
          toast.error('이미지 업로드에 실패했습니다.');
          return;
        }
      }

      // 오디오 파일 업로드
      let newAudioFileId = selectedSong.driveFileId;
      let newAudioFileUrl = selectedSong.fileUrl;
      if (formDataState.audioFile) {
        try {
          const audioUploadResult = await onFileUpload(formDataState.audioFile, 'audio');
          if (!audioUploadResult) return;

          newAudioFileId = audioUploadResult.id;
          newAudioFileUrl = `https://drive.google.com/uc?export=view&id=${audioUploadResult.id}`;

          // 기존 오디오 파일 삭제
          if (selectedSong.driveFileId) {
            const audioDeleted = await deleteFile(selectedSong.driveFileId);
            if (!audioDeleted) {
              console.error('Failed to delete old audio file');
            }
          }
        } catch (error) {
          console.error('Error uploading new audio file:', error);
          toast.error('오디오 파일 업로드에 실패했습니다.');
          return;
        }
      }

      const formData = new FormData();
      formData.append('title', formDataState.title);
      formData.append('artist', artistName);
      formData.append('chapterId', formDataState.chapterId.toString());
      formData.append('genreId', formDataState.genreId || 'hiphop');
      formData.append('lyrics', formDataState.lyrics || '');
      formData.append('isNew', formDataState.isNew.toString());
      formData.append('driveFileId', newAudioFileId || '');
      formData.append('fileUrl', newAudioFileUrl || '');
      
      // duration 형식 수정
      if (formDataState.duration) {
        const [minutes, seconds] = formDataState.duration.split(':').map(Number);
        formData.append('duration', `${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        formData.append('duration', '');
      }
      
      formData.append('imageId', newImageId || '');
      formData.append('imageUrl', newImageUrl || '');

      const response = await fetch(`/api/songs/${id}`, {
        method: 'PATCH',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update song');
      }

      const updatedSong = await response.json();
      setSongs(songs.map(song => song.id === id ? updatedSong : song));
      setShowModal(false);
      setFormDataState(initialFormData);
      toast.success('곡이 수정되었습니다.');
    } catch (error) {
      console.error('Error updating song:', error);
      toast.error(error instanceof Error ? error.message : '곡 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 파일 변경 처리
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormDataState(prev => ({
      ...prev,
      imageFile: file
    }));
  };

  // 파일 삭제 함수
  const deleteFile = async (fileId: string) => {
    try {
      // GET 메서드로 변경
      const tokenResponse = await fetch('/api/auth/get-access-token');
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token error response:', errorText);
        throw new Error('Failed to get access token');
      }

      const { accessToken } = await tokenResponse.json();

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete error response:', errorText);
        throw new Error('Failed to delete file');
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  };

  // 곡 삭제
  const handleDelete = async (song: SongWithChapter) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      setIsLoading(true);

      // 먼저 DB에서 곡 데이터 삭제
      const response = await fetch(getApiUrl(`/api/songs/${song.id}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete song');
      }

      // DB 삭제 성공 후 파일 삭제 시도
      if (song.imageId) {
        const imageDeleted = await deleteFile(song.imageId);
        if (!imageDeleted) {
          console.error('Failed to delete image file');
        }
      }

      if (song.driveFileId) {
        const audioDeleted = await deleteFile(song.driveFileId);
        if (!audioDeleted) {
          console.error('Failed to delete audio file');
        }
      }

      toast.success('곡이 삭제되었습니다.');
      fetchSongs();
    } catch (error) {
      console.error('Error deleting song:', error);
      toast.error('곡 삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
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
      chapterId: song.chapterId.toString(), 
      genreId: song.genreId || '',
      audioFile: null,
      imageFile: null,
      lyrics: song.lyrics || '',
      isNew: song.isNew || false,
      duration: song.duration || '',
      driveFileId: song.driveFileId || '',
      fileUrl: song.fileUrl || '',
      imageId: song.imageId || '',
      imageUrl: song.imageUrl || '',
      fileName: song.title
    };
    setFormDataState(newFormData);
  };

  // 인기곡 토글
  const togglePopularSong = async (song: SongWithChapter) => {
    try {
      if (song.popularSong) {
        // 인기곡에서 제거
        await fetch(getApiUrl(`/api/popular-songs?id=${song.popularSong.id}`), {
          method: 'DELETE'
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

    setFormDataState(prev => ({ ...prev, lyricsFile: file }));

    try {
      const text = await file.text();
      setFormDataState(prev => ({ ...prev, lyrics: text }));
    } catch (error) {
      console.error('Error reading lyrics file:', error);
    }
  };

  // 폼 입력 처리
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormDataState(prev => ({ ...prev, [name]: value }));
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
          setFormDataState(prev => ({
            ...prev,
            lyrics: content,
            lyricsFile: file
          }));
        };
        reader.readAsText(file);
      } else {
        setFormDataState(prev => ({
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
    setFormDataState(initialFormData);
  };

  // 장르 생성
  const handleCreateGenre = async () => {
    try {
      const response: Response = await fetch('/api/genres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGenre),
      });

      if (!response.ok) {
        throw new Error('Failed to create genre');
      }

      const createdGenre: PrismaGenre = await response.json();
      setGenres([...genres, createdGenre]);
      setNewGenre({ id: '', name: '' });
      toast.success('장르가 생성되었습니다.');
    } catch (error) {
      console.error('Error creating genre:', error);
      toast.error('장르 생성에 실패했습니다.');
    }
  };

  // 장르 추가
  const handleAddGenre = async () => {
    if (!newGenre.id || !newGenre.name) {
      toast.error('장르 ID와 이름을 모두 입력해주세요.');
      return;
    }

    try {
      const response: Response = await fetch('/api/genres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGenre),
      });

      if (!response.ok) {
        throw new Error('Failed to add genre');
      }

      const data: PrismaGenre = await response.json();
      setGenres([...genres, data]);
      setNewGenre({ id: '', name: '' });
      toast.success('장르가 추가되었습니다.');
    } catch (error) {
      console.error('Error adding genre:', error);
      toast.error('장르 추가에 실패했습니다.');
    }
  };

  // 장르 삭제
  const handleDeleteGenre = async (id: string) => {
    if (!confirm('정말 이 장르를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/genres/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setGenres(prev => prev.filter(genre => genre.id !== id));
      toast.success('장르가 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting genre:', error);
      toast.error(error instanceof Error ? error.message : '장르 삭제에 실패했습니다.');
    }
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
    const selectedChapter = chapters.find(ch => ch.id === parseInt(selectedChapterId));
    
    setFormDataState(prev => ({
      ...prev,
      chapterId: selectedChapterId
    }));
  };

  // 인기곡 순서 변경
  const handleReorderPopularSong = async (songId: number, newOrder: number) => {
    try {
      const response = await fetch(getApiUrl('/api/popular-songs/reorder'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId, newOrder }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder popular song');
      }

      // 성공적으로 순서가 변경되면 곡 목록을 다시 불러옴
      await fetchSongs();
    } catch (error) {
      console.error('Error reordering popular song:', error);
      toast.error('인기곡 순서 변경에 실패했습니다.');
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

  // 장르 뱃지 컴포넌트
  const GenreBadge = ({ genre }: { genre: PrismaGenre | null }) => {
    if (!genre) return null;
    
    const colorClass = getGenreColor(genre.id);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {genre.name}
      </span>
    );
  };

  const handleGoogleAuth = async () => {
    try {
      const response = await fetch('/api/auth/google');
      const data = await response.json();
      
      if (data.authUrl) {
        // 새 창에서 인증 URL 열기
        window.open(data.authUrl, 'googleAuth', 'width=600,height=800');
      }
    } catch (error) {
      console.error('Error starting Google auth:', error);
      alert('구글 인증을 시작하는데 실패했습니다.');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // wjsoft의 해시값, 소문자로 변환
    const correctHash = '23d5718f5e0f91a2843a4cbce0e62795c3f1d47ae260290131715c672995fe86';
    
    // 입력된 비밀번호 해시
    const hashedPassword = hashPassword(password);

    if (hashedPassword === correctHash) {
      // 1시간 후 만료
      const expiryTime = new Date().getTime() + (60 * 60 * 1000);
      localStorage.setItem('adminAuthExpiry', expiryTime.toString());
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  const handleExtendSession = () => {
    const newExpiryTime = new Date().getTime() + (60 * 60 * 1000);
    localStorage.setItem('adminAuthExpiry', newExpiryTime.toString());
    toast.success('세션이 1시간 연장되었습니다.');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            관리자 로그인
          </h2>
          <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                로그인
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SessionTimer onExtend={handleExtendSession} />
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
                    setFormDataState(initialFormData);
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
                            <h3 className={`text-lg font-semibold text-gray-900 ${song.title.length > 30 ? 'text-sm' : ''}`}>
                              {song.title}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 whitespace-nowrap overflow-x-auto">
                            <span>{song.artist}</span>
                            {song.genre && (
                              <>
                                <span>•</span>
                                <GenreBadge genre={song.genre} />
                              </>
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
                            onClick={() => handleDelete(song)}
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
              <form onSubmit={handleCreateGenre}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="genreName" className="block text-sm font-medium text-gray-700">
                      이름 (한글)
                    </label>
                    <input
                      type="text"
                      id="genreName"
                      value={newGenre.name}
                      onChange={(e) => setNewGenre({ ...newGenre, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                      placeholder="케이팝"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="genreId" className="block text-sm font-medium text-gray-700">
                      ID
                    </label>
                    <input
                      type="text"
                      id="genreId"
                      value={newGenre.id}
                      onChange={(e) => setNewGenre({ ...newGenre, id: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                      placeholder="k-pop"
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
                    {isLoading ? '처리 중...' : '추가'}
                  </button>
                </div>
              </form>
            </div>

            {/* 장르 목록 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                    <tr key={genre.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {genre.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteGenre(genre.id)}
                          className="text-red-600 hover:text-red-900"
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
                      <option key={genre.name} value={genre.name}>
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
                    <div className="text-sm">
                      <span className="font-medium">타임스탬프:</span>{' '}
                      <span>
                        {card.timestamp}
                      </span>
                    </div>
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
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {modalMode === 'add' ? '곡 추가' : '곡 수정'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setIsEditing(false);
                    setSelectedSong(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      제목
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formDataState.title}
                      onChange={(e) => setFormDataState({ ...formDataState, title: e.target.value })}
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
                      value={formDataState.chapterId}
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
                    <label className="block text-sm font-medium text-gray-700">장르</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                      value={formDataState.genreId || 'hiphop'}
                      onChange={(e) =>
                        setFormDataState((prev) => ({ ...prev, genreId: e.target.value }))
                      }
                    >
                      {genres.map((genre) => (
                        <option key={genre.id} value={genre.id} className="text-black">
                          {genre.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="isNew"
                      checked={formDataState.isNew}
                      onChange={(e) => setFormDataState({ ...formDataState, isNew: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isNew" className="ml-2 block text-sm text-gray-900">
                      신규곡
                    </label>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      오디오 파일 {modalMode === 'edit' && '(수정 불가)'}
                    </label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileChange(e, 'audio')}
                      className={`block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold ${
                        modalMode === 'edit' 
                        ? 'file:bg-gray-100 file:text-gray-400 hover:file:bg-gray-100 cursor-not-allowed opacity-60' 
                        : 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                      }`}
                      disabled={modalMode === 'edit'}
                    />
                    {modalMode === 'edit' && selectedSong?.fileUrl && (
                      <p className="mt-2 text-sm text-gray-600">
                        현재 파일: {selectedSong.fileUrl}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      이미지 파일
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {(formDataState.imageUrl || (modalMode === 'edit' && selectedSong?.imageUrl)) && (
                      <p className="mt-2 text-sm text-gray-600">
                        현재 이미지: {formDataState.imageUrl || selectedSong?.imageUrl}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lyrics" className="block text-sm font-medium text-gray-700">
                      가사
                    </label>
                    <textarea
                      id="lyrics"
                      value={formDataState.lyrics}
                      onChange={(e) => setFormDataState({ ...formDataState, lyrics: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black"
                      rows={5}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      가사 파일 (txt)
                    </label>
                    <input
                      type="file"
                      accept=".txt"
                      onChange={(e) => handleFileChange(e, 'lyrics')}
                      className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div className="mt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setIsEditing(false);
                        setSelectedSong(null);
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      목록으로 이동
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      {isLoading ? '처리 중...' : '저장'}
                    </button>
                  </div>
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
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
                    .sort((a, b) => {
                      const orderA = a.popularSong?.order ?? 0;
                      const orderB = b.popularSong?.order ?? 0;
                      return orderA - orderB;
                    })
                    .map((song, index) => (
                      <div
                        key={song.id}
                        className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center justify-center w-8 h-8 text-lg font-semibold text-indigo-600 bg-indigo-50 rounded-full">
                              {index + 1}
                            </span>
                            <div>
                              <h3 className={`font-medium text-gray-900 ${song.title.length > 30 ? 'text-sm' : ''}`}>
                                {song.title}
                              </h3>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {index > 0 && (
                            <button
                              onClick={() => handleReorderPopularSong(song.id, index - 1)}
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
                              onClick={() => handleReorderPopularSong(song.id, index + 1)}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19V6l12-3" />
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
                              <h3 className={`font-medium text-gray-900 ${song.title.length > 30 ? 'text-sm' : ''}`}>
                                {song.title}
                              </h3>
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
