import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { AppConfig } from '@prisma/client';
import { Readable } from 'stream';

interface GoogleDriveConfig {
  GOOGLE_DRIVE_CLIENT_ID: string;
  GOOGLE_DRIVE_CLIENT_SECRET: string;
  GOOGLE_DRIVE_REDIRECT_URI: string;
  GOOGLE_DRIVE_REFRESH_TOKEN: string;
}

async function getGoogleDriveConfig(): Promise<GoogleDriveConfig> {
  // 1. DB에서 설정 가져오기
  const configs = await prisma.appConfig.findMany({
    where: {
      key: {
        in: [
          'GOOGLE_DRIVE_CLIENT_ID',
          'GOOGLE_DRIVE_CLIENT_SECRET',
          'GOOGLE_DRIVE_REDIRECT_URI',
          'GOOGLE_DRIVE_REFRESH_TOKEN'
        ]
      }
    }
  });

  // 2. DB 설정을 객체로 변환
  const dbConfig = configs.reduce((acc: Partial<GoogleDriveConfig>, config: AppConfig) => {
    if (config.value) {  // 값이 있는 경우만 추가
      acc[config.key as keyof GoogleDriveConfig] = config.value;
    }
    return acc;
  }, {});

  // 3. 환경 변수에서 가져오기
  const envConfig: Partial<GoogleDriveConfig> = {
    GOOGLE_DRIVE_CLIENT_ID: process.env.GOOGLE_DRIVE_CLIENT_ID,
    GOOGLE_DRIVE_CLIENT_SECRET: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    GOOGLE_DRIVE_REDIRECT_URI: process.env.GOOGLE_DRIVE_REDIRECT_URI,
    GOOGLE_DRIVE_REFRESH_TOKEN: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  };

  // 4. DB 설정과 환경 변수 설정 병합 (DB 설정 우선)
  const mergedConfig = {
    ...envConfig,
    ...dbConfig
  };

  // 5. 필수 설정 확인
  const requiredKeys: (keyof GoogleDriveConfig)[] = [
    'GOOGLE_DRIVE_CLIENT_ID',
    'GOOGLE_DRIVE_CLIENT_SECRET',
    'GOOGLE_DRIVE_REDIRECT_URI',
    'GOOGLE_DRIVE_REFRESH_TOKEN'
  ];

  const missingKeys = requiredKeys.filter(key => !mergedConfig[key]);

  if (missingKeys.length > 0) {
    throw new Error(`Missing required Google Drive configurations: ${missingKeys.join(', ')}`);
  }

  return mergedConfig as GoogleDriveConfig;
}

async function generateFileName(chapterId: number, fileExtension: string): Promise<string> {
  // 해당 챕터의 모든 곡을 가져옴
  const songs = await prisma.song.findMany({
    where: {
      chapterId: chapterId
    },
    select: {
      fileName: true
    }
  });

  // 파일명에서 번호 추출 (1-1, 1-2 등에서 두 번째 숫자)
  const numbers = songs
    .map((song: { fileName: string | null }) => song.fileName)
    .filter((fileName: string | null): fileName is string => !!fileName)
    .map((fileName: string) => {
      const match = fileName.match(new RegExp(`^${chapterId}-(\\d+)`));
      return match ? parseInt(match[1]) : 0;
    });

  // 가장 큰 번호 찾기
  const maxNumber = Math.max(0, ...numbers);

  // 새 파일명 생성 (챕터번호-순번.확장자)
  return `${chapterId}-${maxNumber + 1}${fileExtension}`;
}

// Buffer를 Readable 스트림으로 변환
function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(request: NextRequest) {
  try {
    const config = await getGoogleDriveConfig();
    
    const oauth2Client = new google.auth.OAuth2(
      config.GOOGLE_DRIVE_CLIENT_ID,
      config.GOOGLE_DRIVE_CLIENT_SECRET,
      config.GOOGLE_DRIVE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: config.GOOGLE_DRIVE_REFRESH_TOKEN
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chapterId = formData.get('chapterId');
    const type = formData.get('type');

    if (!file || !chapterId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 파일 확장자 추출
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    // 새 파일명 생성
    const newFileName = await generateFileName(Number(chapterId), extension);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const stream = bufferToStream(buffer);

    // 구글 드라이브에 파일 업로드
    const fileMetadata = {
      name: newFileName,
    };

    const media = {
      mimeType: file.type,
      body: stream,
    };

    const driveResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    if (!driveResponse.data.id) {
      throw new Error('Failed to upload to Google Drive');
    }

    // 파일 권한 설정 (공개)
    await drive.permissions.create({
      fileId: driveResponse.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return NextResponse.json({ 
      success: true,
      fileId: driveResponse.data.id,
      fileUrl: `https://drive.google.com/uc?export=view&id=${driveResponse.data.id}`,
      fileName: newFileName
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
