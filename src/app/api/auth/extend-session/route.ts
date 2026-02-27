import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 세션 서명용 시크릿 (verify-password route와 동일)
const SESSION_SECRET = process.env.SESSION_SECRET || 'web-music-admin-session-secret-key-2024';

// 세션 만료 시간
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
 * 세션 토큰 검증
 */
async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [timestamp, hmac] = parts;
    const timestampNum = parseInt(timestamp, 10);
    if (isNaN(timestampNum)) return false;

    const now = Date.now();
    if (now - timestampNum > SESSION_MAX_AGE_MS) return false;

    return await verifyHmac(SESSION_SECRET, timestamp, hmac);
  } catch {
    return false;
  }
}

/**
 * 세션 토큰 생성: timestamp.hmac(timestamp, secret)
 */
async function createSessionToken(): Promise<string> {
  const timestamp = Date.now().toString();
  const hmac = await createHmac(SESSION_SECRET, timestamp);
  return `${timestamp}.${hmac}`;
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin-session');

    if (!sessionCookie || !(await verifySessionToken(sessionCookie.value))) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // 새 세션 토큰 발급
    const newToken = await createSessionToken();

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin-session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SEC,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to extend session' },
      { status: 500 }
    );
  }
}
