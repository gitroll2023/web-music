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
    
    // 테스트용 샘플 장르 데이터
    const sampleGenres = [
      { id: 'worship', name: '경배와 찬양', createdAt: new Date(), updatedAt: new Date() },
      { id: 'gospel', name: '가스펠', createdAt: new Date(), updatedAt: new Date() },
      { id: 'ccm', name: 'CCM', createdAt: new Date(), updatedAt: new Date() },
      { id: 'hymn', name: '찬송가', createdAt: new Date(), updatedAt: new Date() },
      { id: 'pop', name: '팝', createdAt: new Date(), updatedAt: new Date() },
      { id: 'rock', name: '락', createdAt: new Date(), updatedAt: new Date() },
      { id: 'hiphop', name: '힙합', createdAt: new Date(), updatedAt: new Date() },
      { id: 'ballad', name: '발라드', createdAt: new Date(), updatedAt: new Date() }
    ];
    
    // 실제 데이터가 없는 경우 샘플 데이터 사용
    const returnData = genres.length > 0 ? genres : sampleGenres;
    
    return NextResponse.json({ genres: returnData });
  } catch (error) {
    console.error('Error fetching genres:', error);
    
    // 에러 발생 시 샘플 데이터 반환
    const sampleGenres = [
      { id: 'worship', name: '경배와 찬양', createdAt: new Date(), updatedAt: new Date() },
      { id: 'gospel', name: '가스펠', createdAt: new Date(), updatedAt: new Date() },
      { id: 'ccm', name: 'CCM', createdAt: new Date(), updatedAt: new Date() },
      { id: 'hymn', name: '찬송가', createdAt: new Date(), updatedAt: new Date() },
      { id: 'pop', name: '팝', createdAt: new Date(), updatedAt: new Date() },
      { id: 'rock', name: '락', createdAt: new Date(), updatedAt: new Date() },
      { id: 'hiphop', name: '힙합', createdAt: new Date(), updatedAt: new Date() },
      { id: 'ballad', name: '발라드', createdAt: new Date(), updatedAt: new Date() }
    ];
    
    return NextResponse.json({ genres: sampleGenres });
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
