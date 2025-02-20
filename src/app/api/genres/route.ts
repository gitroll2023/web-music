import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET 요청 처리
export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    return NextResponse.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json(
      { error: '장르 목록을 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST 요청 처리
export async function POST(request: NextRequest) {
  try {
    const { id, name } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID와 장르 이름을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이미 존재하는 ID인지 확인
    const existingGenre = await prisma.genre.findUnique({
      where: { id }
    });

    if (existingGenre) {
      return NextResponse.json(
        { error: '이미 존재하는 장르 ID입니다.' },
        { status: 400 }
      );
    }

    // 장르 생성
    const genre = await prisma.genre.create({
      data: {
        id,
        name
      }
    });

    return NextResponse.json(genre);
  } catch (error) {
    console.error('Error creating genre:', error);
    return NextResponse.json(
      { error: '장르 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PUT 요청 처리
export async function PUT(request: NextRequest) {
  try {
    const { id, name } = await request.json();
    
    if (!id || !name) {
      return NextResponse.json(
        { error: '장르 ID와 이름을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const genre = await prisma.genre.update({
      where: { id },
      data: { name }
    });

    return NextResponse.json(genre);
  } catch (error) {
    console.error('Error updating genre:', error);
    return NextResponse.json(
      { error: '장르 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE 요청 처리
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '장르 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    await prisma.genre.delete({
      where: { id }
    });

    return NextResponse.json({ message: '장르가 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting genre:', error);
    return NextResponse.json(
      { error: '장르 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
