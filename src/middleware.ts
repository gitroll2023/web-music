import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 세션 서명용 시크릿 (verify-password route와 동일해야 함)
const SESSION_SECRET = process.env.SESSION_SECRET || 'web-music-admin-session-secret-key-2024';

// 세션 만료 시간: 1시간 (밀리초)
const SESSION_MAX_AGE_MS = 60 * 60 * 1000;

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
 * 세션 토큰 검증: timestamp.hmac(timestamp, secret)
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api/auth/* 경로는 인증 없이 통과 (로그인/토큰 관련 API)
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // /admin/* 경로만 보호
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('admin-session');

    if (!sessionCookie || !sessionCookie.value) {
      // API 요청인 경우 401 반환
      if (pathname.startsWith('/admin/api')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // 페이지 요청인 경우: 쿠키가 없어도 admin 페이지로 보냄
      // (admin 페이지 자체에 로그인 폼이 있으므로, 쿠키가 없으면 로그인 폼을 보여줌)
      // 단, 서버사이드에서 추가 보호를 위해 헤더에 미인증 상태 표시
      const response = NextResponse.next();
      response.headers.set('x-admin-authenticated', 'false');
      return response;
    }

    // 세션 토큰 검증
    const isValid = await verifySessionToken(sessionCookie.value);

    if (!isValid) {
      // 만료되거나 무효한 세션 쿠키 삭제
      const response = NextResponse.next();
      response.cookies.delete('admin-session');
      response.headers.set('x-admin-authenticated', 'false');
      return response;
    }

    // 인증된 요청
    const response = NextResponse.next();
    response.headers.set('x-admin-authenticated', 'true');
    return response;
  }

  // /admin 외의 경로는 통과
  return NextResponse.next();
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: [
    // /admin 및 하위 경로 보호
    '/admin/:path*',
    // /api/auth 경로도 매처에 포함 (통과시키기 위해)
    '/api/auth/:path*',
  ],
};
