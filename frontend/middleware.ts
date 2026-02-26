import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  const { pathname } = request.nextUrl

  // Only redirect if we're SURE there's no auth (cookie exists and user tries auth pages)
  // For protected routes, let client-side handle it since token might be in localStorage
  if (token && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/channels/@me', request.url))
  }

  // Don't redirect on protected routes - let AuthGuard handle it client-side
  // This allows localStorage tokens to work in production
  return NextResponse.next()
}

export const config = {
  matcher: ['/channels/:path*', '/login', '/signup'],
}
