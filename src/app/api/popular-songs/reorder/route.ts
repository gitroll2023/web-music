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

    // 변경하려는 곡의 현재 순서와 ID 찾기
    const currentSong = popularSongs.find(song => song.songId === songId);
    if (!currentSong) {
      return NextResponse.json(
        { error: 'Song not found in popular songs' },
        { status: 404 }
      );
    }

    const currentOrder = currentSong.order;
    const currentId = currentSong.id;

    // 순서가 같으면 변경하지 않음
    if (currentOrder === newOrder) {
      return NextResponse.json({ success: true });
    }

    // 순서 업데이트를 위한 트랜잭션
    await prisma.$transaction(async (tx) => {
      if (newOrder > currentOrder) {
        // 아래로 이동
        await tx.popularSong.updateMany({
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
        });
      } else {
        // 위로 이동
        await tx.popularSong.updateMany({
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
        });
      }

      // 선택된 곡의 순서 변경 (id를 사용하여 업데이트)
      await tx.popularSong.update({
        where: { id: currentId },
        data: { order: newOrder }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering popular songs:', error);
    return NextResponse.json(
      { error: 'Failed to reorder popular songs' },
      { status: 500 }
    );
  }
}
