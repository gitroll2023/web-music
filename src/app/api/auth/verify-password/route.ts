import { NextResponse } from 'next/server';

// 서버 사이드에서만 실행되는 비밀번호 검증
// wjsoft의 SHA-256 해시 (소문자 변환 후 해시)
const CORRECT_HASH = '23d5718f5e0f91a2843a4cbce0e62795c3f1d47ae260290131715c672995fe86';

// 세션 서명용 시크릿 (환경변수 우선, 없으면 기본값 사용)
const SESSION_SECRET = process.env.SESSION_SECRET || 'web-music-admin-session-secret-key-2024';

// 세션 만료 시간: 1시간 (밀리초)
const SESSION_MAX_AGE_MS = 60 * 60 * 1000;
const SESSION_MAX_AGE_SEC = 60 * 60;

/**
 * Web Crypto API를 사용한 HMAC 생성
 */
async function createHmac(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 타이밍 안전한 HMAC 검증
 */
async function verifyHmac(key: string, message: string, expectedHmac: string): Promise<boolean> {
  const computedHmac = await createHmac(key, message);
  if (computedHmac.length !== expectedHmac.length) return false;
  // 타이밍 안전 비교 (timing-safe comparison)
  let result = 0;
  for (let i = 0; i < computedHmac.length; i++) {
    result |= computedHmac.charCodeAt(i) ^ expectedHmac.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Web Crypto API를 사용한 SHA-256 해시
 */
async function sha256Hash(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 세션 토큰 생성: timestamp.hmac(timestamp, secret)
 */
async function createSessionToken(): Promise<string> {
  const timestamp = Date.now().toString();
  const hmac = await createHmac(SESSION_SECRET, timestamp);
  return `${timestamp}.${hmac}`;
}

/**
 * 세션 토큰 검증
 */
async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [timestamp, hmac] = parts;
    const timestampNum = parseInt(timestamp, 10);
    if (isNaN(timestampNum)) return false;

    // 만료 확인
    const now = Date.now();
    if (now - timestampNum > SESSION_MAX_AGE_MS) return false;

    // HMAC 검증
    return await verifyHmac(SESSION_SECRET, timestamp, hmac);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // 입력된 비밀번호를 소문자 변환 후 해시화 (클라이언트와 동일한 방식)
    const hashedPassword = await sha256Hash(password.toLowerCase());

    // 해시값 비교
    const isValid = hashedPassword === CORRECT_HASH;

    if (isValid) {
      // 세션 토큰 생성 및 HTTP-only 쿠키 설정
      const sessionToken = await createSessionToken();

      const response = NextResponse.json({ isValid: true });
      response.cookies.set('admin-session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE_SEC,
      });

      return response;
    }

    return NextResponse.json({ isValid: false });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
