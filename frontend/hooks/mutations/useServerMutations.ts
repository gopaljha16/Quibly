'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiRequest } from '@/lib/api'
import { Server } from '../queries'

export function useJoinServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await apiPost<{ success: boolean; serverId: string }>(`/invites/${inviteCode}/join`)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] })
    },
  })
}

export function useCreateInvite() {
  return useMutation({
    mutationFn: async ({
      serverId,
      data,
    }: {
      serverId: string
      data: { maxUses?: number; expiresInDays?: number }
    }) => {
      const response = await apiPost<{
        success: boolean
        invite: { code: string; expiresAt: string | null; maxUses: number | null }
      }>(`/invites/${serverId}`, data)
      return response.invite
    },
  })
}

export function useLeaveServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (serverId: string) => {
      await apiPost(`/server/${serverId}/leave`)
      return serverId
    },
    onSuccess: (serverId) => {
      // Remove from cache
      queryClient.setQueryData<Server[]>(['servers'], (old = []) =>
        old.filter((s) => s._id !== serverId)
      )
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['channels', serverId] })
      queryClient.invalidateQueries({ queryKey: ['members', serverId] })
    },
  })
}

export function useDeleteServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (serverId: string) => {
      await apiRequest(`/server/${serverId}`, { method: 'DELETE' })
      return serverId
    },
    onSuccess: (serverId) => {
      // Remove from cache
      queryClient.setQueryData<Server[]>(['servers'], (old = []) =>
        old.filter((s) => s._id !== serverId)
      )
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['channels', serverId] })
      queryClient.invalidateQueries({ queryKey: ['members', serverId] })
    },
  })
}

export function useUpdateServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      serverId,
      updates,
    }: {
      serverId: string
      updates: Partial<Server>
    }) => {
      const response = await apiRequest<{ success: boolean; server: Server }>(
        `/server/${serverId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        }
      )
      return response.server
    },
    onSuccess: (updatedServer) => {
      // Update in cache
      queryClient.setQueryData<Server[]>(['servers'], (old = []) =>
        old.map((s) => (s._id === updatedServer._id ? updatedServer : s))
      )
    },
  })
}
