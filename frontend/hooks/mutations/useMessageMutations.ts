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
      const channelId = updatedMessage.channelId
      queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) =>
        old.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      )
    },
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ messageId, channelId }: { messageId: string; channelId: string }) => {
      await apiRequest(`/message/${messageId}`, { method: 'DELETE' })
      return { messageId, channelId }
    },
    onMutate: async ({ messageId, channelId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', channelId] })
      
      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', channelId])
      
      // Optimistically remove
      queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) =>
        old.filter((m) => m._id !== messageId)
      )
      
      return { previousMessages }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['messages', variables.channelId],
          context.previousMessages
        )
      }
    },
  })
}
