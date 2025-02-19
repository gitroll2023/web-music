import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET 요청 처리
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const song = await prisma.song.findUnique({
      where: {
        id: Number(params.id),
      },
      include: {
        chapter: true,
        genre: true,
        popularSong: true,
      },
    });

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json(song);
  } catch (error) {
    console.error('Error fetching song:', error);
    return NextResponse.json(
      { error: 'Failed to fetch song' },
      { status: 500 }
    );
  }
}

// PATCH 요청 처리
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const songId = parseInt(params.id);

    // 현재 곡 정보 가져오기
    const currentSong = await prisma.song.findUnique({
      where: { id: songId },
      include: { chapter: true }
    });

    if (!currentSong) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    // 챕터가 변경된 경우 새 파일명 생성
    let fileName = currentSong.fileName;
    if (data.chapterId && data.chapterId !== currentSong.chapterId) {
      // 새 챕터의 모든 곡 가져오기
      const songsInNewChapter = await prisma.song.count({
        where: { chapterId: data.chapterId }
      });

      // 새 파일명 생성 (챕터번호-순번)
      fileName = `${data.chapterId}-${songsInNewChapter + 1}`;
    }

    // 곡 업데이트
    const song = await prisma.song.update({
      where: { id: songId },
      data: {
        title: data.title,
        fileName,
        artist: data.artist,
        chapterId: data.chapterId,
        genreId: data.genreId,
        lyrics: data.lyrics,
        isNew: data.isNew,
        driveFileId: data.driveFileId,
        fileUrl: data.fileUrl,
        duration: data.duration,
        imageId: data.imageId,
        imageUrl: data.imageUrl
      },
      include: {
        chapter: true,
        genre: true,
        popularSong: true
      }
    });

    return NextResponse.json(song);
  } catch (error) {
    console.error('Error updating song:', error);
    return NextResponse.json(
      { error: 'Failed to update song' },
      { status: 500 }
    );
  }
}

// DELETE 요청 처리
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 먼저 연관된 popularSong이 있다면 삭제
    await prisma.popularSong.deleteMany({
      where: {
        songId: Number(params.id),
      },
    });

    // 그 다음 song 삭제
    const song = await prisma.song.delete({
      where: {
        id: Number(params.id),
      },
    });

    return NextResponse.json(song);
  } catch (error) {
    console.error('Error deleting song:', error);
    return NextResponse.json(
      { error: 'Failed to delete song' },
      { status: 500 }
    );
  }
}
