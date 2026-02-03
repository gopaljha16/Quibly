'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api'
import { Message } from '../queries'

export function useEditMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      messageId,
      content,
    }: {
      messageId: string
      content: string
    }) => {
      const message = await apiRequest<Message>(`/message/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      })
      return message
    },
    onSuccess: (updatedMessage) => {
      // Update in cache
      const targetId = updatedMessage.channelId || updatedMessage.dmRoomId
      if (!targetId) return

      queryClient.setQueryData<Message[]>(['messages', targetId], (old = []) =>
        old.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      )
    },
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, channelId, dmRoomId }: { messageId: string; channelId?: string; dmRoomId?: string }) => {
      await apiRequest(`/message/${messageId}`, { method: 'DELETE' })
      return { messageId, channelId, dmRoomId }
    },
    onMutate: async ({ messageId, channelId, dmRoomId }) => {
      const targetId = channelId || dmRoomId
      if (!targetId) return

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', targetId] })

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', targetId])

      // Optimistically remove
      queryClient.setQueryData<Message[]>(['messages', targetId], (old = []) =>
        old.filter((m) => m._id !== messageId)
      )

      return { previousMessages }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      const targetId = variables.channelId || variables.dmRoomId
      if (context?.previousMessages && targetId) {
        queryClient.setQueryData(
          ['messages', targetId],
          context.previousMessages
        )
      }
    },
  })
}
