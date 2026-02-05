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

export function useRoleMutations(serverId: string | null) {
  const queryClient = useQueryClient()

  const createRole = useMutation({
    mutationFn: async (data: { name?: string; color?: string; permissions?: number; hoist?: boolean }) => {
      if (!serverId) throw new Error('No server ID')
      const response = await apiPost<{ success: boolean; role: any }>(`/server/${serverId}/roles`, data)
      return response.role
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', serverId] })
    },
  })

  const updateRole = useMutation({
    mutationFn: async ({ roleId, updates }: { roleId: string; updates: any }) => {
      if (!serverId) throw new Error('No server ID')
      const response = await apiRequest<{ success: boolean; role: any }>(
        `/server/${serverId}/roles/${roleId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }
      )
      return response.role
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', serverId] })
    },
  })

  const deleteRole = useMutation({
    mutationFn: async (roleId: string) => {
      if (!serverId) throw new Error('No server ID')
      await apiRequest(`/server/${serverId}/roles/${roleId}`, { method: 'DELETE' })
      return roleId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', serverId] })
    },
  })

  const updateMemberRoles = useMutation({
    mutationFn: async ({ userId, roleIds }: { userId: string; roleIds: string[] }) => {
      if (!serverId) throw new Error('No server ID')
      const response = await apiRequest<{ success: boolean; member: any }>(
        `/server/${serverId}/members/${userId}/roles`,
        {
          method: 'PATCH',
          body: JSON.stringify({ roleIds }),
        }
      )
      return response.member
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', serverId] })
    },
  })

  return {
    createRole,
    updateRole,
    deleteRole,
    updateMemberRoles,
  }
}

export function useBannedWordsMutations(serverId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bannedWords: string[]) => {
      if (!serverId) throw new Error('No server ID')
      const response = await apiRequest<{ success: boolean; bannedWords: string[] }>(
        `/server/${serverId}/banned-words`,
        {
          method: 'PUT',
          body: JSON.stringify({ bannedWords }),
        }
      )
      return response.bannedWords
    },
    onSuccess: (updatedBannedWords) => {
      queryClient.invalidateQueries({ queryKey: ['servers'] })
      queryClient.invalidateQueries({ queryKey: ['server', serverId] })
    },
  })
}

export function useBanMember(serverId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      if (!serverId) throw new Error('No server ID')
      const response = await apiRequest<{ success: boolean; message: string; data: any }>(
        `/server/${serverId}/members/${userId}/ban`,
        {
          method: 'PATCH',
          body: JSON.stringify({ reason }),
        }
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', serverId] })
    },
  })
}

export function useUnbanMember(serverId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!serverId) throw new Error('No server ID')
      const response = await apiRequest<{ success: boolean; message: string; data: any }>(
        `/server/${serverId}/members/${userId}/unban`,
        {
          method: 'PATCH',
        }
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', serverId] })
    },
  })
}

