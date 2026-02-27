import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

// 설정 타입 정의
interface Settings {
  musicPath: string;
}

// 설정 파일 읽기
async function readSettings(): Promise<Settings> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // 기본 설정
    return { musicPath: '' };
  }
}

// 설정 파일 저장
async function writeSettings(settings: Settings) {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// 설정 가져오기
export async function GET() {
  const settings = await readSettings();
  return NextResponse.json(settings);
}

// 설정 저장하기
export async function POST(request: Request) {
  try {
    const settings = await request.json();
    
    // 경로가 존재하는지 확인
    try {
      await fs.access(settings.musicPath);
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 경로입니다.' },
        { status: 400 }
      );
    }

    await writeSettings(settings);
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: '설정을 저장하는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
