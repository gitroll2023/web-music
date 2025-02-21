import { NextResponse } from 'next/server';
import crypto from 'crypto';

// 서버 사이드에서만 실행되는 비밀번호 검증
const CORRECT_HASH = '0f7c63d5342c66cb3aa5ae6e874e01e5e1a9f8b9bb8c9f50f7b0e1a9f8b9bb8c';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // 입력된 비밀번호를 해시화
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    // 해시값 비교
    const isValid = hashedPassword === CORRECT_HASH;

    return NextResponse.json({ isValid });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
