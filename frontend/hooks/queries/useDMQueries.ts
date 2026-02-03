'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { Friend } from './useFriendQueries'

export type DMConversation = {
    id: string
    otherUser: Friend | null
    lastMessage: {
        content: string
        createdAt: string
        senderId: string
    } | null
    updatedAt: string
}

export type DMRoom = {
    id: string
    createdAt: string
    updatedAt: string
    otherUser: Friend | null
    participants: any[]
    mutualServers?: {
        id: string
        name: string
        icon: string | null
    }[]
    friendshipStatus?: 'PENDING' | 'ACCEPTED' | 'BLOCKED' | null
    debugInfo?: {
        myId: string
        otherId: string
        myServerCount: number
        mutualFound: number
    }
}

export function useDMConversations() {
    return useQuery({
        queryKey: ['dm-conversations'],
        queryFn: async () => {
            const response = await apiGet<{ success: boolean; conversations: DMConversation[] }>('/dm/conversations')
            return response.conversations
        },
        staleTime: 30 * 1000,
    })
}

export function useDMRoom(roomId: string | null) {
    return useQuery({
        queryKey: ['dm-room', roomId],
        queryFn: async () => {
            if (!roomId) return null
            const response = await apiGet<{ success: boolean; room: DMRoom }>(`/dm/room/${roomId}`)
            return response.room
        },
        enabled: !!roomId,
        staleTime: 30 * 1000,
    })
}
