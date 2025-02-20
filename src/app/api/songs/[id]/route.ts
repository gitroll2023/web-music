import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const song = await prisma.song.findUnique({
      where: { id },
      include: {
        chapter: true,
        genre: true
      }
    });

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const formData = await request.formData();

    // 필수 필드 확인
    const title = formData.get('title')?.toString();
    const chapterId = formData.get('chapterId')?.toString();
    const genreId = formData.get('genreId')?.toString();

    if (!title || !chapterId || !genreId) {
      return NextResponse.json(
        { error: 'Title, chapterId, and genreId are required' },
        { status: 400 }
      );
    }

    // 선택적 필드
    const artist = formData.get('artist')?.toString();
    const lyrics = formData.get('lyrics')?.toString();
    const isNew = formData.get('isNew') === 'true';
    const driveFileId = formData.get('driveFileId')?.toString();
    const fileUrl = formData.get('fileUrl')?.toString();
    const duration = formData.get('duration')?.toString();
    const imageId = formData.get('imageId')?.toString();
    const imageUrl = formData.get('imageUrl')?.toString();

    // 곡 존재 여부 확인
    const existingSong = await prisma.song.findUnique({
      where: { id }
    });

    if (!existingSong) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    // 장르 존재 여부 확인
    const genre = await prisma.genre.findUnique({
      where: { id: genreId }
    });

    if (!genre) {
      return NextResponse.json(
        { error: 'Genre not found' },
        { status: 400 }
      );
    }

    // 챕터 존재 여부 확인
    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(chapterId) }
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 400 }
      );
    }

    // 곡 업데이트
    const updatedSong = await prisma.song.update({
      where: { id },
      data: {
        title,
        artist: artist || null,
        chapterId: parseInt(chapterId),
        genreId,
        lyrics: lyrics || null,
        isNew,
        driveFileId: driveFileId || null,
        fileUrl: fileUrl || null,
        duration: duration || null,
        imageId: imageId || null,
        imageUrl: imageUrl || null
      },
      include: {
        chapter: true,
        genre: true
      }
    });

    return NextResponse.json(updatedSong);
  } catch (error) {
    console.error('Error updating song:', error);
    return NextResponse.json(
      { error: 'Failed to update song' },
      { status: 500 }
    );
  }
}

import { deleteFileFromDrive } from '@/utils/google-drive';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // 곡 정보 가져오기
    const song = await prisma.song.findUnique({
      where: { id },
    });

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    // 먼저 popular_songs 테이블의 관련 레코드 삭제
    await prisma.popularSong.deleteMany({
      where: { songId: id },
    });

    // 곡 데이터 삭제
    await prisma.song.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Error deleting song:', error);
    return NextResponse.json(
      { error: 'Failed to delete song' },
      { status: 500 }
    );
  }
}
