'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export type UserProfile = {
  _id: string
  username: string
  email: string
  discriminator: string
  avatar?: string | null
  bio?: string
  status?: 'online' | 'idle' | 'dnd' | 'offline'
  customStatus?: string
}

type ProfileResponse = {
  success?: boolean
  user?: UserProfile
  username?: string
  email?: string
  _id?: string
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await apiGet<ProfileResponse>('/auth/profile')
      
      // Handle different response formats
      if (response.user) {
        return response.user
      }
      
      // Fallback for flat response
      return {
        _id: response._id || '',
        username: response.username || '',
        email: response.email || '',
        discriminator: '0000',
      } as UserProfile
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - profile rarely changes
  })
}
