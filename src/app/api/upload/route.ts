import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { prisma } from '@/lib/prisma';
import { uploadFileToDrive } from '@/utils/google-drive';

// OAuth2 클라이언트 설정
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export async function POST(request: NextRequest) {
  try {
    console.log('Starting file upload process...');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const chapterId = formData.get('chapterId') as string;

    console.log('Received file:', {
      name: file?.name,
      type: file?.type,
      size: file?.size,
      uploadType: type,
      chapterId
    });

    if (!file || !chapterId) {
      console.error('Missing file or chapterId');
      return NextResponse.json(
        { error: 'Missing file or chapterId' },
        { status: 400 }
      );
    }

    // 챕터 정보 가져오기
    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(chapterId) },
      include: { songs: true }
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // 챕터 번호 추출 (예: "계시록 22장" -> "22")
    const chapterNumber = chapter.name.match(/\d+/)?.[0];
    if (!chapterNumber) {
      return NextResponse.json(
        { error: 'Invalid chapter name format' },
        { status: 400 }
      );
    }

    // 파일 확장자 추출
    const extension = file.name.split('.').pop();

    let fileName;
    // 수정 모드에서 전달된 파일명이 있는 경우
    const existingFileName = formData.get('fileName') as string;
    if (existingFileName) {
      // 기존 파일명의 확장자만 새로운 파일의 확장자로 변경
      fileName = existingFileName.replace(/\.[^.]+$/, `.${extension}`);
    } else {
      // 해당 챕터의 기존 곡들 조회하여 다음 순번 결정
      const existingSongs = await prisma.song.findMany({
        where: { chapterId: chapter.id },
        orderBy: { fileName: 'desc' }
      });

      // 현재 챕터의 마지막 파일 번호 찾기
      let lastNumber = 0;
      for (const song of existingSongs) {
        const match = song.fileName?.match(new RegExp(`^${chapterNumber}-(\\d+)$`));
        if (match) {
          const num = parseInt(match[1]);
          if (num > lastNumber) lastNumber = num;
        }
      }

      // 새로운 파일명 생성 (예: "22-1.jpg", "22-2.mp3" 등)
      fileName = `${chapterNumber}-${lastNumber + 1}.${extension}`;
    }

    // 파일 메타데이터 설정
    const fileMetadata = {
      name: fileName
    };

    console.log('File metadata:', fileMetadata);

    // 파일을 ArrayBuffer로 변환
    console.log('Converting file to ArrayBuffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('File converted to buffer, size:', buffer.length);

    // 버퍼를 스트림으로 변환
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // 파일 업로드 시작
    console.log('Starting Google Drive upload...');
    const uploadResult = await uploadFileToDrive(file, fileName);
    console.log('Upload result:', uploadResult);

    if (!uploadResult.id) {
      throw new Error('Failed to upload file');
    }

    // 파일 권한 설정 (링크를 가진 사람에게 공개)
    console.log('Setting file permissions...');
    await drive.permissions.create({
      fileId: uploadResult.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // 파일을 공개로 설정
    await drive.files.update({
      fileId: uploadResult.id,
      requestBody: {
        shared: true
      }
    });

    console.log('File upload completed successfully');

    return NextResponse.json({
      success: true,
      fileId: uploadResult.id,
      fileUrl: `https://drive.google.com/file/d/${uploadResult.id}/view?usp=sharing`,
      fileName: fileName
    });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
