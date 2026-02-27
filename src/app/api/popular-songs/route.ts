import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

interface PopularSongWithRelations {
  id: number;
  songId: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// 인기곡 목록 가져오기
export async function GET() {
  try {
    const popularSongs = await prisma.popularSong.findMany({
      orderBy: {
        order: 'asc'
      },
      include: {
        song: {
          include: {
            chapter: true,
            genre: true
          }
        }
      }
    });

    return NextResponse.json(popularSongs);
  } catch (error) {
    console.error('Error fetching popular songs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular songs' },
      { status: 500 }
    );
  }
}

// 인기곡 추가
export async function POST(req: Request) {
  try {
    const { songId } = await req.json();

    // 현재 인기곡 수 확인
    const count = await prisma.popularSong.count();
    if (count >= 5) {
      return NextResponse.json(
        { error: 'Maximum number of popular songs (5) reached' },
        { status: 400 }
      );
    }

    // 이미 인기곡인지 확인
    const existing = await prisma.popularSong.findFirst({
      where: { songId }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Song is already in popular songs' },
        { status: 400 }
      );
    }

    // 새로운 인기곡 추가
    const popularSong = await prisma.popularSong.create({
      data: {
        songId,
        order: count + 1
      },
      include: {
        song: true
      }
    });

    return NextResponse.json(popularSong);
  } catch (error) {
    console.error('Error adding popular song:', error);
    return NextResponse.json(
      { error: 'Failed to add popular song' },
      { status: 500 }
    );
  }
}

// 인기곡 순서 변경
export async function PUT(req: Request) {
  try {
    const { updates } = await req.json();

    // 트랜잭션으로 모든 업데이트 실행
    await prisma.$transaction(
      updates.map(({ id, order }: { id: number; order: number }) =>
        prisma.popularSong.update({
          where: { id },
          data: { order }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating popular songs order:', error);
    return NextResponse.json(
      { error: 'Failed to update popular songs order' },
      { status: 500 }
    );
  }
}

// 인기곡 삭제
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Popular song ID is required' },
        { status: 400 }
      );
    }

    await prisma.popularSong.delete({
      where: { id: Number(id) }
    });

    // 남은 인기곡들의 순서 재정렬
    const remainingPopularSongs = await prisma.popularSong.findMany({
      orderBy: { order: 'asc' }
    });

    await prisma.$transaction(
      remainingPopularSongs.map((song: PopularSongWithRelations, index: number) =>
        prisma.popularSong.update({
          where: { id: song.id },
          data: { order: index + 1 }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting popular song:', error);
    return NextResponse.json(
      { error: 'Failed to delete popular song' },
      { status: 500 }
    );
  }
}
