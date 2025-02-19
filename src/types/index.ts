import type { Song as PrismaSong, Chapter, Genre as PrismaGenre, PopularSong } from '@prisma/client';

// PrismaSong의 기본 타입을 확장하는 Song 인터페이스
export interface Song {
  id: number;
  title: string;           // 노래 제목
  fileName: string;        // 파일명 (예: 1-1, 1-2)
  artist?: string | null;  // 아티스트
  driveFileId?: string | null;
  fileUrl: string | null; // 스트리밍 URL
  duration?: string | null;
  imageId?: string | null;
  imageUrl?: string | null; // 노래 곡 앨범 이미지
  lyrics?: string | null;   // 가사
  chapterId: number;        // 계시록 장 번호
  genreId: string;         // 장르 ID
  isNew: boolean;          // 신곡 여부
  createdAt: string;
  updatedAt: string;
}

export interface SongWithChapter {
  id: number;
  title: string;
  fileName: string;
  artist: string | null;
  driveFileId: string | null;
  fileUrl: string | null;
  audioUrl: string | null;  // 오디오 URL 추가
  duration: string | null;
  imageId: string | null;
  imageUrl: string | null;
  lyrics: string | null;
  createdAt: Date;
  updatedAt: Date;
  chapter: { 
    id: number;
    name: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  genre: { id: string; name: string };
  popularSong: boolean;
  url: string;
}

export interface SongWithLyrics extends SongWithChapter {
  lyrics: string;
  hasLyrics?: boolean;
}

export interface ChapterWithSongs {
  songs: SongWithChapter[];
}

export type SongFormData = {
  title: string;
  artist: string;
  chapter: string;
  genreId: string;
  audioFile: File | null;
  imageFile: File | null;
  lyrics: string;
  lyricsFile: File | null;
};

export type ChapterFormData = {
  name: string;
  imageFile: File | null;
};

export type TimestampItem = {
  time: number;
  text: string;
};

export type LyricLine = {
  time: number;
  text: string;
};

export type LyricsPrompt = {
  chapter: number;
  section: string;
  genre: string;
};

export type LyricsCard = {
  id: string;
  lyrics: string;
  musicStyle: string;
  timestamp: string;
  explanation: string;
  section: string;

};

export type RevelationVerse = {
  chapter: number;
  verse: number;
  text: string;
};

export interface Genre {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}