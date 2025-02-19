import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

// 환경 변수에서 음악 파일 디렉토리 경로를 가져옵니다.
const AI_MUSIC_DIR = process.env.AI_MUSIC_DIR || 'C:\\AI_MUSIC';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 데이터베이스에서 노래 정보를 가져옵니다.
    const song = await prisma.song.findFirst({
      where: {
        OR: [
          { id: isNaN(Number(params.id)) ? undefined : Number(params.id) },
          { fileName: params.id }
        ]
      }
    });

    if (!song) {
      return NextResponse.json(
        { error: '노래를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 파일 경로를 구성합니다.
    const filePath = path.join(AI_MUSIC_DIR, song.fileName);
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return NextResponse.json(
        { error: '파일을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const fileStream = fs.createReadStream(filePath);
    const stat = fs.statSync(filePath);

    const headersList = headers();
    const range = headersList.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      const stream = fs.createReadStream(filePath, { start, end });
      
      const head = {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': 'audio/mpeg',
      };
      
      return new NextResponse(stream as any, {
        status: 206,
        headers: head,
      });
    }

    const head = {
      'Content-Length': stat.size.toString(),
      'Content-Type': 'audio/mpeg',
    };

    return new NextResponse(fileStream as any, {
      headers: head,
    });
  } catch (error) {
    console.error('Error streaming audio:', error);
    return NextResponse.json(
      { error: '오디오 스트리밍 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
