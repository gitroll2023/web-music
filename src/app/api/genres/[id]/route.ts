import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
