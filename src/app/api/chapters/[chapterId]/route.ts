import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { chapterId: string } }
) {
  try {
    const chapterId = parseInt(params.chapterId);
    if (isNaN(chapterId)) {
      return NextResponse.json({ error: 'Invalid chapter ID' }, { status: 400 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        songs: true
      }
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Error getting chapter:', error);
    return NextResponse.json(
      { error: 'Failed to get chapter' },
      { status: 500 }
    );
  }
}
