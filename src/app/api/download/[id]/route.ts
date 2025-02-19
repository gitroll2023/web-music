import { NextResponse } from 'next/server';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';

const AI_MUSIC_DIR = 'C:\\AI_MUSIC';

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

    // 이미 다운로드된 파일이 있는지 확인
    try {
      await fsPromises.access(filePath);
      return NextResponse.json({
        success: true,
        filename: filename
      });
    } catch {
      // 파일이 없으면 다운로드 진행
    }

    // Google Drive 직접 다운로드
    const driveUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
    const response = await fetch(driveUrl, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error('파일 다운로드 실패 - 상태 코드: ' + response.status);
    }

    const arrayBuffer = await response.arrayBuffer();
    await fsPromises.writeFile(filePath, Buffer.from(arrayBuffer));

    return NextResponse.json({
      success: true,
      filename: filename
    });

  } catch (error: unknown) {
    console.error('다운로드 실패:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '파일 다운로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}
