'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export type Member = {
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
  user: { // Compatibility with EnhancedChannelsShell
    _id: string
    username: string
    discriminator: string
    avatar?: string | null
    banner?: string | null
    bio?: string
    status?: 'online' | 'idle' | 'dnd' | 'offline'
    customStatus?: string
  }
  roleIds: string[]
  isMuted?: boolean
  isBanned?: boolean
  banReason?: string | null
  joinedAt: string
  isOwner: boolean
  timeoutUntil?: string | null
  timeoutReason?: string | null
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
    roleIds?: string[]
    joinedAt?: string
    isOwner?: boolean
    isMuted?: boolean
    isBanned?: boolean
    banReason?: string | null
    timeoutUntil?: string | null
    timeoutReason?: string | null
  }>
}

export function useMembers(serverId: string | null) {
  return useQuery({
    queryKey: ['members', serverId],
    queryFn: async () => {
      if (!serverId) return { ownerId: null, members: [] as Member[] }

      const response = await apiGet<MembersResponse>(`/server/${serverId}/members`)

      return {
        ownerId: response.ownerId || null,
        members: (response.members || []).map((m) => ({
          _id: m._id,
          serverId: m.serverId,
          userId: m.userId,
          user: m.userId, // Added for backward compatibility
          roleIds: m.roleIds || [],
          isMuted: m.isMuted,
          isBanned: m.isBanned,
          banReason: m.banReason,
          joinedAt: m.joinedAt || '',
          isOwner: !!m.isOwner,
          timeoutUntil: m.timeoutUntil,
          timeoutReason: m.timeoutReason
        })) as Member[],
      }
    },
    enabled: !!serverId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
