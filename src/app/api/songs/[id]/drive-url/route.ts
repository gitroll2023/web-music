import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGoogleDriveDirectLink } from '@/lib/googleDrive';
import { Chapter, Genre, PopularSong, Song } from '@prisma/client';

type SongWithRelations = Song & {
  chapter: Chapter;
  genre: Genre | null;
  popularSong: PopularSong | null;
};

// GET: 구글 드라이브 URL 가져오기
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 곡 정보 가져오기
    const song = await prisma.song.findUnique({
      where: {
        id: parseInt(params.id)
      }
    });

    if (!song) {
      return NextResponse.json(
        { error: '곡을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (!song.driveFileId) {
      return NextResponse.json(
        { error: '드라이브 파일 ID가 없습니다.' },
        { status: 400 }
      );
    }

    // 구글 드라이브 직접 링크 가져오기
    const directLink = await getGoogleDriveDirectLink(song.driveFileId);

    if (!directLink) {
      return NextResponse.json(
        { error: '드라이브 URL을 가져올 수 없습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: directLink });
  } catch (error) {
    console.error('Error in drive-url route:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 구글 드라이브 URL 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const songId = parseInt(params.id);
    const { fileUrl } = await request.json();

    // URL 업데이트
    const updatedSong = await prisma.song.update({
      where: { id: songId },
      data: { fileUrl },
      include: {
        chapter: true,
        genre: true,
        popularSong: true
      }
    });

    return NextResponse.json(updatedSong);
  } catch (error) {
    console.error('드라이브 URL 업데이트 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
