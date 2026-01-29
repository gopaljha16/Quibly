'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiRequest } from '@/lib/api'
import { Channel } from '../queries'

export function useCreateChannel() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ serverId, name }: { serverId: string; name: string }) => {
      const response = await apiPost<{ success: boolean; channel: Channel }>(
        `/server/${serverId}/create-channel`,
        { name }
      )
      return { serverId, channel: response.channel }
    },
    onSuccess: ({ serverId, channel }) => {
      // Add to cache
      queryClient.setQueryData<Channel[]>(['channels', serverId], (old = []) => [
        ...old,
        channel,
      ])
    },
  })
}

export function useUpdateChannel() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({
      serverId,
      channelId,
      updates,
    }: {
      serverId: string
      channelId: string
      updates: Partial<Channel>
    }) => {
      const response = await apiRequest<{ success: boolean; updatedChannel: Channel }>(
        `/server/channel/${channelId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        }
      )
      return { serverId, channel: response.updatedChannel }
    },
    onSuccess: ({ serverId, channel }) => {
      // Update in cache
      queryClient.setQueryData<Channel[]>(['channels', serverId], (old = []) =>
        old.map((c) => (c._id === channel._id ? channel : c))
      )
    },
  })
}

export function useDeleteChannel() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ serverId, channelId }: { serverId: string; channelId: string }) => {
      await apiRequest(`/server/channel/${channelId}`, { method: 'DELETE' })
      return { serverId, channelId }
    },
    onSuccess: ({ serverId, channelId }) => {
      // Remove from cache
      queryClient.setQueryData<Channel[]>(['channels', serverId], (old = []) =>
        old.filter((c) => c._id !== channelId)
      )
      // Invalidate messages for this channel
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
    },
  })
}

export function useReorderChannels() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({
      serverId,
      channelIds,
    }: {
      serverId: string
      channelIds: string[]
    }) => {
      await apiRequest(`/server/${serverId}/reorder-channels`, {
        method: 'PATCH',
        body: JSON.stringify({ channelIds }),
      })
      return { serverId, channelIds }
    },
    onSuccess: ({ serverId, channelIds }) => {
      // Reorder in cache
      queryClient.setQueryData<Channel[]>(['channels', serverId], (old = []) => {
        return [...old].sort(
          (a, b) => channelIds.indexOf(a._id) - channelIds.indexOf(b._id)
        )
      })
    },
  })
}
