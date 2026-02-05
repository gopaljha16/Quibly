'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPut, apiDelete, apiGet } from '@/lib/api'
import { Message } from './useMessages'
import { toast } from 'sonner'

// Pin a message
export function usePinMessage() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (messageId: string) => {
            const response = await apiPut<Message>(`/message/${messageId}/pin`)
            return response
        },
        onSuccess: (data) => {
            // Update the message in the messages cache
            const channelId = data.channelId
            if (channelId) {
                queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) => {
                    return old.map(msg => msg._id === data._id ? data : msg)
                })

                // Invalidate pinned messages query
                queryClient.invalidateQueries({ queryKey: ['pinnedMessages', channelId] })
            }

            toast.success('Message pinned successfully')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to pin message')
        }
    })
}

// Unpin a message
export function useUnpinMessage() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (messageId: string) => {
            const response = await apiDelete<Message>(`/message/${messageId}/pin`)
            return response
        },
        onSuccess: (data) => {
            // Update the message in the messages cache
            const channelId = data.channelId
            if (channelId) {
                queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) => {
                    return old.map(msg => msg._id === data._id ? data : msg)
                })

                // Invalidate pinned messages query
                queryClient.invalidateQueries({ queryKey: ['pinnedMessages', channelId] })
            }

            toast.success('Message unpinned successfully')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to unpin message')
        }
    })
}

// Get pinned messages for a channel
export function usePinnedMessages(channelId: string | null) {
    return useQuery({
        queryKey: ['pinnedMessages', channelId],
        queryFn: async () => {
            if (!channelId) return []
            const response = await apiGet<Message[]>(`/message/pinned/${channelId}`)
            return response
        },
        enabled: !!channelId,
        staleTime: 30000, // 30 seconds
    })
}
