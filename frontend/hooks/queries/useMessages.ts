'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export type Message = {
  _id: string
  channelId: string
  serverId?: string
  senderId:
    | string
    | {
        _id: string
        username: string
        avatar?: string | null
      }
  content: string
  createdAt: string
  editedAt?: string | null
}

export function useMessages(channelId: string | null) {
  return useQuery({
    queryKey: ['messages', channelId],
    queryFn: async () => {
      if (!channelId) return []
      const messages = await apiGet<Message[]>(`/message/${channelId}`)
      return messages
    },
    enabled: !!channelId,
    staleTime: 30 * 1000, // 30 seconds - messages change frequently
    refetchOnWindowFocus: true,
  })
}
