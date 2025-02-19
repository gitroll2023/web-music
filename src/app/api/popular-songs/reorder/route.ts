import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const { songId, newOrder } = await request.json();

    // 현재 인기곡 목록 가져오기
    const popularSongs = await prisma.popularSong.findMany({
      orderBy: {
        order: 'asc'
      }
    });

    // 변경하려는 곡의 현재 순서 찾기
    const currentSong = popularSongs.find(song => song.songId === songId);
    if (!currentSong) {
      return NextResponse.json(
        { error: 'Song not found in popular songs' },
        { status: 404 }
      );
    }

    const currentOrder = currentSong.order;

    // 순서 업데이트
    if (newOrder > currentOrder) {
      // 아래로 이동: 중간에 있는 곡들의 순서를 하나씩 위로 올림
      await prisma.$transaction([
        prisma.popularSong.updateMany({
          where: {
            order: {
              gt: currentOrder,
              lte: newOrder
            }
          },
          data: {
            order: {
              decrement: 1
            }
          }
        }),
        prisma.popularSong.update({
          where: { songId },
          data: { order: newOrder }
        })
      ]);
    } else if (newOrder < currentOrder) {
      // 위로 이동: 중간에 있는 곡들의 순서를 하나씩 아래로 내림
      await prisma.$transaction([
        prisma.popularSong.updateMany({
          where: {
            order: {
              gte: newOrder,
              lt: currentOrder
            }
          },
          data: {
            order: {
              increment: 1
            }
          }
        }),
        prisma.popularSong.update({
          where: { songId },
          data: { order: newOrder }
        })
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering popular song:', error);
    return NextResponse.json(
      { error: 'Failed to reorder popular song' },
      { status: 500 }
    );
  }
}
