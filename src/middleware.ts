import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // /admin 경로에 대해서만 체크
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const hostname = request.headers.get('host') || ''
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')

    // 프로덕션에서는 biblemusic-gold.vercel.app만 허용
    if (!isLocalhost && !hostname.includes('biblemusic-gold.vercel.app')) {
      return new NextResponse(null, {
        status: 403,
        statusText: 'Forbidden',
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
