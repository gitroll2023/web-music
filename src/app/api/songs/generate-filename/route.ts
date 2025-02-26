import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    if (!chapterId) {
      return NextResponse.json(
        { error: 'Chapter ID is required' },
        { status: 400 }
      );
    }

    // 챕터 정보 가져오기
    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(chapterId) }
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // 챕터 번호 추출 (예: "계시록 22장" -> "22")
    const chapterNumber = chapter.name.match(/\d+/)?.[0];
    if (!chapterNumber) {
      return NextResponse.json(
        { error: 'Invalid chapter name format' },
        { status: 400 }
      );
    }

    // 해당 챕터의 기존 곡들 조회하여 다음 순번 결정
    const existingSongs = await prisma.song.findMany({
      where: { chapterId: chapter.id },
      orderBy: { fileName: 'desc' }
    });

    // 현재 챕터의 마지막 파일 번호 찾기
    let lastNumber = 0;
    for (const song of existingSongs) {
      const match = song.fileName?.match(new RegExp(`^${chapterNumber}-(\\d+)$`));
      if (match) {
        const num = parseInt(match[1]);
        if (num > lastNumber) lastNumber = num;
      }
    }

    // 새로운 파일명 생성 (예: "22-1", "22-2" 등)
    const fileName = `${chapterNumber}-${lastNumber + 1}`;

    return NextResponse.json({ fileName });
  } catch (error) {
    console.error('Error generating file name:', error);
    return NextResponse.json(
      { error: 'Failed to generate file name' },
      { status: 500 }
    );
  }
}
