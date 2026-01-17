'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { apiGet, apiPost, apiRequest, ApiError } from '@/lib/api'

type Server = {
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

type Channel = {
  _id: string
  name: string
  type?: string
}

type ServersResponse = {
  success: boolean
  data: Server[]
}

type ChannelsResponse = {
  success: boolean
  channels: Channel[]
}

type CreateServerResponse = {
  success: boolean
  server: Server
}

type MembersResponse = {
  success: boolean
  ownerId: string
  members: Array<{
    _id: string
    serverId: string
    userId: {
      _id: string
      username: string
      discriminator: string
      avatar?: string | null
      bio?: string
      status?: 'online' | 'idle' | 'dnd' | 'offline'
      customStatus?: string
    }
    isMuted?: boolean
    isBanned?: boolean
  }>
}

type RouteInfo = {
  isMe: boolean
  serverId: string | null
  channelId: string | null
}

type ChannelsContextValue = {
  route: RouteInfo
  serversLoading: boolean
  channelsLoading: boolean
  creatingServer: boolean
  createServerError: string | null
  creatingChannel: boolean
  createChannelError: string | null
  joiningServer: boolean
  joinServerError: string | null
  leavingServer: boolean
  leaveServerError: string | null
  deletingServer: boolean
  deleteServerError: string | null
  membersLoading: boolean
  membersError: string | null
  ownerId: string | null
  members: Array<{
    _id: string
    user: {
      _id: string
      username: string
      discriminator: string
      avatar?: string | null
      bio?: string
      status?: 'online' | 'idle' | 'dnd' | 'offline'
      customStatus?: string
    }
  }>
  servers: Server[]
  channels: Channel[]
  error: string | null
  selectedServer: Server | null
  selectedChannel: Channel | null
  goToMe: () => void
  selectServer: (serverId: string) => Promise<void>
  selectChannel: (serverId: string, channelId: string) => void
  createServer: (name: string) => Promise<void>
  joinServer: (serverId: string) => Promise<void>
  leaveServer: (serverId: string) => Promise<void>
  deleteServer: (serverId: string) => Promise<void>
  createChannel: (name: string) => Promise<void>
  updateChannel: (channelId: string, updates: { name?: string; type?: string; topic?: string }) => Promise<void>
  deleteChannel: (channelId: string) => Promise<void>
  reorderChannels: (serverId: string, channelIds: string[]) => Promise<void>
  updateServer: (serverId: string, updates: { name?: string; description?: string; icon?: string; banner?: string; isPublic?: boolean; verificationLevel?: string }) => Promise<void>
}

const ChannelsContext = createContext<ChannelsContextValue | null>(null)

function parseRoute(pathname: string): RouteInfo {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] !== 'channels') {
    return { isMe: false, serverId: null, channelId: null }
  }

  const slug = parts.slice(1)
  if (slug.length === 1 && slug[0] === '@me') {
    return { isMe: true, serverId: null, channelId: null }
  }

  const serverId = slug.length >= 1 ? slug[0] : null
  const channelId = slug.length >= 2 ? slug[1] : null
  return { isMe: false, serverId, channelId }
}

export function ChannelsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const route = useMemo(() => parseRoute(pathname), [pathname])

  const [serversLoading, setServersLoading] = useState(true)
  const [channelsLoading, setChannelsLoading] = useState(false)
  const [creatingServer, setCreatingServer] = useState(false)
  const [createServerError, setCreateServerError] = useState<string | null>(null)
  const [creatingChannel, setCreatingChannel] = useState(false)
  const [createChannelError, setCreateChannelError] = useState<string | null>(null)
  const [joiningServer, setJoiningServer] = useState(false)
  const [joinServerError, setJoinServerError] = useState<string | null>(null)
  const [leavingServer, setLeavingServer] = useState(false)
  const [leaveServerError, setLeaveServerError] = useState<string | null>(null)
  const [deletingServer, setDeletingServer] = useState(false)
  const [deleteServerError, setDeleteServerError] = useState<string | null>(null)
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [members, setMembers] = useState<
    Array<{
      _id: string
      user: {
        _id: string
        username: string
        discriminator: string
        avatar?: string | null
        bio?: string
        status?: 'online' | 'idle' | 'dnd' | 'offline'
        customStatus?: string
      }
    }>
  >([])
  const [servers, setServers] = useState<Server[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [error, setError] = useState<string | null>(null)

  const channelsCacheRef = useRef<Record<string, Channel[]>>({})

  const refreshServers = async () => {
    setServersLoading(true)
    setError(null)
    try {
      const res = await apiGet<ServersResponse>('/server/getmy-servers')
      setServers(res.data || [])
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          router.replace('/login')
          return
        }
        setError(e.message)
        return
      }
      setError('Failed to load servers')
    } finally {
      setServersLoading(false)
    }
  }

  const selectedServer = useMemo(() => {
    if (!route.serverId) return null
    return servers.find((s) => s._id === route.serverId) || null
  }, [route.serverId, servers])

  const selectedChannel = useMemo(() => {
    if (!route.channelId) return null
    return channels.find((c) => c._id === route.channelId) || null
  }, [route.channelId, channels])

  useEffect(() => {
    void refreshServers()
  }, [router])

  useEffect(() => {
    const loadChannels = async (sid: string) => {
      const cached = channelsCacheRef.current[sid]
      if (cached) {
        setChannels(cached)
        return
      }

      setChannelsLoading(true)
      setError(null)
      try {
        const res = await apiGet<ChannelsResponse>(`/server/${sid}/get-channels`)
        const nextChannels = res.channels || []
        channelsCacheRef.current[sid] = nextChannels
        setChannels(nextChannels)
      } catch (e) {
        setChannels([])
        if (e instanceof ApiError) {
          if (e.status === 401) {
            router.replace('/login')
            return
          }
          setError(e.message)
          return
        }
        setError('Failed to load channels')
      } finally {
        setChannelsLoading(false)
      }
    }

    if (route.isMe) {
      setChannels([])
      return
    }

    if (!route.serverId) {
      setChannels([])
      return
    }

    void loadChannels(route.serverId)
  }, [router, route.isMe, route.serverId])

  useEffect(() => {
    const loadMembers = async (sid: string) => {
      setMembersLoading(true)
      setMembersError(null)
      try {
        const res = await apiGet<MembersResponse>(`/server/${sid}/members`)
        setOwnerId(res.ownerId || null)
        setMembers(
          (res.members || []).map((m) => ({
            _id: m._id,
            user: m.userId,
          }))
        )
      } catch (e) {
        setOwnerId(null)
        setMembers([])
        if (e instanceof ApiError) {
          if (e.status === 401) {
            router.replace('/login')
            return
          }
          setMembersError(e.message)
          return
        }
        setMembersError('Failed to load members')
      } finally {
        setMembersLoading(false)
      }
    }

    if (route.isMe) {
      setOwnerId(null)
      setMembers([])
      return
    }

    if (!route.serverId) {
      setOwnerId(null)
      setMembers([])
      return
    }

    void loadMembers(route.serverId)
  }, [router, route.isMe, route.serverId])

  const goToMe = () => {
    router.push('/channels/@me')
  }

  const selectServer = async (serverId: string) => {
    setError(null)

    const cached = channelsCacheRef.current[serverId]
    if (cached) {
      setChannels(cached)
      const firstChannelId = cached[0]?._id
      if (firstChannelId) {
        router.push(`/channels/${serverId}/${firstChannelId}`)
      } else {
        router.push(`/channels/${serverId}`)
      }
      return
    }

    setChannelsLoading(true)
    try {
      const res = await apiGet<ChannelsResponse>(`/server/${serverId}/get-channels`)
      const nextChannels = res.channels || []
      channelsCacheRef.current[serverId] = nextChannels
      setChannels(nextChannels)

      const firstChannelId = nextChannels[0]?._id
      if (firstChannelId) {
        router.push(`/channels/${serverId}/${firstChannelId}`)
      } else {
        router.push(`/channels/${serverId}`)
      }
    } catch (e) {
      setChannels([])
      if (e instanceof ApiError) {
        if (e.status === 401) {
          router.replace('/login')
          return
        }
        setError(e.message)
        return
      }
      setError('Failed to load channels')
    } finally {
      setChannelsLoading(false)
    }
  }

  const selectChannel = (serverId: string, channelId: string) => {
    router.push(`/channels/${serverId}/${channelId}`)
  }

  const createServer = async (name: string) => {
    setCreateServerError(null)
    setCreatingServer(true)

    try {
      const res = await apiPost<CreateServerResponse>('/server/create', {
        name,
      })

      const created = res.server
      setServers((prev) => [created, ...prev])

      channelsCacheRef.current[created._id] = []
      router.push(`/channels/${created._id}`)
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          router.replace('/login')
          return
        }
        setCreateServerError(e.message)
        return
      }
      setCreateServerError('Failed to create server')
    } finally {
      setCreatingServer(false)
      void refreshServers()
    }
  }

  const joinServer = async (serverId: string) => {
    setJoinServerError(null)
    setJoiningServer(true)
    try {
      await apiPost<unknown>(`/server/${serverId}/join`)
      await refreshServers()
      await selectServer(serverId)
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          router.replace('/login')
          return
        }
        setJoinServerError(e.message)
        return
      }
      setJoinServerError('Failed to join server')
    } finally {
      setJoiningServer(false)
    }
  }

  const leaveServer = async (serverId: string) => {
    setLeaveServerError(null)
    setLeavingServer(true)
    try {
      await apiPost<unknown>(`/server/${serverId}/leave`)
      setServers((prev) => prev.filter((s) => s._id !== serverId))
      channelsCacheRef.current[serverId] = []
      if (route.serverId === serverId) {
        router.push('/channels/@me')
      }
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          router.replace('/login')
          return
        }
        setLeaveServerError(e.message)
        return
      }
      setLeaveServerError('Failed to leave server')
    } finally {
      setLeavingServer(false)
    }
  }

  const deleteServer = async (serverId: string) => {
    setDeleteServerError(null)
    setDeletingServer(true)
    try {
      await apiRequest<unknown>(`/server/${serverId}`, { method: 'DELETE' })
      setServers((prev) => prev.filter((s) => s._id !== serverId))
      channelsCacheRef.current[serverId] = []
      if (route.serverId === serverId) {
        router.push('/channels/@me')
      }
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          router.replace('/login')
          return
        }
        setDeleteServerError(e.message)
        return
      }
      setDeleteServerError('Failed to delete server')
    } finally {
      setDeletingServer(false)
    }
  }

  const createChannel = async (name: string) => {
    if (!route.serverId) return
    setCreateChannelError(null)
    setCreatingChannel(true)
    try {
      const res = await apiPost<{ success: boolean; channel: Channel }>(`/server/${route.serverId}/create-channel`, {
        name,
      })
      const ch = res.channel
      const next = [...channels, ch]
      channelsCacheRef.current[route.serverId] = next
      setChannels(next)
      router.push(`/channels/${route.serverId}/${ch._id}`)
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          router.replace('/login')
          return
        }
        setCreateChannelError(e.message)
        return
      }
      setCreateChannelError('Failed to create channel')
    } finally {
      setCreatingChannel(false)
    }
  }

  const updateChannel = async (
    channelId: string,
    updates: { name?: string; type?: string; topic?: string }
  ) => {
    try {
      const res = await apiRequest<{ success: boolean; updatedChannel: Channel }>(`/server/channel/${channelId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      const updated = res.updatedChannel
      setChannels((prev) => prev.map((c) => (c._id === channelId ? updated : c)))
      if (route.channelId === channelId) {
        router.replace(`/channels/${route.serverId}/${channelId}`)
      }
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          router.replace('/login')
          return
        }
        setError(e.message)
        return
      }
      setError('Failed to update channel')
    }
  }

  const deleteChannel = async (channelId: string) => {
    try {
      await apiRequest<unknown>(`/server/channel/${channelId}`, { method: 'DELETE' })
      const next = channels.filter((c) => c._id !== channelId)
      setChannels(next)
      if (route.channelId === channelId) {
        const first = next[0]?._id
        if (first && route.serverId) {
          router.push(`/channels/${route.serverId}/${first}`)
        } else {
          if (route.serverId) router.push(`/channels/${route.serverId}`)
        }
      }
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          router.replace('/login')
          return
        }
        setError(e.message)
        return
      }
      setError('Failed to delete channel')
    }
  }

  const reorderChannels = async (serverId: string, channelIds: string[]) => {
    try {
      await apiPost<{ success: boolean }>(`/server/${serverId}/reorder-channels`, { channelIds })
      const ordered = [...channels].sort(
        (a, b) => channelIds.indexOf(a._id) - channelIds.indexOf(b._id)
      )
      channelsCacheRef.current[serverId] = ordered
      setChannels(ordered)
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          router.replace('/login')
          return
        }
        setError(e.message)
        return
      }
      setError('Failed to reorder channels')
    }
  }

  const updateServer = async (
    serverId: string,
    updates: { name?: string; description?: string; icon?: string; banner?: string; isPublic?: boolean; verificationLevel?: string }
  ) => {
    try {
      const res = await apiRequest<{ success: boolean; server: Server }>(`/server/${serverId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      const updatedServer = res.server
      setServers((prev) => prev.map((s) => (s._id === serverId ? updatedServer : s)))
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          router.replace('/login')
          return
        }
        setError(e.message)
        return
      }
      setError('Failed to update server')
    }
  }

  const value: ChannelsContextValue = {
    route,
    serversLoading,
    channelsLoading,
    creatingServer,
    createServerError,
    creatingChannel,
    createChannelError,
    joiningServer,
    joinServerError,
    leavingServer,
    leaveServerError,
    deletingServer,
    deleteServerError,
    membersLoading,
    membersError,
    ownerId,
    members,
    servers,
    channels,
    error,
    selectedServer,
    selectedChannel,
    goToMe,
    selectServer,
    selectChannel,
    createServer,
    joinServer,
    leaveServer,
    deleteServer,
    createChannel,
    updateChannel,
    deleteChannel,
    reorderChannels,
    updateServer,
  }

  return <ChannelsContext.Provider value={value}>{children}</ChannelsContext.Provider>
}

export function useChannels() {
  const ctx = useContext(ChannelsContext)
  if (!ctx) {
    throw new Error('useChannels must be used within ChannelsProvider')
  }
  return ctx
}
