'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export type Message = {
  _id: string
  channelId?: string | null
  dmRoomId?: string | null
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

export function useMessages(id: string | null, type: 'channel' | 'dm' = 'channel') {
  return useQuery({
    queryKey: ['messages', id],
    queryFn: async () => {
      if (!id) return []
      const url = type === 'channel' ? `/message/${id}` : `/message/dm/${id}`
      const messages = await apiGet<Message[]>(url)
      return messages
    },
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds - messages change frequently
    refetchOnWindowFocus: true,
  })
}
