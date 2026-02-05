'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useServers, useChannels, useMembers, useRoles } from './queries'
import {
  useCreateServer,
  useJoinServer,
  useCreateInvite,
  useLeaveServer,
  useDeleteServer,
  useUpdateServer,
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
  useReorderChannels,
} from './mutations'

type RouteInfo = {
  isMe: boolean
  serverId: string | null
  channelId: string | null
}

function parseRoute(pathname: string): RouteInfo {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] !== 'channels') {
    return { isMe: false, serverId: null, channelId: null }
  }

  const slug = parts.slice(1)
  const serverId = slug.length >= 1 ? slug[0] : null
  const channelId = slug.length >= 2 ? slug[1] : null
  const isMe = serverId === '@me'

  return { isMe, serverId: isMe ? null : serverId, channelId }
}

/**
 * Unified hook for all channels-related data and operations
 * Replaces the old ChannelsProvider context
 */
export function useChannelsData() {
  const router = useRouter()
  const pathname = usePathname()
  const route = useMemo(() => parseRoute(pathname), [pathname])

  // Queries
  const { data: servers = [], isLoading: serversLoading, error: serversError } = useServers()
  const { data: channels = [], isLoading: channelsLoading, error: channelsError } = useChannels(route.serverId)
  const { data: membersData, isLoading: membersLoading, error: membersError } = useMembers(route.serverId)
  const { data: roles = [], isLoading: rolesLoading } = useRoles(route.serverId)

  // Mutations
  const createServerMutation = useCreateServer()
  const joinServerMutation = useJoinServer()
  const createInviteMutation = useCreateInvite()
  const leaveServerMutation = useLeaveServer()
  const deleteServerMutation = useDeleteServer()
  const updateServerMutation = useUpdateServer()
  const createChannelMutation = useCreateChannel()
  const updateChannelMutation = useUpdateChannel()
  const deleteChannelMutation = useDeleteChannel()
  const reorderChannelsMutation = useReorderChannels()

  // Derived state
  const selectedServer = useMemo(() => {
    if (!route.serverId || route.serverId === '@me') return null
    return servers.find((s) => s._id === route.serverId) || null
  }, [route.serverId, servers])

  const selectedChannel = useMemo(() => {
    if (!route.channelId) return null
    return channels.find((c) => c._id === route.channelId) || null
  }, [route.channelId, channels])

  // Navigation helpers
  const goToMe = () => {
    router.push('/channels/@me')
  }

  const selectServer = useCallback(async (serverId: string) => {
    const firstChannel = channels[0]
    if (firstChannel) {
      router.push(`/channels/${serverId}/${firstChannel._id}`)
    } else {
      router.push(`/channels/${serverId}`)
    }
  }, [channels, router])

  const selectChannel = useCallback((serverId: string, channelId: string) => {
    router.push(`/channels/${serverId}/${channelId}`)
  }, [router])

  // Server operations
  const createServer = useCallback(async (name: string) => {
    const server = await createServerMutation.mutateAsync(name)
    router.push(`/channels/${server._id}`)
    return server
  }, [createServerMutation, router])

  const joinServer = useCallback(async (inviteCode: string) => {
    const response = await joinServerMutation.mutateAsync(inviteCode)
    if (response && response.serverId) {
      await selectServer(response.serverId)
    }
  }, [joinServerMutation, selectServer])

  const createInvite = useCallback(async (serverId: string, data: { maxUses?: number; expiresInDays?: number } = {}) => {
    return await createInviteMutation.mutateAsync({ serverId, data })
  }, [createInviteMutation])

  const leaveServer = useCallback(async (serverId: string) => {
    await leaveServerMutation.mutateAsync(serverId)
    if (route.serverId === serverId) {
      router.push('/channels/@me')
    }
  }, [leaveServerMutation, route.serverId, router])

  const deleteServer = useCallback(async (serverId: string) => {
    await deleteServerMutation.mutateAsync(serverId)
    if (route.serverId === serverId) {
      router.push('/channels/@me')
    }
  }, [deleteServerMutation, route.serverId, router])

  const updateServer = useCallback(async (serverId: string, updates: any) => {
    await updateServerMutation.mutateAsync({ serverId, updates })
  }, [updateServerMutation])

  // Channel operations
  const createChannel = useCallback(async (
    name: string,
    type: 'TEXT' | 'VOICE' = 'TEXT',
    isPrivate: boolean = false,
    isReadOnly: boolean = false,
    allowedRoleIds: string[] = []
  ) => {
    if (!route.serverId) return
    const result = await createChannelMutation.mutateAsync({
      serverId: route.serverId,
      name,
      type,
      isPrivate,
      isReadOnly,
      allowedRoleIds,
    })
    router.push(`/channels/${route.serverId}/${result.channel._id}`)
  }, [createChannelMutation, route.serverId, router])

  const updateChannel = useCallback(async (channelId: string, updates: any) => {
    if (!route.serverId) return
    await updateChannelMutation.mutateAsync({
      serverId: route.serverId,
      channelId,
      updates,
    })
  }, [updateChannelMutation, route.serverId])

  const deleteChannel = useCallback(async (channelId: string) => {
    if (!route.serverId) return
    await deleteChannelMutation.mutateAsync({
      serverId: route.serverId,
      channelId,
    })

    // Navigate to first remaining channel or server
    const remainingChannels = channels.filter((c) => c._id !== channelId)
    if (route.channelId === channelId) {
      const firstChannel = remainingChannels[0]
      if (firstChannel) {
        router.push(`/channels/${route.serverId}/${firstChannel._id}`)
      } else {
        router.push(`/channels/${route.serverId}`)
      }
    }
  }, [deleteChannelMutation, route.serverId, channels, route.channelId, router])

  const reorderChannels = useCallback(async (channelIds: string[]) => {
    if (!route.serverId) return
    await reorderChannelsMutation.mutateAsync({
      serverId: route.serverId,
      channelIds,
    })
  }, [reorderChannelsMutation, route.serverId])

  return {
    // Route info
    route,

    // Data
    servers,
    channels,
    members: membersData?.members || [],
    roles,
    ownerId: membersData?.ownerId || null,
    selectedServer,
    selectedChannel,

    // Loading states
    serversLoading,
    channelsLoading,
    membersLoading,
    rolesLoading,

    // Errors
    serversError,
    channelsError,
    membersError,
    error: serversError || channelsError || membersError,

    // Mutation states
    creatingServer: createServerMutation.isPending,
    createServerError: createServerMutation.error?.message || null,
    joiningServer: joinServerMutation.isPending,
    joinServerError: joinServerMutation.error?.message || null,
    leavingServer: leaveServerMutation.isPending,
    leaveServerError: leaveServerMutation.error?.message || null,
    deletingServer: deleteServerMutation.isPending,
    deleteServerError: deleteServerMutation.error?.message || null,
    creatingChannel: createChannelMutation.isPending,
    createChannelError: createChannelMutation.error?.message || null,

    // Navigation
    goToMe,
    selectServer,
    selectChannel,

    // Server operations
    createServer,
    joinServer,
    createInvite,
    leaveServer,
    deleteServer,
    updateServer,

    // Channel operations
    createChannel,
    updateChannel,
    deleteChannel,
    reorderChannels,
  }
}
