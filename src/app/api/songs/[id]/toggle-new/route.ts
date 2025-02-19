import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const songId = parseInt(params.id);
    
    // 현재 곡의 isNew 상태를 반전
    const song = await prisma.song.update({
      where: { id: songId },
      data: {
        isNew: false
      }
    });

    return NextResponse.json(song);
  } catch (error) {
    console.error('Error toggling new song status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle new song status' },
      { status: 500 }
    );
  }
}
