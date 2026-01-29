'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export type Server = {
  _id: string
  name?: string
  icon?: string
  description?: string
  banner?: string
  isPublic?: boolean
  verificationLevel?: 'none' | 'low' | 'medium' | 'high'
  ownerId?: string
  membersCount?: number
}

type ServersResponse = {
  success: boolean
  data: Server[]
}

export function useServers() {
  return useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await apiGet<ServersResponse>('/server/getmy-servers')
      return response.data || []
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - servers don't change often
  })
}
