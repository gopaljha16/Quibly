'use client'

import { useEffect } from 'react'

type MemberUser = {
  _id: string
  username: string
  discriminator: string
  avatar?: string | null
  bio?: string
  status?: 'online' | 'idle' | 'dnd' | 'offline'
  customStatus?: string
}

// Status indicator component
const StatusIndicator = ({ status }: { status?: 'online' | 'idle' | 'dnd' | 'offline' }) => {
  const statusColors = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500'
  }
  
  return (
    <div className={`w-4 h-4 rounded-full border-2 border-[#2f3136] ${statusColors[status || 'offline']}`} />
  )
}

export default function MemberProfileModal({
  open,
  onClose,
  user,
  isOwner,
}: {
  open: boolean
  onClose: () => void
  user: MemberUser | null
  isOwner: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open || !user) return null

  const initials = user.username?.slice(0, 1).toUpperCase() || 'U'

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-[#36393f] border border-black/20 shadow-2xl overflow-hidden">
          {/* Header Banner */}
          <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-black/20 transition-colors flex items-center justify-center text-white"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="fill-current">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-12 flex items-end justify-between mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-4 border-[#36393f] flex items-center justify-center text-3xl font-bold text-white">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.username} 
                      className="w-full h-full rounded-full object-cover" 
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <StatusIndicator status={user.status} />
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-xl font-bold text-white">{user.username}</div>
                {isOwner && (
                  <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded uppercase">
                    Owner
                  </div>
                )}
              </div>
              <div className="text-sm text-white/70">
                {user.username}
                {user.discriminator ? `#${user.discriminator}` : '#0001'}
              </div>
            </div>

            {/* Status & Bio */}
            {(user.customStatus || user.bio) && (
              <div className="mb-4 rounded-xl bg-[#2f3136] border border-black/20 p-4">
                {user.customStatus && (
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-white/60 uppercase mb-1">Status</div>
                    <div className="text-sm text-white/90">{user.customStatus}</div>
                  </div>
                )}
                {user.bio && (
                  <div>
                    <div className="text-xs font-semibold text-white/60 uppercase mb-1">About Me</div>
                    <div className="text-sm text-white/80">{user.bio}</div>
                  </div>
                )}
              </div>
            )}

            {/* Member Since */}
            <div className="mb-4 rounded-xl bg-[#2f3136] border border-black/20 p-4">
              <div className="text-xs font-semibold text-white/60 uppercase mb-2">Member Since</div>
              <div className="text-sm text-white/80">
                {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                type="button"
                className="w-full rounded-lg bg-[#5865f2] hover:bg-[#4752c4] transition-colors px-4 py-2.5 text-sm font-medium text-white"
              >
                Send Message
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-[#2f3136] hover:bg-[#40444b] transition-colors px-4 py-2.5 text-sm font-medium text-white border border-black/20"
                >
                  Add Friend
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-[#2f3136] hover:bg-[#40444b] transition-colors px-4 py-2.5 text-sm font-medium text-white border border-black/20"
                >
                  Block
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
