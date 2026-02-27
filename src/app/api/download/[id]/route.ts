import { NextResponse } from 'next/server';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import os from 'os';
import { prisma } from '@/lib/prisma';

// 임시 디렉토리를 사용
const AI_MUSIC_DIR = path.join(os.tmpdir(), 'AI_MUSIC');

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // AI_MUSIC 디렉토리가 없으면 생성
    try {
      await fsPromises.access(AI_MUSIC_DIR);
    } catch {
      await fsPromises.mkdir(AI_MUSIC_DIR, { recursive: true });
    }

    const fileId = params.id;
    const { searchParams } = new URL(request.url);
    const checkOnly = searchParams.get('check') === 'true';
    
    // DB에서 파일명 가져오기
    const song = await prisma.song.findFirst({
      where: { driveFileId: fileId }
    });

    if (!song?.fileName) {
      throw new Error('파일을 찾을 수 없습니다.');
    }

    const filename = `${song.fileName}.mp3`;
    const filePath = path.join(AI_MUSIC_DIR, filename);

    // 파일 존재 여부만 확인
    if (checkOnly) {
      try {
        await fsPromises.access(filePath);
        return NextResponse.json({
          exists: true,
          filename: filename
        });
      } catch {
        return NextResponse.json({
          exists: false,
          filename: filename
        });
      }
    }

    // 파일이 없으면 에러
    try {
      await fsPromises.access(filePath);
    } catch {
      return NextResponse.json({
        error: '파일이 존재하지 않습니다.'
      }, { status: 404 });
    }

    // 파일 읽기
    const fileBuffer = await fsPromises.readFile(filePath);

    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
    headers.set('Content-Length', fileBuffer.length.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
