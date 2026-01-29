'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export type Channel = {
  _id: string
  name: string
  type?: string
  topic?: string
  description?: string
}

type ChannelsResponse = {
  success: boolean
  channels: Channel[]
}

export function useChannels(serverId: string | null) {
  return useQuery({
    queryKey: ['channels', serverId],
    queryFn: async () => {
      if (!serverId) return []
      const response = await apiGet<ChannelsResponse>(`/server/${serverId}/get-channels`)
      return response.channels || []
    },
    enabled: !!serverId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}
