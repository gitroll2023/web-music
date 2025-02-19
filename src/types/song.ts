export interface Song {
  id: string;
  title: string;
  artist: string;
  fileUrl: string;
  imageUrl?: string;
  lyrics?: string;
  chapterId?: string;
}

export interface Chapter {
  id: string;
  name: string;
  songs: Song[];
}

export interface SongWithChapter extends Song {
  chapter?: Chapter;
}
