import type { Song as PrismaSong, Chapter as PrismaChapter, Genre as PrismaGenre, PopularSong } from '@prisma/client';

export type Song = PrismaSong;
export type Chapter = PrismaChapter;
export type Genre = PrismaGenre;

export interface SongWithChapter extends Omit<PrismaSong, 'chapter' | 'genre'> {
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
  lyrics: string;
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