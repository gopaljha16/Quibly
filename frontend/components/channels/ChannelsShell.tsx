'use client'

import { useState } from 'react'
import { useChannels } from './ChannelsProvider'
import CreateServerModal from './CreateServerModal'
import MemberProfileModal from './MemberProfileModal'

export default function ChannelsShell({ children }: { children: React.ReactNode }) {
  const [createOpen, setCreateOpen] = useState(false)
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
    servers,
    channels,
    error,
    selectedServer,
    selectedChannel,
    goToMe,
    selectServer,
    selectChannel,
    createServer,
    membersLoading,
    membersError,
    members,
    ownerId,
  } = useChannels()

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
      </div>

      <div className="w-[260px] bg-[#11151b] border-r border-white/5 flex flex-col">
        <div className="h-12 px-4 flex items-center border-b border-white/5">
          <div className="font-semibold text-sm truncate">
            {route.isMe ? 'Friends' : selectedServer?.name || 'Server'}
          </div>
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

              {channels.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => {
                    if (!route.serverId) return
                    selectChannel(route.serverId, c._id)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
                    c._id === route.channelId ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="text-white/50">#</span>
                  <span className="truncate">{c.name}</span>
                </button>
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

      <MemberProfileModal
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        user={selectedMember?.user || null}
        isOwner={!!selectedMember?.isOwner}
      />
    </div>
  )
}
