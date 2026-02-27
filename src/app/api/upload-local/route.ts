import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileName = formData.get('fileName') as string | null;

    if (!file || !fileName) {
      return NextResponse.json({ error: 'file과 fileName이 필요합니다.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // public/music/ 디렉토리에 저장
    const musicDir = path.join(process.cwd(), 'public', 'music');
    const filePath = path.join(musicDir, fileName);

    await writeFile(filePath, buffer);

    return NextResponse.json({ success: true, path: `/music/${fileName}` });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
