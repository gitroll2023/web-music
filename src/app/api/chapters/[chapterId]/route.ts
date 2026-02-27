import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { logApiError } from '@/lib/apiResponse';

export async function GET(
  request: Request,
  { params }: { params: { chapterId: string } }
) {
  try {
    const chapterId = parseInt(params.chapterId);
    if (isNaN(chapterId) || chapterId <= 0) {
      return NextResponse.json(
        { error: 'Invalid chapter ID: must be a positive integer' },
        { status: 400 }
      );
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        songs: true
      }
    });

    if (!chapter) {
      return NextResponse.json(
        { error: `Chapter with ID ${chapterId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(chapter);
  } catch (error) {
    logApiError(`GET /api/chapters/${params.chapterId}`, error);
    return NextResponse.json(
      { error: 'Failed to get chapter' },
      { status: 500 }
    );
  }
}
