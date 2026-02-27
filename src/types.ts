import type { Song as PrismaSong, Chapter as PrismaChapter, Genre as PrismaGenre, PopularSong } from '@prisma/client';

export type Song = PrismaSong;
export type Chapter = PrismaChapter;
export type Genre = PrismaGenre;

export type SongType = 'chapter' | 'verse' | 'title';

export interface SongWithChapter extends Omit<PrismaSong, 'chapter' | 'genre' | 'driveFileId' | 'imageId' | 'imageUrl' | 'fileUrl'> {
  chapter: {
    id: number;
    name: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    songId: number;
  } | null;
  genre: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  popularSong: PopularSong | null;
  url: string;
  fileUrl: string;
  imageUrl: string;
  lyrics: string;
  type: SongType;
}

export interface SongWithLyrics extends Omit<PrismaSong, 'chapter' | 'genre'> {
  chapter: PrismaChapter;
  genre: PrismaGenre;
  lyrics: string;
  title: string;
  isNew: boolean;
  url?: string;
}

export interface ChapterWithSongs extends PrismaChapter {
  songs: SongWithChapter[];
}

export interface GenreWithSongs extends PrismaGenre {
  songs: SongWithChapter[];
}

export interface LyricsCard {
  id: string;
  text: string;
  timestamp: string;
}

// Drive URL 관련 타입
export interface SongWithDriveUrl extends Omit<PrismaSong, 'chapter' | 'genre'> {
  driveUrl: string;
  url?: string;
}

// 챕터 제목 관련 타입
export interface ChapterTitle {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Admin 페이지 전용 타입 ───

// Admin 페이지에서 사용하는 SongWithChapter (API 응답 기반)
export interface AdminSongWithChapter extends PrismaSong {
  chapter: PrismaChapter | null;
  genre: PrismaGenre | null;
  popularSong: PopularSong | null;
  isRevelationChapter: boolean;
  isRevelationKeyVerse: boolean;
  isRevelationTitle: boolean;
}

// Admin 곡 추가/수정 폼 데이터
export interface AdminFormData {
  title: string;
  artist: string;
  chapterId: string;
  genreId: string;
  lyrics: string;
  isNew: boolean;
  duration: string;
  fileUrl: string;
  imageUrl: string;
  fileName: string;
  isRevelationChapter: boolean;
  isRevelationKeyVerse: boolean;
  isRevelationTitle: boolean;
}

// Admin 챕터 목록용 간단한 타입
export interface LocalChapter {
  id: number;
  name: string;
}

// Admin 가사 카드 타입
export interface AdminLyricsCard {
  id: number;
  timestamp: string;
  lyrics: string;
  musicStyle: string;
  explanation: string;
  section: string;
}

// Admin 새 장르 추가 타입
export type NewGenre = Pick<PrismaGenre, 'id' | 'name'>;