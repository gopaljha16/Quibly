import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  const { pathname } = request.nextUrl

  // If user is logged in and tries to access login/signup, redirect to channels
  if (token && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/channels/@me', request.url))
  }

  // If user is not logged in and tries to access protected routes, redirect to login
  if (!token && pathname.startsWith('/channels')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/channels/:path*', '/login', '/signup'],
}
