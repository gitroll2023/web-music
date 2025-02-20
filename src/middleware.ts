import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // /admin 경로에 대해서만 체크
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const hostname = request.headers.get('host') || ''
    
    // localhost 또는 127.0.0.1인 경우에만 허용
    if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      return new NextResponse('Access Denied', {
        status: 403,
        statusText: 'Forbidden',
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    }
  }

  return NextResponse.next()
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: '/admin/:path*',
}
