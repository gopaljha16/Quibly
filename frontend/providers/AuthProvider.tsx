'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { userService } from '@/services/api/userService'

/**
 * AuthProvider - Initializes auth state on app load
 * Fetches current user if token exists
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { setUser, setLoading, hasToken, isAuthenticated } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      // Skip auth pages
      const isAuthPage = pathname === '/login' || pathname === '/signup'
      if (isAuthPage) {
        setLoading(false)
        return
      }

      // Only fetch user if token exists and not already authenticated
      if (!hasToken() || isAuthenticated) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await userService.getCurrentUser()
        if (response?.user) {
          setUser(response.user)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
        // Clear auth state if token is invalid
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [pathname, setUser, setLoading, hasToken, isAuthenticated])

  return <>{children}</>
}
