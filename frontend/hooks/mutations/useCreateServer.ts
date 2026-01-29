'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '@/lib/api'
import { Server } from '../queries'

type CreateServerResponse = {
  success: boolean
  server: Server
}

export function useCreateServer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (name: string) => {
      const response = await apiPost<CreateServerResponse>('/server/create', { name })
      return response.server
    },
    onSuccess: (newServer) => {
      // Invalidate servers list to refetch
      queryClient.invalidateQueries({ queryKey: ['servers'] })
      
      // Or optimistically add to cache
      queryClient.setQueryData<Server[]>(['servers'], (old = []) => [newServer, ...old])
    },
  })
}
