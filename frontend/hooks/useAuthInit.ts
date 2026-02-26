import { useEffect } from 'react'
import { useAuthStore, User } from '@/lib/store/authStore'
import { userService } from '@/services/api/userService'

// API Response type
interface UserResponse {
  success?: boolean
  user: User
}

/**
 * Hook to initialize auth state on app load
 * Fetches current user if token exists
 */
export function useAuthInit() {
  const { setUser, setLoading, hasToken } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      // Only fetch user if token exists
      if (!hasToken()) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await userService.getCurrentUser() as UserResponse
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
  }, [setUser, setLoading, hasToken])
}
