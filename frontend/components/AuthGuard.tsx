'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import LoadingScreen from './LoadingScreen'

/**
 * AuthGuard - Client-side authentication guard
 * Redirects unauthenticated users to login page
 * Handles both cookie and localStorage tokens
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, hasToken } = useAuthStore()

  useEffect(() => {
    // Skip auth check for public pages
    const isPublicPage = pathname === '/login' || pathname === '/signup' || pathname === '/'
    if (isPublicPage) return

    // Wait for auth to initialize
    if (isLoading) return

    // Check if user has token (cookie or localStorage)
    const tokenExists = hasToken()

    // If no token and trying to access protected route, redirect to login
    if (!tokenExists && !isAuthenticated && pathname.startsWith('/channels')) {
      console.log('[AuthGuard] No token found, redirecting to login')
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, pathname, router, hasToken])

  // Show loading screen while checking auth
  if (isLoading && pathname.startsWith('/channels')) {
    return <LoadingScreen />
  }

  

  return <>{children}</>
}
