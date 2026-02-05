'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '@/lib/api'
import { Message } from '../queries'

type SendMessageData = {
  channelId?: string
  dmRoomId?: string
  content: string
  type?: 'TEXT' | 'FILE' | 'SYSTEM'
  attachments?: any[]
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SendMessageData) => {
      const message = await apiPost<Message>('/message', data)
      return message
    },
  })
}
