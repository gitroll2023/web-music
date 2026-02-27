import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { logApiError } from '@/lib/apiResponse';

export async function GET() {
  try {
    const chapters = await prisma.chapter.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(chapters);
  } catch (error) {
    logApiError('GET /api/chapters', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let data: { name?: string };
    try {
      data = await request.json();
    } catch (parseError) {
      logApiError('POST /api/chapters (JSON parse)', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // 필수 필드 검증
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Chapter name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const trimmedName = data.name.trim();

    // 이미 존재하는 챕터인지 확인
    const existingChapter = await prisma.chapter.findFirst({
      where: {
        name: trimmedName
      }
    });

    if (existingChapter) {
      return NextResponse.json(
        { error: 'Chapter with this name already exists', chapter: existingChapter },
        { status: 409 }
      );
    }

    // 챕터 생성
    const chapter = await prisma.chapter.create({
      data: {
        name: trimmedName
      }
    });

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    logApiError('POST /api/chapters', error);
    return NextResponse.json(
      { error: 'Failed to create chapter' },
      { status: 500 }
    );
  }
} 