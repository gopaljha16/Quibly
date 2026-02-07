'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export type UserProfile = {
  _id: string
  username: string
  email: string
  discriminator: string
  avatar?: string | null
  banner?: string | null
  bio?: string
  status?: 'online' | 'idle' | 'dnd' | 'offline'
  customStatus?: string
}

type ProfileResponse = {
  success?: boolean
  user?: UserProfile
  username?: string
  email?: string
  avatar?: string
  banner?: string
  bio?: string
  _id?: string
}

export function useProfile() {
  // For httpOnly cookies, we can't check document.cookie
  // Instead, we always try to fetch if we're not on auth pages
  const isAuthPage = typeof window !== 'undefined' && (
    window.location.pathname.includes('/login') ||
    window.location.pathname.includes('/signup')
  )

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      console.log('Fetching user profile...')
      try {
        const response = await apiGet<ProfileResponse>('/auth/profile')
        console.log('Profile response:', response)
        
        // Handle different response formats
        let user: UserProfile | null = null;

        if (response.user) {
          user = {
            ...response.user,
            _id: response.user._id || (response.user as any).id || ''
          } as UserProfile
        } else if (response._id || (response as any).id) {
          // Fallback for flat response
          user = {
            _id: response._id || (response as any).id || '',
            username: response.username || '',
            email: response.email || '',
            discriminator: '0000',
            avatar: response.avatar,
            banner: response.banner,
            bio: response.bio
          } as UserProfile
        }

        console.log('Parsed user:', user)
        return user
        
      } catch (error: any) {
        console.error('❌ Profile fetch error:', error)
        // Don't clear anything - just throw the error
        throw error
      }
    },
    enabled: !isAuthPage, // Always try to fetch if not on auth page
    staleTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    throwOnError: false,
  })
}
