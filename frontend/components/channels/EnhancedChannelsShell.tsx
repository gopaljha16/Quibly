'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChannels } from './ChannelsProvider'
import { usePresenceContext } from '@/components/PresenceProvider'
import { apiGet, apiPost, ApiError } from '@/lib/api'
import CreateServerModal from './CreateServerModal'
import MemberProfileModal from './MemberProfileModal'
import CreateChannelModal from './CreateChannelModal'
import JoinServerModal from './JoinServerModal'
import ServerSettingsModal from './ServerSettingsModal'
import InviteServerModal from './InviteServerModal'

// Status indicator component
const StatusIndicator = ({ status }: { status?: 'online' | 'idle' | 'dnd' | 'offline' }) => {
  const statusColors = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500'
  }
  
  return (
    <div className={`w-3 h-3 rounded-full border-2 border-[#2f3136] ${statusColors[status || 'offline']}`} />
  )
}

// Status badge with tooltip
const StatusBadge = ({ status }: { status?: 'online' | 'idle' | 'dnd' | 'offline' }) => {
  const statusInfo = {
    online: { color: 'bg-green-500', text: 'Online' },
    idle: { color: 'bg-yellow-500', text: 'Idle' },
    dnd: { color: 'bg-red-500', text: 'Do Not Disturb' },
    offline: { color: 'bg-gray-500', text: 'Offline' }
  }
  
  const info = statusInfo[status || 'offline']
  
  return (
    <div className="relative group">
      <div className={`w-3 h-3 rounded-full border-2 border-[#2f3136] ${info.color}`} />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {info.text}
      </div>
    </div>
  )
}

// User avatar component
const UserAvatar = ({ 
  username, 
  avatar, 
  size = 'md',
  status,
  showStatus = false 
}: { 
  username: string
  avatar?: string | null
  size?: 'sm' | 'md' | 'lg'
  status?: 'online' | 'idle' | 'dnd' | 'offline'
  showStatus?: boolean
}) => {
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg'
  }
  
  const initials = username?.slice(0, 1).toUpperCase() || 'U'
  
  return (
    <div className="relative">
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white`}>
        {avatar ? (
          <img src={avatar} alt={username} className="w-full h-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </div>
      {showStatus && (
        <div className="absolute -bottom-0.5 -right-0.5">
          <StatusBadge status={status} />
        </div>
      )}
    </div>
  )
}

type CurrentUser = {
  _id: string
  username: string
  discriminator: string
  email: string
  avatar?: string | null
  bio?: string
  status?: 'online' | 'idle' | 'dnd' | 'offline'
  customStatus?: string
}

export default function EnhancedChannelsShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [serverMenuOpen, setServerMenuOpen] = useState(false)
  const serverMenuRef = useRef<HTMLDivElement | null>(null)
  const [channelMenuOpenId, setChannelMenuOpenId] = useState<string | null>(null)
  const channelMenuRef = useRef<HTMLDivElement | null>(null)
  const [renameChannelId, setRenameChannelId] = useState<string | null>(null)
  const [renameChannelValue, setRenameChannelValue] = useState('')
  const [renamingChannel, setRenamingChannel] = useState(false)
  const [selectedMember, setSelectedMember] = useState<{
    user: {
      _id: string
      username: string
      discriminator: string
      avatar?: string | null
      bio?: string
      status?: 'online' | 'idle' | 'dnd' | 'offline'
      customStatus?: string
    }
    isOwner: boolean
  } | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const [serverSettingsOpen, setServerSettingsOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  
  const {
    isConnected,
    myStatus,
    changeStatus,
    getUserStatus,
    isUserOnline,
    getServerOnlineUsers
  } = usePresenceContext()
  
  const {
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
    deletingServer,
    deleteServerError,
    servers,
    channels,
    error,
    selectedServer,
    selectedChannel,
    goToMe,
    selectServer,
    selectChannel,
    createServer,
    createChannel,
    joinServer,
    leaveServer,
    deleteServer,
    reorderChannels,
    updateChannel,
    deleteChannel,
    membersLoading,
    membersError,
    members,
    ownerId,
    updateServer,
  } = useChannels()
  const [createChannelOpen, setCreateChannelOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  // Event handlers for menus
  useEffect(() => {
    if (!serverMenuOpen) return
    const onMouseDown = (e: MouseEvent) => {
      const el = serverMenuRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) {
        setServerMenuOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setServerMenuOpen(false)
    }
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [serverMenuOpen])

  useEffect(() => {
    if (!channelMenuOpenId) return
    const onMouseDown = (e: MouseEvent) => {
      const el = channelMenuRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) {
        setChannelMenuOpenId(null)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setChannelMenuOpenId(null)
    }
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [channelMenuOpenId])

  useEffect(() => {
    if (!userMenuOpen) return
    const onMouseDown = (e: MouseEvent) => {
      const el = userMenuRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [userMenuOpen])

  // Load current user profile
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await apiGet<{ user: any }>('/auth/profile')
        if (res.user) {
          const { id, ...rest } = res.user
          setCurrentUser({ _id: id || res.user._id, ...rest })
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          router.replace('/login')
        }
      }
    }
    void loadUser()
  }, [])

  // Logout handler
  const handleLogout = async () => {
    try {
      const { disconnectSocket } = await import('@/lib/socket')
      disconnectSocket()
      await apiPost('/auth/logout')
      router.replace('/login')
      router.refresh()
    } catch (e) {
      console.error('Logout error:', e)
    }
  }

  // Load server online users when server changes
  useEffect(() => {
    if (route.serverId && !route.isMe && isConnected) {
      getServerOnlineUsers(route.serverId)
    }
  }, [route.serverId, route.isMe, isConnected, getServerOnlineUsers])

  return (
    <div className="h-screen w-screen bg-[#36393f] text-white flex overflow-hidden">
      {/* Server Sidebar */}
      <div className="w-[72px] bg-[#202225] flex flex-col items-center py-3 gap-2">
        {/* Home/DM Button */}
        <div className="relative group">
          <button
            type="button"
            onClick={goToMe}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-200 ${
              route.isMe 
                ? 'bg-[#5865f2] rounded-2xl' 
                : 'bg-[#36393f] hover:bg-[#5865f2] hover:rounded-2xl rounded-3xl'
            }`}
          >
            <svg width="28" height="20" viewBox="0 0 28 20" className="fill-current">
              <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461744 10.3368 0.00546311C8.48074 0.324393 6.67795 0.885118 4.96746 1.68231C1.56727 6.77853 0.649666 11.7538 1.11108 16.652C3.10102 18.1418 5.3262 19.2743 7.69177 20C8.22338 19.2743 8.69519 18.4993 9.09812 17.691C8.32996 17.3997 7.58522 17.0424 6.87684 16.6291C7.06531 16.4979 7.25183 16.3615 7.43624 16.2202C11.4193 18.0402 15.9176 18.0402 19.8555 16.2202C20.0403 16.3615 20.2268 16.4979 20.4148 16.6291C19.7059 17.0427 18.9606 17.4 18.1921 17.691C18.5949 18.4993 19.0667 19.2743 19.5984 20C21.9639 19.2743 24.1894 18.1418 26.1794 16.652C26.7228 11.0369 25.2119 6.10654 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0395 9.54272 12.0187 10.994C12.0187 12.4453 10.9893 13.6383 9.68041 13.6383ZM18.5129 13.6383C17.2271 13.6383 16.1703 12.4453 16.1703 10.994C16.1703 9.54272 17.2009 8.34973 18.5129 8.34973C19.8248 8.34973 20.8751 9.54272 20.8542 10.994C20.8542 12.4453 19.8248 13.6383 18.5129 13.6383Z"/>
            </svg>
          </button>
          {route.isMe && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full h-10" />
          )}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 opacity-0 group-hover:opacity-100 h-5" />
        </div>

        <div className="w-8 h-px bg-[#36393f] my-1" />

        {/* Server List */}
        {serversLoading ? (
          <div className="w-12 h-12 rounded-3xl bg-[#36393f] animate-pulse" />
        ) : (
          servers.map((s) => (
            <div key={s._id} className="relative group">
              <button
                type="button"
                onClick={() => void selectServer(s._id)}
                className={`w-12 h-12 flex items-center justify-center text-lg font-bold transition-all duration-200 ${
                  s._id === route.serverId
                    ? 'bg-[#5865f2] rounded-2xl'
                    : 'bg-[#36393f] hover:bg-[#5865f2] hover:rounded-2xl rounded-3xl'
                }`}
                title={s.name || 'Server'}
              >
                {s.icon ? (
                  <img src={s.icon} alt={s.name} className="w-full h-full rounded-inherit object-cover" />
                ) : (
                  (s.name || 'S').slice(0, 1).toUpperCase()
                )}
              </button>
              {s._id === route.serverId && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full h-10" />
              )}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 opacity-0 group-hover:opacity-100 h-5" />
            </div>
          ))
        )}

        {/* Add Server Button */}
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="w-12 h-12 rounded-3xl bg-[#36393f] hover:bg-[#3ba55c] hover:rounded-2xl transition-all duration-200 flex items-center justify-center text-[#3ba55c] hover:text-white text-2xl font-bold group"
          title="Add a Server"
        >
          +
        </button>

        {/* Join Server Button */}
        <button
          type="button"
          onClick={() => setJoinOpen(true)}
          className="w-12 h-12 rounded-3xl bg-[#36393f] hover:bg-[#3ba55c] hover:rounded-2xl transition-all duration-200 flex items-center justify-center text-[#3ba55c] hover:text-white text-xl font-bold"
          title="Join a Server"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17C15.24 5.06 14.32 5 13.4 5H12C7.58 5 4 8.58 4 13C4 17.42 7.58 21 12 21C16.42 21 20 17.42 20 13H18C18 16.31 15.31 19 12 19C8.69 19 6 16.31 6 13C6 9.69 8.69 7 12 7H13.4C14.8 7 16.2 7.2 17.6 7.7L21 9Z"/>
          </svg>
        </button>
      </div>

      {/* Channels Sidebar */}
      <div className="w-[240px] bg-[#2f3136] flex flex-col">
        {/* Server Header */}
        <div className="h-12 px-4 flex items-center border-b border-black/20 shadow-md">
          <div className="font-semibold text-white truncate">
            {route.isMe ? 'Direct Messages' : selectedServer?.name || 'Server'}
          </div>
          {!isConnected && (
            <div className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
              Reconnecting...
            </div>
          )}
          {!route.isMe && route.serverId && (
            <div className="ml-auto flex items-center relative" ref={serverMenuRef}>
              <button
                type="button"
                onClick={() => setServerMenuOpen((v) => !v)}
                className="w-6 h-6 rounded hover:bg-white/10 transition-colors flex items-center justify-center text-white/80"
                aria-label="Server actions"
              >
                <svg width="18" height="4" viewBox="0 0 18 4" className="fill-current">
                  <circle cx="2" cy="2" r="2"/>
                  <circle cx="9" cy="2" r="2"/>
                  <circle cx="16" cy="2" r="2"/>
                </svg>
              </button>

              {serverMenuOpen && (
                <div className="absolute mt-2 right-0 top-full w-56 rounded border border-black/20 bg-[#18191c] shadow-lg z-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setServerMenuOpen(false)
                      setInviteModalOpen(true)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#4f545c]/40 text-indigo-400 flex items-center gap-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17C15.24 5.06 14.32 5 13.4 5H12C7.58 5 4 8.58 4 13C4 17.42 7.58 21 12 21C16.42 21 20 17.42 20 13H18C18 16.31 15.31 19 12 19C8.69 19 6 16.31 6 13C6 9.69 8.69 7 12 7H13.4C14.8 7 16.2 7.2 17.6 7.7L21 9Z"/>
                    </svg>
                    Invite People
                  </button>
                  
                  <div className="h-px bg-white/10 mx-2" />
                  
                  <button
                    type="button"
                    onClick={() => {
                      setServerMenuOpen(false)
                      setServerSettingsOpen(true)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#4f545c]/40 flex items-center gap-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current">
                      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                    </svg>
                    Server Settings
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setServerMenuOpen(false)
                      setCreateChannelOpen(true)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#4f545c]/40 flex items-center gap-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Create Channel
                  </button>
                  
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#4f545c]/40 flex items-center gap-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Create Category
                  </button>
                  
                  <div className="h-px bg-white/10 mx-2" />
                  
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#4f545c]/40 flex items-center gap-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Notification Settings
                  </button>
                  
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#4f545c]/40 flex items-center gap-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current">
                      <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M12 7C13.4 7 14.8 8.6 14.8 10V11.5C15.4 11.5 16 12.1 16 12.7V16.2C16 16.8 15.4 17.3 14.8 17.3H9.2C8.6 17.3 8 16.8 8 16.2V12.7C8 12.1 8.6 11.5 9.2 11.5V10C9.2 8.6 10.6 7 12 7M12 8.2C11.2 8.2 10.5 8.7 10.5 10V11.5H13.5V10C13.5 8.7 12.8 8.2 12 8.2Z"/>
                    </svg>
                    Privacy Settings
                  </button>
                  
                  <div className="h-px bg-white/10 mx-2" />
                  
                  <button
                    type="button"
                    onClick={() => {
                      setServerMenuOpen(false)
                      if (route.serverId) leaveServer(route.serverId)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#4f545c]/40 disabled:opacity-60 flex items-center gap-3"
                    disabled={leavingServer}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current">
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                    </svg>
                    Leave Server
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setServerMenuOpen(false)
                      if (route.serverId) deleteServer(route.serverId)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-60 flex items-center gap-3"
                    disabled={deletingServer}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    Delete Server
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="p-2">
          <div className="h-7 rounded bg-[#202225] border border-black/20 flex items-center px-2 text-xs text-white/60">
            <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current mr-2">
              <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"/>
            </svg>
            Find or start a conversation
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-auto px-2 pb-3">
          {error && (
            <div className="mx-2 mb-2 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          {route.isMe ? (
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs text-white/60 font-semibold">DIRECT MESSAGES</div>
              <button className="w-full px-2 py-1.5 rounded hover:bg-white/5 text-sm text-left flex items-center gap-3">
                <UserAvatar username="Friends" size="sm" />
                <span>Friends</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs text-white/60 font-semibold flex items-center justify-between">
                <span>TEXT CHANNELS</span>
                {channelsLoading && <span className="text-[10px] text-white/40">Loading...</span>}
              </div>

              {channels.map((c, idx) => (
                <div
                  key={c._id}
                  className={`group w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 ${
                    c._id === route.channelId ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/70'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!route.serverId) return
                      selectChannel(route.serverId, c._id)
                    }}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current text-white/50">
                      <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41001 9L8.35001 15H14.35L15.41 9H9.41001Z"/>
                    </svg>
                    <span className="truncate">{c.name}</span>
                  </button>
                  <div
                    className="relative flex items-center"
                    ref={channelMenuOpenId === c._id ? channelMenuRef : undefined}
                  >
                    <button
                      type="button"
                      className="w-4 h-4 rounded hover:bg-white/10 transition-all flex items-center justify-center text-white/70 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus:opacity-100 focus:pointer-events-auto"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setChannelMenuOpenId((prev) => (prev === c._id ? null : c._id))
                      }}
                    >
                      <svg width="16" height="4" viewBox="0 0 16 4" className="fill-current">
                        <circle cx="2" cy="2" r="2"/>
                        <circle cx="8" cy="2" r="2"/>
                        <circle cx="14" cy="2" r="2"/>
                      </svg>
                    </button>

                    {channelMenuOpenId === c._id && (
                      <div className="absolute mt-2 right-0 top-full w-44 rounded border border-black/20 bg-[#18191c] shadow-lg z-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={async () => {
                            setChannelMenuOpenId(null)
                            setRenameChannelId(c._id)
                            setRenameChannelValue(c.name)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[#4f545c]/40"
                        >
                          Edit Channel
                        </button>
                        <div className="h-px bg-white/10 mx-2" />
                        <button
                          type="button"
                          onClick={async () => {
                            setChannelMenuOpenId(null)
                            if (confirm('Delete this channel?')) {
                              await deleteChannel(c._id)
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                        >
                          Delete Channel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {!channelsLoading && channels.length === 0 && (
                <div className="px-2 py-1 text-xs text-white/60">No channels yet</div>
              )}
            </div>
          )}
        </div>

        {/* User Panel */}
        <div className="h-14 bg-[#292b2f] px-2 flex items-center gap-2" ref={userMenuRef}>
          <UserAvatar 
            username={currentUser?.username || 'User'} 
            avatar={currentUser?.avatar}
            size="md" 
            status={myStatus} 
            showStatus 
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {currentUser?.username || 'Loading...'}
            </div>
            <div className="text-xs text-white/60 truncate">
              #{currentUser?.discriminator || '0000'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-8 h-8 rounded hover:bg-white/10 transition-colors flex items-center justify-center text-white/80"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-16 left-2 w-56 rounded border border-black/20 bg-[#18191c] shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    username={currentUser?.username || 'User'} 
                    avatar={currentUser?.avatar}
                    size="lg" 
                    status={myStatus} 
                    showStatus 
                  />
                  <div>
                    <div className="font-medium text-white">
                      {currentUser?.username || 'Loading...'}
                    </div>
                    <div className="text-sm text-white/60">
                      #{currentUser?.discriminator || '0000'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Status Options */}
              <div className="p-2">
                <div className="text-xs font-semibold text-white/60 uppercase mb-2 px-2">Set Status</div>
                {[
                  { status: 'online' as const, label: 'Online', color: 'bg-green-500' },
                  { status: 'idle' as const, label: 'Idle', color: 'bg-yellow-500' },
                  { status: 'dnd' as const, label: 'Do Not Disturb', color: 'bg-red-500' },
                  { status: 'offline' as const, label: 'Invisible', color: 'bg-gray-500' }
                ].map(({ status, label, color }) => (
                  <button
                    key={status}
                    onClick={() => {
                      changeStatus(status)
                      setUserMenuOpen(false)
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-[#4f545c]/40 flex items-center gap-3 ${
                      myStatus === status ? 'bg-[#4f545c]/40' : ''
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    {label}
                  </button>
                ))}
              </div>
              
              <div className="border-t border-white/10">
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-[#4f545c]/40">
                  Profile
                </button>
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-[#4f545c]/40">
                  Settings
                </button>
                <div className="h-px bg-white/10 mx-2" />
                <button 
                  onClick={() => {
                    setUserMenuOpen(false)
                    void handleLogout()
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#36393f]">
        {/* Channel Header */}
        <div className="h-12 border-b border-black/20 flex items-center px-4 gap-3 shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current text-white/60">
            <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41001 9L8.35001 15H14.35L15.41 9H9.41001Z"/>
          </svg>
          <div className="font-semibold text-white truncate">
            {route.isMe ? 'Friends' : selectedChannel?.name || 'general'}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <button className="w-6 h-6 text-white/60 hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17C15.24 5.06 14.32 5 13.4 5H12C7.58 5 4 8.58 4 13C4 17.42 7.58 21 12 21C16.42 21 20 17.42 20 13H18C18 16.31 15.31 19 12 19C8.69 19 6 16.31 6 13C6 9.69 8.69 7 12 7H13.4C14.8 7 16.2 7.2 17.6 7.7L21 9Z"/>
              </svg>
            </button>
            <button className="w-6 h-6 text-white/60 hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {children}
      </div>

      {/* Members Sidebar */}
      {!route.isMe && route.serverId && (
        <div className="w-[240px] bg-[#2f3136] border-l border-black/20 flex flex-col">
          <div className="h-12 px-4 flex items-center border-b border-black/20">
            <div className="text-xs text-white/60 font-semibold">MEMBERS — {members.length}</div>
            {membersLoading && <div className="ml-auto text-[10px] text-white/40">Loading…</div>}
          </div>

          <div className="flex-1 overflow-auto px-2 py-3">
            {membersError && (
              <div className="mx-2 mb-2 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {membersError}
              </div>
            )}

            <div className="px-2 py-1 text-xs text-white/60 font-semibold">ONLINE — {members.length}</div>

            {members.map((m) => {
              const user = m.user
              const isOwner = ownerId ? ownerId === user._id : false
              const userStatus = getUserStatus(user._id)
              const isOnline = isUserOnline(user._id)

              return (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => setSelectedMember({ user: { ...user, status: userStatus }, isOwner })}
                  className="w-full px-2 py-1.5 rounded hover:bg-white/5 transition-colors flex items-center gap-3"
                >
                  <UserAvatar 
                    username={user.username} 
                    avatar={user.avatar} 
                    size="md" 
                    status={userStatus} 
                    showStatus 
                  />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-1">
                      <div className={`text-sm font-medium truncate ${isOnline ? 'text-white' : 'text-white/60'}`}>
                        {user.username}
                      </div>
                      {isOwner && <div title="Server Owner" className="text-yellow-400">👑</div>}
                    </div>
                    {user.customStatus && (
                      <div className="text-xs text-white/60 truncate">{user.customStatus}</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {renameChannelId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRenameChannelId(null)
          }}
        >
          <div className="w-[420px] max-w-[92vw] rounded-xl border border-black/20 bg-[#36393f] p-6">
            <div className="text-lg font-semibold text-white mb-4">Edit Channel</div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-white/60 mb-2 uppercase">Channel Name</label>
              <input
                className="w-full h-10 rounded bg-[#40444b] border border-black/20 px-3 text-sm outline-none focus:border-[#5865f2] text-white"
                value={renameChannelValue}
                onChange={(e) => setRenameChannelValue(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded bg-transparent hover:bg-white/5 text-sm text-white"
                onClick={() => setRenameChannelId(null)}
                disabled={renamingChannel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-[#5865f2] hover:bg-[#4752c4] text-sm text-white disabled:opacity-60"
                disabled={renamingChannel || !renameChannelValue.trim()}
                onClick={async () => {
                  const cid = renameChannelId
                  const next = renameChannelValue.trim()
                  if (!cid || !next) return
                  setRenamingChannel(true)
                  try {
                    await updateChannel(cid, { name: next })
                    setRenameChannelId(null)
                  } finally {
                    setRenamingChannel(false)
                  }
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateServerModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (name) => {
          await createServer(name)
          setCreateOpen(false)
        }}
        loading={creatingServer}
        error={createServerError}
      />
      <JoinServerModal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onJoin={async (serverId) => {
          await joinServer(serverId)
          setJoinOpen(false)
        }}
        loading={joiningServer}
        error={joinServerError}
      />
      <CreateChannelModal
        open={createChannelOpen}
        onClose={() => setCreateChannelOpen(false)}
        onCreate={async (name) => {
          await createChannel(name)
          setCreateChannelOpen(false)
        }}
        loading={creatingChannel}
        error={createChannelError}
      />

      <ServerSettingsModal
        open={serverSettingsOpen}
        onClose={() => setServerSettingsOpen(false)}
        server={selectedServer}
        onUpdate={async (updatedServer) => {
          if (selectedServer) {
            await updateServer(selectedServer._id, {
              name: updatedServer.name,
              description: updatedServer.description,
              icon: updatedServer.icon || undefined,
              banner: updatedServer.banner || undefined,
              isPublic: updatedServer.isPublic,
              verificationLevel: updatedServer.verificationLevel
            })
          }
        }}
      />

      <InviteServerModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        server={selectedServer}
      />

      <MemberProfileModal
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        user={selectedMember?.user || null}
        isOwner={!!selectedMember?.isOwner}
      />
    </div>
  )
}