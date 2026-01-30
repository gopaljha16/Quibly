'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChannelsData } from '@/hooks/useChannelsData'
import { useProfile } from '@/hooks/queries'
import { usePresenceContext } from '@/components/PresenceProvider'
import { apiPost } from '@/lib/api'
import CreateServerModal from './CreateServerModal'
import MemberProfileModal from './MemberProfileModal'
import CreateChannelModal from './CreateChannelModal'
import JoinServerModal from './JoinServerModal'
import ServerSettingsModal from './ServerSettingsModal'
import InviteServerModal from './InviteServerModal'
import { ServerListSkeleton, ChannelListSkeleton, MemberListSkeleton } from '@/components/LoadingSkeletons'



// Status badge with tooltip
const StatusBadge = ({ status }: { status?: 'online' | 'idle' | 'dnd' | 'offline' }) => {
  const statusInfo = {
    online: { color: 'bg-[#23a559]', text: 'Online' },
    idle: { color: 'bg-[#f0b232]', text: 'Idle' },
    dnd: { color: 'bg-[#f23f43]', text: 'Do Not Disturb' },
    offline: { color: 'bg-[#80848e]', text: 'Offline' }
  }

  const info = statusInfo[status || 'offline']

  return (
    <div className="relative group">
      <div className={`w-3.5 h-3.5 rounded-full border-[3px] border-[#2B2D31] ${info.color}`} />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[#F2F3F5] text-xs font-medium rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {info.text}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black" />
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
    <div className="relative inline-block">
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-[#f3c178] to-[#f35e41] flex items-center justify-center font-medium text-white overflow-hidden transition-opacity hover:opacity-90`}>
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

export default function EnhancedChannelsShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: currentUser } = useProfile()
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

  // Use new hooks instead of ChannelsProvider
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
  } = useChannelsData()

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
    <div className="h-screen w-screen bg-[#0b0500] text-white flex overflow-hidden font-sans">
      {/* Server Sidebar */}
      <div className="w-[72px] bg-[#050200] flex flex-col items-center py-3 gap-2 overflow-y-auto scrollbar-hide">
        {/* Home/DM Button */}
        <div className="relative group">
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 ${route.isMe ? 'h-10' : 'h-2 group-hover:h-5 opacity-0 group-hover:opacity-100'
            }`} />
          <button
            type="button"
            onClick={goToMe}
            className={`w-12 h-12 flex items-center justify-center text-lg font-bold transition-all duration-200 overflow-hidden ${route.isMe
              ? 'bg-gradient-to-r from-[#f3c178] to-[#f35e41] rounded-[16px]'
              : 'bg-[#1a1510] text-gray-100 group-hover:bg-[#f3c178] group-hover:text-white rounded-[24px] group-hover:rounded-[16px]'
              }`}
          >
            <svg width="28" height="20" viewBox="0 0 28 20" className="fill-current">
              <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461744 10.3368 0.00546311C8.48074 0.324393 6.67795 0.885118 4.96746 1.68231C1.56727 6.77853 0.649666 11.7538 1.11108 16.652C3.10102 18.1418 5.3262 19.2743 7.69177 20C8.22338 19.2743 8.69519 18.4993 9.09812 17.691C8.32996 17.3997 7.58522 17.0424 6.87684 16.6291C7.06531 16.4979 7.25183 16.3615 7.43624 16.2202C11.4193 18.0402 15.9176 18.0402 19.8555 16.2202C20.0403 16.3615 20.2268 16.4979 20.4148 16.6291C19.7059 17.0427 18.9606 17.4 18.1921 17.691C18.5949 18.4993 19.0667 19.2743 19.5984 20C21.9639 19.2743 24.1894 18.1418 26.1794 16.652C26.7228 11.0369 25.2119 6.10654 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0395 9.54272 12.0187 10.994C12.0187 12.4453 10.9893 13.6383 9.68041 13.6383ZM18.5129 13.6383C17.2271 13.6383 16.1703 12.4453 16.1703 10.994C16.1703 9.54272 17.2009 8.34973 18.5129 8.34973C19.8248 8.34973 20.8751 9.54272 20.8542 10.994C20.8542 12.4453 19.8248 13.6383 18.5129 13.6383Z" />
            </svg>
          </button>
        </div>

        <div className="w-8 h-[2px] bg-[#35363C] rounded-lg my-1" />

        {/* Server List */}
        {serversLoading ? (
          <ServerListSkeleton />
        ) : (
          servers.map((s) => (
            <div key={s._id} className="relative group">
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 ${s._id === route.serverId ? 'h-10' : 'h-2 group-hover:h-5 opacity-0 group-hover:opacity-100'
                }`} />
              <button
                type="button"
                onClick={() => void selectServer(s._id)}
                className={`w-12 h-12 flex items-center justify-center text-lg font-bold transition-all duration-200 overflow-hidden ${s._id === route.serverId
                  ? 'bg-gradient-to-r from-[#f3c178] to-[#f35e41] rounded-[16px] text-white'
                  : 'bg-[#1a1510] text-gray-100 group-hover:bg-[#f3c178] group-hover:text-white rounded-[24px] group-hover:rounded-[16px]'
                  }`}
                title={s.name || 'Server'}
              >
                {s.icon ? (
                  <img src={s.icon} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  (s.name || 'S').slice(0, 1).toUpperCase()
                )}
              </button>
            </div>
          ))
        )}

        {/* Add Server Button */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="w-12 h-12 rounded-[24px] bg-[#1a1510] hover:bg-[#f3c178] group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center text-[#f3c178] hover:text-white text-2xl font-normal group"
            title="Add a Server"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        </div>

        {/* Join Server Button */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => setJoinOpen(true)}
            className="w-12 h-12 rounded-[24px] bg-[#1a1510] hover:bg-[#f3c178] group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center text-[#f3c178] hover:text-white"
            title="Join a Server"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Channels Sidebar */}
      <div className="w-[240px] bg-[#0d0805] flex flex-col rounded-tl-[8px]">
        {/* Server Header */}
        <div className="h-12 px-4 flex items-center border-b border-[#1a1510] shadow-sm cursor-pointer hover:bg-[#1a1510] transition-colors"
          onClick={() => !route.isMe && route.serverId && setServerMenuOpen((v) => !v)}
          ref={serverMenuRef}
        >
          <div className="font-bold text-white truncate flex-1">
            {route.isMe ? 'Direct Messages' : selectedServer?.name || 'Server'}
          </div>
          {!route.isMe && route.serverId && (
            <div className="flex items-center">
              <svg width="18" height="18" viewBox="0 0 24 24" className={`fill-current text-white transition-transform ${serverMenuOpen ? 'rotate-45' : ''}`}>
                <path d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1z" />
              </svg>
            </div>
          )}

        </div>

        {/* Search Bar */}
        <div className="p-2 border-b border-[#1a1510] shadow-sm">
          <button className="w-full h-7 rounded-[4px] bg-[#050200] text-left px-2 text-sm text-[#949BA4] hover:text-[#DBDEE1] transition-colors flex items-center">
            Find or start a conversation
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin scrollbar-thumb-[#1A1B1E] scrollbar-track-[#2B2D31]">
          {error && (
            <div className="mx-2 mb-2 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error instanceof Error ? error.message : String(error)}
            </div>
          )}

          {route.isMe ? (
            <div className="space-y-[2px]">
              <div className="px-2 pt-4 pb-1 text-xs text-[#949BA4] font-bold hover:text-[#DBDEE1] cursor-pointer flex items-center gap-0.5">
                <span className="uppercase">Direct Messages</span>
                <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <button className="group w-full px-2 py-2 rounded-[4px] hover:bg-[#1a1510] text-[15px] text-[#949BA4] hover:text-[#DBDEE1] text-left flex items-center gap-3 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#1a1510] flex items-center justify-center overflow-hidden">
                  <svg width="18" height="18" viewBox="0 0 24 24" className="fill-current">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <span className="font-medium">Friends</span>
              </button>
            </div>
          ) : (
            <div className="space-y-[2px]">
              <div className="px-2 pt-4 pb-1 text-xs text-[#949BA4] font-bold hover:text-[#DBDEE1] cursor-pointer flex items-center gap-0.5 uppercase">
                <svg width="12" height="12" viewBox="0 0 24 24" className="fill-current mr-0.5 transform rotate-90">
                  <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z" />
                </svg>
                <span>Text Channels</span>
                {channelsLoading && <span className="ml-2 text-[10px] opacity-50">Loading...</span>}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreateChannelOpen(true);
                  }}
                  className="ml-auto w-4 h-4 hover:text-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" className="fill-current">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </button>
              </div>

              {channels.map((c, idx) => (
                <div
                  key={c._id}
                  className={`group relative w-full text-left px-2 py-[6px] rounded-[4px] text-[15px] flex items-center gap-1.5 cursor-pointer ${c._id === route.channelId ? 'bg-[#f3c178]/10 text-[#f3c178] border-l-2 border-[#f3c178]' : 'hover:bg-[#35373C] text-[#949BA4] hover:text-[#DBDEE1]'
                    }`}
                  onClick={() => {
                    if (!route.serverId) return
                    selectChannel(route.serverId, c._id)
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current opacity-60 flex-shrink-0">
                    <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41001 9L8.35001 15H14.35L15.41 9H9.41001Z" />
                  </svg>
                  <span className="truncate font-medium flex-1">{c.name}</span>

                  {/* Channel Settings Icon - Only visible on hover */}
                  <div
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setChannelMenuOpenId((prev) => (prev === c._id ? null : c._id));
                    }}
                    ref={channelMenuOpenId === c._id ? channelMenuRef : undefined}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current hover:text-white cursor-pointer">
                      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                    </svg>

                    {channelMenuOpenId === c._id && (
                      <div className="absolute mt-2 left-0 top-full w-44 rounded border border-[#1F2023] bg-[#111214] shadow-lg z-50 overflow-hidden p-1">
                        <button
                          type="button"
                          onClick={async () => {
                            setChannelMenuOpenId(null)
                            setRenameChannelId(c._id)
                            setRenameChannelValue(c.name)
                          }}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-[#f3c178] text-[#B5BAC1] hover:text-white rounded-[2px]"
                        >
                          Edit Channel
                        </button>
                        <div className="h-px bg-[#1F2023] my-1" />
                        <button
                          type="button"
                          onClick={async () => {
                            setChannelMenuOpenId(null)
                            if (confirm('Delete this channel?')) {
                              await deleteChannel(c._id)
                            }
                          }}
                          className="w-full text-left px-2 py-1.5 text-sm text-[#DA373C] hover:bg-[#DA373C] hover:text-white rounded-[2px]"
                        >
                          Delete Channel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {!channelsLoading && channels.length === 0 && (
                <div className="px-2 py-1 text-xs text-[#949BA4]">No channels yet</div>
              )}
            </div>
          )}
        </div>

        {/* User Panel */}
        <div className="h-[52px] bg-[#050200] px-2 flex items-center gap-1 flex-shrink-0" ref={userMenuRef}>
          <div
            className="flex items-center gap-2 hover:bg-[#1a1510] rounded-[4px] pl-0.5 pr-2 py-1 cursor-pointer transition-colors min-w-0 -ml-1 mr-auto"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <UserAvatar
              username={currentUser?.username || 'User'}
              avatar={currentUser?.avatar}
              size="sm"
              status={myStatus}
              showStatus
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate leading-tight">
                {currentUser?.username || 'Loading...'}
              </div>
              <div className="text-xs text-[#949BA4] truncate leading-tight">
                {myStatus === 'online' ? 'Online' : myStatus === 'idle' ? 'Idle' : myStatus === 'dnd' ? 'Do Not Disturb' : 'Invisible'}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <button className="w-8 h-8 rounded-[4px] hover:bg-[#3F4147] flex items-center justify-center text-[#DBDEE1] transition-colors relative group">
              <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current">
                <path d="M14.99 11C14.99 12.66 13.66 14 12 14C10.34 14 9 12.66 9 11V5C9 3.34 10.34 2 12 2C13.66 2 15 3.34 15 5L14.99 11ZM12 16.1C14.76 16.1 17.3 14 17.3 11H19C19 14.42 16.28 17.17 13 17.65V21H11V17.65C7.72 17.17 5 14.42 5 11H6.7C6.7 14 9.24 16.1 12 16.1Z" />
              </svg>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Mute
              </div>
            </button>
            <button className="w-8 h-8 rounded-[4px] hover:bg-[#1a1510] flex items-center justify-center text-[#DBDEE1] transition-colors relative group">
              <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 6C9.79 6 8 7.79 8 10V14C8 16.21 9.79 18 12 18C14.21 18 16 16.21 16 14V10C16 7.79 14.21 6 12 6Z" />
              </svg>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Deafen
              </div>
            </button>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-8 h-8 rounded-[4px] hover:bg-[#3F4147] flex items-center justify-center text-[#DBDEE1] transition-colors relative group"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
              </svg>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                User Settings
              </div>
            </button>
          </div>

          {userMenuOpen && (
            <div className="absolute bottom-16 left-2 w-64 rounded bg-[#0d0805] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="h-16 bg-gradient-to-r from-[#f3c178] to-[#f35e41] relative">
                <div className="absolute -bottom-6 left-4 border-[6px] border-[#111214] rounded-full">
                  <UserAvatar
                    username={currentUser?.username || 'User'}
                    avatar={currentUser?.avatar}
                    size="lg"
                    status={myStatus}
                    showStatus
                  />
                </div>
              </div>
              <div className="pt-8 pb-3 px-4 border-b border-[#1a1510] bg-[#0d0805]">
                <div className="font-bold text-lg text-white">
                  {currentUser?.username || 'Loading...'}
                </div>
                <div className="text-sm text-[#B5BAC1]">
                  #{currentUser?.discriminator || '0000'}
                </div>
              </div>

              {/* Status Options */}
              <div className="p-2 bg-[#0d0805]">
                <div className="text-xs font-bold text-[#B5BAC1] uppercase mb-2 px-2 mt-2">Set Status</div>
                {[
                  { status: 'online' as const, label: 'Online', color: 'bg-[#23a559]' },
                  { status: 'idle' as const, label: 'Idle', color: 'bg-[#f0b232]' },
                  { status: 'dnd' as const, label: 'Do Not Disturb', color: 'bg-[#f23f43]' },
                  { status: 'offline' as const, label: 'Invisible', color: 'bg-[#80848e]' }
                ].map(({ status, label, color }) => (
                  <button
                    key={status}
                    onClick={() => {
                      changeStatus(status)
                      setUserMenuOpen(false)
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-[2px] text-sm hover:bg-[#f3c178]/20 hover:text-[#f3c178] flex items-center gap-3 group transition-colors ${myStatus === status ? 'bg-[#f3c178]/10 text-[#f3c178] border-l-2 border-[#f3c178]' : 'text-[#B5BAC1]'
                      }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-[#1a1510] bg-[#0d0805]">
                <button
                  onClick={() => {
                    setUserMenuOpen(false)
                    void handleLogout()
                  }}
                  className="w-full text-left px-2 py-1.5 text-sm text-[#DA373C] hover:bg-[#DA373C] hover:text-white rounded-[2px] transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current">
                    <path d="M9 3V5H15V3H9ZM5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V5H5ZM16.17 11L14.59 12.58L13 11V16H11V11L9.41 12.59L7.83 11L12 6.83L16.17 11Z" transform="rotate(90 12 12)" />
                  </svg>
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#0b0500]">
        {/* Channel Header */}
        <div className="h-12 border-b border-[#1a1510] flex items-center px-4 gap-3 shadow-sm flex-shrink-0 bg-[#0b0500]">
          <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current text-[#80848E]">
            <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41001 9L8.35001 15H14.35L15.41 9H9.41001Z" />
          </svg>
          <div className="font-bold text-white truncate text-[16px]">
            {route.isMe ? 'Friends' : selectedChannel?.name || 'general'}
          </div>
          {selectedChannel?.description && (
            <>
              <div className="w-px h-6 bg-[#3F4147] mx-2" />
              <div className="text-xs text-[#B5BAC1] truncate max-w-lg font-medium">
                {selectedChannel.description}
              </div>
            </>
          )}
          <div className="ml-auto flex items-center gap-4">
            <button className="w-6 h-6 text-[#B5BAC1] hover:text-[#DBDEE1] transition-colors relative group">
              <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17C15.24 5.06 14.32 5 13.4 5H12C7.58 5 4 8.58 4 13C4 17.42 7.58 21 12 21C16.42 21 20 17.42 20 13H18C18 16.31 15.31 19 12 19C8.69 19 6 16.31 6 13C6 9.69 8.69 7 12 7H13.4C14.8 7 16.2 7.2 17.6 7.7L21 9Z" />
              </svg>
              <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Notification Settings
              </div>
            </button>
            <button className="w-6 h-6 text-[#B5BAC1] hover:text-[#DBDEE1] transition-colors relative group">
              <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
              <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Pinned Messages
              </div>
            </button>
            <button
              className={`w-6 h-6 text-[#B5BAC1] hover:text-[#DBDEE1] transition-colors relative group ${route.isMe ? 'hidden' : ''}`}
              onClick={() => {
                // Toggle member list visibility if I had state for it
                // For now just visual
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                <path d="M16 4C16 2.89 16.89 2 18 2C19.11 2 20 2.89 20 4C20 5.11 19.11 6 18 6C16.89 6 16 5.11 16 4ZM16 20V14H18.5L15.96 6.37C15.5 4.97 13.92 4.97 13.46 6.37L10.92 14H13.42V20H16ZM4 4C4 2.89 4.89 2 6 2C7.11 2 8 2.89 8 4C8 5.11 7.11 6 6 6C4.89 6 4 5.11 4 4ZM1.75 16L4.5 7.94C4.96 6.54 6.54 6.54 7 7.94L9.75 16H8V22H4V16H1.75Z" />
              </svg>
              <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Hide Member List
              </div>
            </button>

            <div className="relative group">
              <input
                type="text"
                placeholder="Search"
                className="bg-[#1E1F22] text-sm text-[#DBDEE1] placeholder-[#949BA4] rounded-[4px] px-2 py-1 w-36 transition-all focus:w-60 focus:outline-none"
              />
              <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current text-[#949BA4] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <path d="M21.707 20.293L16.314 14.9C17.403 13.504 18 11.799 18 10C18 6.009 15.363 2.691 11.609 2.133C7.527 1.517 3.966 4.394 3.125 8.406C2.35 12.096 5.167 15.65 8.921 15.957C10.799 16.111 12.504 15.514 13.9 14.425L19.293 19.818C19.488 20.013 19.744 20.11 20 20.11C20.256 20.11 20.512 20.013 20.707 19.818C21.098 19.427 21.098 18.795 21.707 20.293ZM10 14C7.794 14 6 12.206 6 10C6 7.794 7.794 6 10 6C12.206 6 14 7.794 14 10C14 12.206 12.206 14 10 14Z" />
              </svg>
            </div>
          </div>
        </div>

        {children}
      </div>

      {/* Members Sidebar */}
      {!route.isMe && route.serverId && (
        <div className="w-[240px] bg-[#0d0805] flex flex-col flex-shrink-0">
          <div className="h-12 px-4 flex items-center shadow-sm flex-shrink-0">
            {/* Use same height as header but transparent or matching bg */}
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin scrollbar-thumb-[#1a1510] scrollbar-track-[#0d0805]">
            {membersError && (
              <div className="mx-2 mb-2 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {membersError instanceof Error ? membersError.message : String(membersError)}
              </div>
            )}

            {/* Group Members by Status (Simplified for now) */}
            <div className="px-3 pt-3 pb-1 text-xs text-[#949BA4] font-bold uppercase tracking-wide">
              Online — {members.length}
            </div>

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
                  className="w-full px-2 py-1.5 rounded-[4px] hover:bg-[#1a1510] transition-colors flex items-center gap-3 group opacity-90 hover:opacity-100"
                >
                  <UserAvatar
                    username={user.username}
                    avatar={user.avatar}
                    size="md"
                    status={userStatus}
                    showStatus
                  />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <div className={`text-[15px] font-medium truncate ${isOnline ? 'text-[#DBDEE1]' : 'text-[#949BA4] group-hover:text-[#DBDEE1]'}`}>
                        {user.username}
                      </div>
                      {isOwner && (
                        <svg className="w-3.5 h-3.5 text-[#F0B232]" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.6572 5.42868C13.8879 5.29002 14.1806 5.30402 14.3973 5.46468C14.6133 5.62602 14.7119 5.90068 14.6473 6.16202L13.3139 11.4954C13.2393 11.7927 12.9726 12.0007 12.6666 12.0007H3.33325C3.02725 12.0007 2.76058 11.7927 2.68592 11.4954L1.35258 6.16202C1.28792 5.90068 1.38658 5.62602 1.60258 5.46468C1.81992 5.30468 2.11192 5.29068 2.34325 5.42868L5.13192 7.10202L7.44592 3.63068C7.46173 3.60697 7.48026 3.5853 7.50125 3.56602C7.62192 3.45535 7.78058 3.39002 7.94525 3.38202H8.05458C8.21925 3.39002 8.37792 3.45535 8.49925 3.56602C8.52024 3.5853 8.53877 3.60697 8.55458 3.63068L10.8686 7.10202L13.6572 5.42868ZM2.66667 13.334H13.3333V14.6673H2.66667V13.334Z" />
                        </svg>
                      )}
                    </div>
                    {user.customStatus && (
                      <div className="text-xs text-[#949BA4] truncate group-hover:text-[#DBDEE1]">{user.customStatus}</div>
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
                className="w-full h-10 rounded bg-[#40444b] border border-black/20 px-3 text-sm outline-none focus:border-[#f3c178] text-white"
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
                className="px-4 py-2 rounded bg-gradient-to-r from-[#f3c178] to-[#f35e41] hover:from-[#e0a850] hover:to-[#e0442a] text-sm text-[#0b0500] font-bold disabled:opacity-60"
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