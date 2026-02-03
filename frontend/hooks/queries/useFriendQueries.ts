'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiDelete } from '@/lib/api'

export type Friend = {
    id: string
    username: string
    discriminator: string
    avatar?: string | null
    status: 'online' | 'idle' | 'dnd' | 'offline'
    customStatus?: string | null
    customStatusEmoji?: string | null
}

export type FriendRequest = {
    id: string
    senderId: string
    receiverId: string
    status: 'PENDING'
    createdAt: string
    sender: Friend
    receiver: Friend
}

export function useRemoveFriend() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (friendId: string) => apiDelete(`/friends/${friendId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            queryClient.invalidateQueries({ queryKey: ['dm-room'] });
        }
    });
}

export function useAddFriend() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ username, discriminator }: { username: string, discriminator: string }) =>
            apiPost('/friends/request', { username, discriminator }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            queryClient.invalidateQueries({ queryKey: ['dm-room'] });
        }
    });
}

export function useBlockUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => apiPost('/friends/block', { userId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            queryClient.invalidateQueries({ queryKey: ['dm-room'] });
        }
    });
}


export function useFriends() {
    return useQuery({
        queryKey: ['friends'],
        queryFn: async () => {
            const response = await apiGet<{ success: boolean; friends: Friend[] }>('/friends')
            return response.friends
        },
        staleTime: 60 * 1000,
    })
}

export function usePendingRequests() {
    return useQuery({
        queryKey: ['friend-requests', 'pending'],
        queryFn: async () => {
            const response = await apiGet<{ success: boolean; requests: FriendRequest[] }>('/friends/pending')
            return response.requests
        },
        staleTime: 60 * 1000,
    })
}
