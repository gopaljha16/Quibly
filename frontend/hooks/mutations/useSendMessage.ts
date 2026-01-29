'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '@/lib/api'
import { Message } from '../queries'

type SendMessageData = {
  channelId: string
  content: string
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: SendMessageData) => {
      const message = await apiPost<Message>('/message', data)
      return message
    },
    onMutate: async (variables) => {
      const { channelId, content } = variables
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', channelId] })
      
      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', channelId])
      
      // Optimistically update
      const optimisticMessage: Message = {
        _id: `optimistic-${Date.now()}`,
        channelId,
        senderId: 'me',
        content,
        createdAt: new Date().toISOString(),
      }
      
      queryClient.setQueryData<Message[]>(
        ['messages', channelId],
        (old = []) => [...old, optimisticMessage]
      )
      
      return { previousMessages, optimisticMessage }
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
    onSuccess: (newMessage, variables, context) => {
      // Replace optimistic message with real one
      queryClient.setQueryData<Message[]>(
        ['messages', variables.channelId],
        (old = []) => {
          const withoutOptimistic = old.filter(
            (m) => m._id !== context?.optimisticMessage._id
          )
          
          // Check if message already exists (from socket)
          const exists = withoutOptimistic.some((m) => m._id === newMessage._id)
          if (exists) return withoutOptimistic
          
          return [...withoutOptimistic, newMessage]
        }
      )
    },
  })
}
