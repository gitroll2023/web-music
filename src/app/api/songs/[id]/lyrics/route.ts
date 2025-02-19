import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const songId = parseInt(params.id);
    const { lyrics } = await request.json();

    const song = await prisma.song.update({
      where: { id: songId },
      data: { lyrics }
    });

    return NextResponse.json(song);
  } catch (error) {
    console.error('Error updating lyrics:', error);
    return NextResponse.json(
      { error: 'Failed to update lyrics' },
      { status: 500 }
    );
  }
}
