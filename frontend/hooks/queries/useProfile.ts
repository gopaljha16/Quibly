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
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await apiGet<ProfileResponse>('/auth/profile')

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

      return user
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - profile rarely changes
  })
}
