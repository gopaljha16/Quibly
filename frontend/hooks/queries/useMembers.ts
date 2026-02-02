'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export type Member = {
  _id: string
  user: {
    _id: string
    username: string
    discriminator: string
    avatar?: string | null
    banner?: string | null
    bio?: string
    status?: 'online' | 'idle' | 'dnd' | 'offline'
    customStatus?: string
  }
}

type MembersResponse = {
  success: boolean
  ownerId: string
  members: Array<{
    _id: string
    serverId: string
    userId: {
      _id: string
      username: string
      discriminator: string
      avatar?: string | null
      banner?: string | null
      bio?: string
      status?: 'online' | 'idle' | 'dnd' | 'offline'
      customStatus?: string
    }
    isMuted?: boolean
    isBanned?: boolean
  }>
}

export function useMembers(serverId: string | null) {
  return useQuery({
    queryKey: ['members', serverId],
    queryFn: async () => {
      if (!serverId) return { ownerId: null, members: [] }

      const response = await apiGet<MembersResponse>(`/server/${serverId}/members`)

      return {
        ownerId: response.ownerId || null,
        members: (response.members || []).map((m) => ({
          _id: m._id,
          user: m.userId,
        })),
      }
    },
    enabled: !!serverId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
