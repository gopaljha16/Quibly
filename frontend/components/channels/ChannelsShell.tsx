'use client'

import { useEffect, useRef, useState } from 'react'
import { useChannels } from './ChannelsProvider'
import CreateServerModal from './CreateServerModal'
import MemberProfileModal from './MemberProfileModal'
import CreateChannelModal from './CreateChannelModal'
import JoinServerModal from './JoinServerModal'

// Status indicator component
const StatusIndicator = ({ status }: { status?: 'online' | 'idle' | 'dnd' | 'offline' }) => {
  const statusColors = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500'
  }
  
  return (
    <div className={`w-3 h-3 rounded-full border-2 border-[#11151b] ${statusColors[status || 'offline']}`} />
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
          <StatusIndicator status={status} />
        </div>
      )}
    </div>
  )
}

export default function ChannelsShell({ children }: { children: React.ReactNode }) {
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
  } = useChannels()
  const [createChannelOpen, setCreateChannelOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

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
    if (!renameChannelId) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRenameChannelId(null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [renameChannelId])

  return (
    <div className="h-screen w-screen bg-[#0f1115] text-white flex overflow-hidden">
      {/* Server Sidebar */}
      <div className="w-[72px] bg-[#0b0d10] border-r border-white/5 flex flex-col items-center py-3 gap-2">
        {/* Home/DM Button */}
        <div className="relative group">
          <button
            type="button"
            onClick={goToMe}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
              route.isMe 
                ? 'bg-[#5865f2] rounded-xl' 
                : 'bg-white/5 hover:bg-[#5865f2] hover:rounded-xl'
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </button>
          {!route.isMe && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-white rounded-r-full transition-all duration-200" />
          )}
          {route.isMe && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full" />
          )}
        </div>

        <div className="w-8 h-px bg-white/10 my-1" />

        {/* Server List */}
        {serversLoading ? (
          <div className="w-12 h-12 rounded-2xl bg-white/5 animate-pulse" />
        ) : (
          servers.map((s) => (
            <div key={s._id} className="relative group">
              <button
                type="button"
                onClick={() => void selectServer(s._id)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                  s._id === route.serverId 
                    ? 'bg-[#5865f2] rounded-xl' 
                    : 'bg-white/5 hover:bg-[#5865f2] hover:rounded-xl'
                }`}
                title={s.name || 'Server'}
              >
                {s.icon ? (
                  <img src={s.icon} alt={s.name} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  (s.name || 'S').slice(0, 1).toUpperCase()
                )}
              </button>
              {s._id !== route.serverId && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-white rounded-r-full opacity-0 group-hover:opacity-100 transition-all duration-200" />
              )}
              {s._id === route.serverId && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full" />
              )}
              
              {/* Server tooltip */}
              <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-black/90 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {s.name || 'Server'}
              </div>
            </div>
          ))
        )}

        <div className="flex-1" />

        {/* Add Server Button */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-green-600 hover:rounded-xl transition-all duration-200 flex items-center justify-center text-2xl leading-none text-white/80 hover:text-white"
            title="Add a Server"
          >
            +
          </button>
          <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-black/90 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            Add a Server
          </div>
        </div>

        {/* Join Server Button */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => setJoinOpen(true)}
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-blue-600 hover:rounded-xl transition-all duration-200 flex items-center justify-center text-xl leading-none text-white/80 hover:text-white"
            title="Join a Server"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
          <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-black/90 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            Join a Server
          </div>
        </div>
      </div>

      {/* Channels Sidebar */}
      <div className="w-[260px] bg-[#11151b] border-r border-white/5 flex flex-col">
        {/* Server Header */}
        <div className="h-12 px-4 flex items-center border-b border-white/5 shadow-sm">
          <div className="font-semibold text-sm truncate flex items-center gap-2">
            {route.isMe ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Direct Messages
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded bg-[#5865f2] flex items-center justify-center text-xs font-bold">
                  {selectedServer?.name?.slice(0, 1).toUpperCase() || 'S'}
                </div>
                {selectedServer?.name || 'Server'}
              </>
            )}
          </div>
          {!route.isMe && route.serverId && (
            <div className="ml-auto flex items-center relative" ref={serverMenuRef}>
              <button
                type="button"
                onClick={() => setServerMenuOpen((v) => !v)}
                className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-white/80 hover:text-white"
                aria-label="Server actions"
                aria-haspopup="menu"
                aria-expanded={serverMenuOpen}
                title="Server actions"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>

              {serverMenuOpen && (
                <div
                  role="menu"
                  className="absolute mt-2 right-0 top-full w-48 rounded-lg border border-white/10 bg-[#0f1115] shadow-xl z-50 overflow-hidden"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setServerMenuOpen(false)
                      setCreateChannelOpen(true)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Create Channel
                  </button>
                  <div className="h-px bg-white/10 mx-2" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setServerMenuOpen(false)
                      if (route.serverId) leaveServer(route.serverId)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-60 flex items-center gap-2 text-yellow-400"
                    disabled={leavingServer}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5z"/>
                    </svg>
                    Leave Server
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setServerMenuOpen(false)
                      if (route.serverId) deleteServer(route.serverId)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-60 flex items-center gap-2"
                    disabled={deletingServer}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
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
        <div className="p-3">
          <div className="h-9 rounded-md bg-black/20 border border-white/5 flex items-center px-3 text-xs text-white/60 hover:border-white/10 transition-colors">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            Find or start a conversation
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-auto px-2 pb-3">
          {error && (
            <div className="mx-2 mb-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              {error}
            </div>
          )}

          {route.isMe ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs text-white/60 font-semibold flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.996 2.996 0 0 0 16.96 6c-.8 0-1.54.37-2.01.97L12 10.5 9.05 6.97C8.58 6.37 7.84 6 7.04 6c-1.28 0-2.38.84-2.75 2.06L1.75 16H4.5v6h2v-6h2.5l1.68-5.59L12 12.5l1.32-2.09L15 16h3v6h2z"/>
                </svg>
                DIRECT MESSAGES
              </div>
              <button className="w-full px-3 py-2 rounded-md hover:bg-white/5 text-sm flex items-center gap-3 text-left">
                <UserAvatar username="Friends" size="sm" />
                <span>Friends</span>
                <div className="ml-auto w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">3</div>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs text-white/60 font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  TEXT CHANNELS
                </div>
                {channelsLoading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                ) : (
                  <button
                    onClick={() => setCreateChannelOpen(true)}
                    className="w-4 h-4 rounded hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
                    title="Create Channel"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                  </button>
                )}
              </div>

              {channels.map((c, idx) => (
                <div
                  key={c._id}
                  className={`group w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center gap-2 ${
                    c._id === route.channelId 
                      ? 'bg-white/10 text-white' 
                      : 'hover:bg-white/5 text-white/70 hover:text-white'
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
                    <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span className="truncate">{c.name}</span>
                  </button>
                  <div
                    className="relative flex items-center"
                    ref={channelMenuOpenId === c._id ? channelMenuRef : undefined}
                  >
                    <button
                      type="button"
                      className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center text-white/70 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus:opacity-100 focus:pointer-events-auto"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setChannelMenuOpenId((prev) => (prev === c._id ? null : c._id))
                      }}
                      aria-label="Channel actions"
                      aria-haspopup="menu"
                      aria-expanded={channelMenuOpenId === c._id}
                      title="Channel actions"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                      </svg>
                    </button>

                    {channelMenuOpenId === c._id && (
                      <div
                        role="menu"
                        className="absolute mt-2 right-0 top-full w-44 rounded-lg border border-white/10 bg-[#0f1115] shadow-xl z-50 overflow-hidden"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={async () => {
                            setChannelMenuOpenId(null)
                            setRenameChannelId(c._id)
                            setRenameChannelValue(c.name)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                          Rename
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={idx === 0}
                          onClick={async () => {
                            if (!route.serverId) return
                            setChannelMenuOpenId(null)
                            const ids = [...channels].map((x) => x._id)
                            const i = ids.indexOf(c._id)
                            if (i > 0) {
                              const tmp = ids[i - 1]
                              ids[i - 1] = ids[i]
                              ids[i] = tmp
                              await reorderChannels(route.serverId, ids)
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-60 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                          </svg>
                          Move Up
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={idx === channels.length - 1}
                          onClick={async () => {
                            if (!route.serverId) return
                            setChannelMenuOpenId(null)
                            const ids = [...channels].map((x) => x._id)
                            const i = ids.indexOf(c._id)
                            if (i < ids.length - 1) {
                              const tmp = ids[i + 1]
                              ids[i + 1] = ids[i]
                              ids[i] = tmp
                              await reorderChannels(route.serverId, ids)
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-60 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
                          </svg>
                          Move Down
                        </button>
                        <div className="h-px bg-white/10 mx-2" />
                        <button
                          type="button"
                          role="menuitem"
                          onClick={async () => {
                            setChannelMenuOpenId(null)
                            if (confirm('Delete this channel?')) {
                              await deleteChannel(c._id)
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {!channelsLoading && channels.length === 0 && (
                <div className="px-3 py-2 text-xs text-white/60">No channels yet</div>
              )}
            </div>
          )}
        </div>

        {/* User Panel */}
        <div className="h-14 bg-[#0d1117] border-t border-white/5 px-2 flex items-center gap-2" ref={userMenuRef}>
          <UserAvatar username="You" size="md" status="online" showStatus />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Your Username</div>
            <div className="text-xs text-white/60 truncate">#1234</div>
          </div>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            title="User Settings"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </button>
          
          {userMenuOpen && (
            <div className="absolute bottom-16 left-2 w-56 rounded-lg border border-white/10 bg-[#0f1115] shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <UserAvatar username="You" size="lg" status="online" showStatus />
                  <div>
                    <div className="font-medium">Your Username</div>
                    <div className="text-xs text-white/60">#1234</div>
                  </div>
                </div>
              </div>
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Set Status
              </button>
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Profile
              </button>
              <div className="h-px bg-white/10 mx-2" />
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
                Settings
              </button>
              <div className="h-px bg-white/10 mx-2" />
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-red-500/10 text-red-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5z"/>
                </svg>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#0f1115]">
        {/* Channel Header */}
        <div className="h-12 border-b border-white/5 flex items-center px-4 gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            {route.isMe ? (
              <>
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.996 2.996 0 0 0 16.96 6c-.8 0-1.54.37-2.01.97L12 10.5 9.05 6.97C8.58 6.37 7.84 6 7.04 6c-1.28 0-2.38.84-2.75 2.06L1.75 16H4.5v6h2v-6h2.5l1.68-5.59L12 12.5l1.32-2.09L15 16h3v6h2z"/>
                </svg>
                <span className="font-semibold text-sm">Friends</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="font-semibold text-sm truncate">{selectedChannel?.name || 'Channel'}</span>
              </>
            )}
          </div>
          
          <div className="flex-1" />
          
          {/* Channel Actions */}
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Start Voice Call">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
            </button>
            <button className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Start Video Call">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            </button>
            <button className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Show Member List">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.996 2.996 0 0 0 16.96 6c-.8 0-1.54.37-2.01.97L12 10.5 9.05 6.97C8.58 6.37 7.84 6 7.04 6c-1.28 0-2.38.84-2.75 2.06L1.75 16H4.5v6h2v-6h2.5l1.68-5.59L12 12.5l1.32-2.09L15 16h3v6h2z"/>
              </svg>
            </button>
            <button className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Search">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </button>
            <button className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Inbox">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </button>
            <button className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Help">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
              </svg>
            </button>
          </div>
        </div>

        {children}
      </div>

      {renameChannelId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRenameChannelId(null)
          }}
        >
          <div className="w-[420px] max-w-[92vw] rounded-xl border border-white/10 bg-[#11151b] p-4">
            <div className="text-sm font-semibold">Rename channel</div>
            <input
              className="mt-3 w-full h-10 rounded-md bg-black/20 border border-white/10 px-3 text-sm outline-none focus:border-[#5865f2]"
              value={renameChannelValue}
              onChange={(e) => setRenameChannelValue(e.target.value)}
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-sm"
                onClick={() => setRenameChannelId(null)}
                disabled={renamingChannel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-md bg-[#5865f2] hover:bg-[#4752c4] text-sm disabled:opacity-60"
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
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Sidebar */}
      {!route.isMe && route.serverId && (
        <div className="w-[240px] bg-[#11151b] border-l border-white/5 hidden lg:flex flex-col">
          <div className="h-12 px-4 flex items-center border-b border-white/5">
            <div className="text-xs text-white/60 font-semibold flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.996 2.996 0 0 0 16.96 6c-.8 0-1.54.37-2.01.97L12 10.5 9.05 6.97C8.58 6.37 7.84 6 7.04 6c-1.28 0-2.38.84-2.75 2.06L1.75 16H4.5v6h2v-6h2.5l1.68-5.59L12 12.5l1.32-2.09L15 16h3v6h2z"/>
              </svg>
              MEMBERS
            </div>
            {membersLoading && (
              <div className="ml-auto w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            )}
          </div>

          <div className="flex-1 overflow-auto px-2 py-3">
            {membersError && (
              <div className="mx-2 mb-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {membersError}
              </div>
            )}

            {/* Online Members */}
            <div className="px-3 py-2 text-xs text-white/60 font-semibold flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              ONLINE — {members.filter(m => m.user.status === 'online' || !m.user.status).length}
            </div>

            {members
              .filter(m => m.user.status === 'online' || !m.user.status)
              .map((m) => {
                const user = m.user
                const isOwner = ownerId ? ownerId === user._id : false

                return (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => setSelectedMember({ user, isOwner })}
                    className="w-full px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors flex items-center gap-3 group"
                  >
                    <UserAvatar 
                      username={user.username} 
                      avatar={user.avatar} 
                      size="md" 
                      status={user.status || 'online'} 
                      showStatus 
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-1">
                        <div className="text-sm font-medium truncate text-white/90 group-hover:text-white">
                          {user.username}
                        </div>
                        {isOwner && (
                          <div className="text-yellow-500" title="Server Owner">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      {user.customStatus && (
                        <div className="text-xs text-white/50 truncate">{user.customStatus}</div>
                      )}
                    </div>
                  </button>
                )
              })}

            {/* Offline Members */}
            {members.filter(m => m.user.status && m.user.status !== 'online').length > 0 && (
              <>
                <div className="px-3 py-2 text-xs text-white/60 font-semibold flex items-center gap-2 mt-4">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  OFFLINE — {members.filter(m => m.user.status && m.user.status !== 'online').length}
                </div>

                {members
                  .filter(m => m.user.status && m.user.status !== 'online')
                  .map((m) => {
                    const user = m.user
                    const isOwner = ownerId ? ownerId === user._id : false

                    return (
                      <button
                        key={m._id}
                        type="button"
                        onClick={() => setSelectedMember({ user, isOwner })}
                        className="w-full px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors flex items-center gap-3 group opacity-60"
                      >
                        <UserAvatar 
                          username={user.username} 
                          avatar={user.avatar} 
                          size="md" 
                          status={user.status} 
                          showStatus 
                        />
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-1">
                            <div className="text-sm font-medium truncate text-white/70 group-hover:text-white/90">
                              {user.username}
                            </div>
                            {isOwner && (
                              <div className="text-yellow-500/70" title="Server Owner">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          {user.customStatus && (
                            <div className="text-xs text-white/40 truncate">{user.customStatus}</div>
                          )}
                        </div>
                      </button>
                    )
                  })}
              </>
            )}
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

      <MemberProfileModal
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        user={selectedMember?.user || null}
        isOwner={!!selectedMember?.isOwner}
      />
    </div>
  )
}
