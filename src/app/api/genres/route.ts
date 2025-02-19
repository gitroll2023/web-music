import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 장르 목록 조회
export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}

// 장르 생성
export async function POST(request: Request) {
  try {
    const { id, name } = await request.json();
    
    // ID와 이름이 모두 제공되었는지 확인
    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }

    // ID가 영문, 숫자, 하이픈만 포함하는지 확인
    if (!/^[a-z0-9-]+$/.test(id)) {
      return NextResponse.json(
        { error: 'ID must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    const genre = await prisma.genre.create({
      data: { id, name }
    });

    return NextResponse.json(genre);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Genre with this ID already exists' },
        { status: 409 }
      );
    }
    console.error('Error creating genre:', error);
    return NextResponse.json(
      { error: 'Failed to create genre' },
      { status: 500 }
    );
  }
}

// 장르 수정
export async function PUT(request: Request) {
  try {
    const { id, name } = await request.json();
    
    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }

    const genre = await prisma.genre.update({
      where: { id },
      data: { name }
    });

    return NextResponse.json(genre);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Genre not found' },
        { status: 404 }
      );
    }
    console.error('Error updating genre:', error);
    return NextResponse.json(
      { error: 'Failed to update genre' },
      { status: 500 }
    );
  }
}

// 장르 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Genre ID is required' },
        { status: 400 }
      );
    }

    await prisma.genre.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Genre not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting genre:', error);
    return NextResponse.json(
      { error: 'Failed to delete genre' },
      { status: 500 }
    );
  }
}
