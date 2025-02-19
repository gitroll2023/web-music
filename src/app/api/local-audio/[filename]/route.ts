import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const AI_MUSIC_DIR = 'C:\\AI_MUSIC';

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    const filePath = path.join(AI_MUSIC_DIR, filename);

    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return NextResponse.json(
        { error: '파일을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 파일 정보 가져오기
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    // Range 헤더 처리
    const range = request.headers.get('range');
    console.log('Range header:', range); // 디버깅용

    if (range) {
      // Range 요청 처리
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // 범위 유효성 검사
      if (start >= fileSize) {
        console.error(`Invalid range request: start=${start}, fileSize=${fileSize}`);
        return new NextResponse('Requested range not satisfiable', {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      // 청크 크기 계산
      const chunkSize = Math.min((end - start) + 1, fileSize - start);
      const fileStream = fs.createReadStream(filePath, { start, end: start + chunkSize - 1 });

      // 부분 응답 헤더 설정
      const headers = new Headers({
        'Content-Range': `bytes ${start}-${start + chunkSize - 1}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      });

      console.log('Sending partial response:', {
        start,
        end: start + chunkSize - 1,
        size: chunkSize,
      });

      // 부분 콘텐츠 응답
      return new NextResponse(fileStream as any, {
        status: 206,
        headers,
      });
    } else {
      // 전체 파일 스트리밍
      const fileStream = fs.createReadStream(filePath);

      // 전체 응답 헤더 설정
      const headers = new Headers({
        'Content-Length': fileSize.toString(),
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      });

      console.log('Sending full file response:', { size: fileSize });

      // 전체 콘텐츠 응답
      return new NextResponse(fileStream as any, {
        status: 200,
        headers,
      });
    }
  } catch (error) {
    console.error('Error serving local audio:', error);
    return NextResponse.json(
      { error: '파일을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
