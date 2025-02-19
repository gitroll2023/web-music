import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const drive = google.drive('v3');

// 서비스 계정 키 파일 읽기
const keyPath = path.join(process.cwd(), 'docs', 'musicapp-450804-f9c36169258e.json');
const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

export async function GET() {
  try {
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder'",
      fields: 'files(id, name)',
      auth,
      pageSize: 100
    });

    const folders = response.data.files;
    
    // 폴더 정보를 콘솔에 출력 (디버깅용)
    console.log('Found folders:', folders);
    
    return NextResponse.json(folders);
  } catch (error: any) {
    console.error('Error listing folders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list folders' },
      { status: 500 }
    );
  }
}
