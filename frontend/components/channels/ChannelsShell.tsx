'use client'

import { useEffect, useRef, useState } from 'react'
import { useChannels } from './ChannelsProvider'
import CreateServerModal from './CreateServerModal'
import MemberProfileModal from './MemberProfileModal'
import CreateChannelModal from './CreateChannelModal'
import JoinServerModal from './JoinServerModal'

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
      <div className="w-[72px] bg-[#0b0d10] border-r border-white/5 flex flex-col items-center py-3 gap-3">
        <button
          type="button"
          onClick={goToMe}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-semibold transition-colors ${
            route.isMe ? 'bg-[#5865f2]' : 'bg-white/5 hover:bg-white/10'
          }`}
        >
          @
        </button>

        <div className="w-10 h-px bg-white/10" />

        {serversLoading ? (
          <div className="text-[10px] text-white/60">...</div>
        ) : (
          servers.map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => void selectServer(s._id)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-semibold transition-colors ${
                s._id === route.serverId ? 'bg-[#5865f2]' : 'bg-white/5 hover:bg-white/10'
              }`}
              title={s.name || 'Server'}
            >
              {(s.name || 'S').slice(0, 1).toUpperCase()}
            </button>
          ))
        )}

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-2xl leading-none text-white/80"
          title="Add a Server"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setJoinOpen(true)}
          className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-xl leading-none text-white/80"
          title="Join a Server"
        >
          ⇢
        </button>
      </div>

      <div className="w-[260px] bg-[#11151b] border-r border-white/5 flex flex-col">
        <div className="h-12 px-4 flex items-center border-b border-white/5">
          <div className="font-semibold text-sm truncate">
            {route.isMe ? 'Friends' : selectedServer?.name || 'Server'}
          </div>
          {!route.isMe && route.serverId && (
            <div className="ml-auto flex items-center relative" ref={serverMenuRef}>
              <button
                type="button"
                onClick={() => setServerMenuOpen((v) => !v)}
                className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-white/80"
                aria-label="Server actions"
                aria-haspopup="menu"
                aria-expanded={serverMenuOpen}
                title="Server actions"
              >
                ...
              </button>

              {serverMenuOpen && (
                <div
                  role="menu"
                  className="absolute mt-2 right-0 top-full w-44 rounded-md border border-white/10 bg-[#0f1115] shadow-lg z-50 overflow-hidden"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setServerMenuOpen(false)
                      setCreateChannelOpen(true)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5"
                  >
                    Create channel
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setServerMenuOpen(false)
                      if (route.serverId) leaveServer(route.serverId)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-60"
                    disabled={leavingServer}
                  >
                    Leave server
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setServerMenuOpen(false)
                      if (route.serverId) deleteServer(route.serverId)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-60"
                    disabled={deletingServer}
                  >
                    Delete server
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-3">
          <div className="h-9 rounded-md bg-black/20 border border-white/5 flex items-center px-3 text-xs text-white/60">
            Find or start a conversation
          </div>
        </div>

        <div className="flex-1 overflow-auto px-2 pb-3">
          {error && (
            <div className="mx-2 mb-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          {route.isMe ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs text-white/60">DIRECT MESSAGES</div>
              <div className="px-3 py-2 rounded-md hover:bg-white/5 text-sm">Friends</div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs text-white/60 flex items-center justify-between">
                <span>TEXT CHANNELS</span>
                {channelsLoading && <span className="text-[10px] text-white/40">Loading...</span>}
              </div>

              {channels.map((c, idx) => (
                <div
                  key={c._id}
                  className={`group w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
                    c._id === route.channelId ? 'bg-white/10' : 'hover:bg-white/5'
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
                    <span className="text-white/50">#</span>
                    <span className="truncate">{c.name}</span>
                  </button>
                  <div
                    className="relative flex items-center"
                    ref={channelMenuOpenId === c._id ? channelMenuRef : undefined}
                  >
                    <button
                      type="button"
                      className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center text-white/70 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus:opacity-100 focus:pointer-events-auto"
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
                      ...
                    </button>

                    {channelMenuOpenId === c._id && (
                      <div
                        role="menu"
                        className="absolute mt-2 right-0 top-full w-44 rounded-md border border-white/10 bg-[#0f1115] shadow-lg z-50 overflow-hidden"
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
                          className="w-full text-left px-3 py-2 text-sm hover:bg-white/5"
                        >
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
                          className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-60"
                        >
                          Move up
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
                          className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-60"
                        >
                          Move down
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={async () => {
                            setChannelMenuOpenId(null)
                            if (confirm('Delete this channel?')) {
                              await deleteChannel(c._id)
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {!channelsLoading && channels.length === 0 && (
                <div className="px-3 py-2 text-xs text-white/60">No channels</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#0f1115]">
        <div className="h-12 border-b border-white/5 flex items-center px-4 gap-3">
          <div className="text-white/50">#</div>
          <div className="font-semibold text-sm truncate">
            {route.isMe ? 'Friends' : selectedChannel?.name || 'Channel'}
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

      {!route.isMe && route.serverId && (
        <div className="w-[240px] bg-[#11151b] border-l border-white/5 hidden md:flex flex-col">
          <div className="h-12 px-4 flex items-center border-b border-white/5">
            <div className="text-xs text-white/60 font-semibold">MEMBERS</div>
            {membersLoading && <div className="ml-auto text-[10px] text-white/40">Loading…</div>}
          </div>

          <div className="flex-1 overflow-auto px-2 py-3">
            {membersError && (
              <div className="mx-2 mb-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {membersError}
              </div>
            )}

            <div className="px-3 py-2 text-xs text-white/60">Online — {members.length}</div>

            {members.map((m) => {
              const user = m.user
              const isOwner = ownerId ? ownerId === user._id : false
              const initials = user.username?.slice(0, 1).toUpperCase() || 'U'

              return (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => setSelectedMember({ user, isOwner })}
                  className="w-full px-2 py-2 rounded-md hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-1">
                      <div className="text-sm font-medium truncate">{user.username}</div>
                      {isOwner && <div title="Server Owner">👑</div>}
                    </div>
                    <div className="text-[10px] text-white/50 truncate">{user.status || 'offline'}</div>
                  </div>
                </button>
              )
            })}
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
