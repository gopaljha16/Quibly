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
    online: 'bg-[#23a559]',
    idle: 'bg-[#f0b232]',
    dnd: 'bg-[#f23f43]',
    offline: 'bg-[#80848e]'
  }

  return (
    <div className={`w-4 h-4 rounded-full border-2 border-[#232428] ${statusColors[status || 'offline']}`} />
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
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[340px] rounded-[8px] bg-[#12131a] shadow-2xl overflow-hidden animate-scale-in relative">
          {/* Banner */}
          <div className="h-[60px] bg-gradient-to-r from-cyan-500 to-purple-600 relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 transition-colors flex items-center justify-center text-white/80"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="fill-current">
                <path fillRule="evenodd" clipRule="evenodd" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
              </svg>
            </button>
          </div>

          <div className="px-4 pb-4">
            {/* Avatar */}
            <div className="-mt-[40px] mb-3 relative inline-block">
              <div className="w-[80px] h-[80px] rounded-full border-[6px] border-[#232428] bg-[#1E1F22] flex items-center justify-center text-3xl font-bold text-white overflow-hidden relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                    {initials}
                  </div>
                )}
              </div>
              <div className="absolute bottom-1 right-1 rounded-full bg-[#232428] p-[4px]">
                <StatusIndicator status={user.status} />
              </div>
            </div>

            {/* User Info */}
            <div className="mb-4 bg-[#0a0b0f] rounded-[8px] p-3 border border-cyan-500/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-lg font-bold text-[#F2F3F5]">{user.username}</div>
                {isOwner && (
                  <svg className="w-4 h-4 text-[#F0B232]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L1 21H23L12 2ZM12 6L19.53 19H4.47L12 6Z" />
                  </svg>
                )}
              </div>
              <div className="text-sm text-slate-400 font-medium">#{user.discriminator}</div>

              {user.customStatus && (
                <div className="mt-2 text-sm text-slate-50">
                  {user.customStatus}
                </div>
              )}
            </div>

            <div className="h-[1px] bg-[#3F4147] mb-3" />

            {/* About Me Section */}
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-400 uppercase mb-2">About Me</div>
              <div className="text-sm text-slate-50 leading-relaxed whitespace-pre-wrap">
                {user.bio || 'Just another discord user.'}
              </div>
            </div>

            {/* Roles Section - Placeholder */}
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-400 uppercase mb-2">Roles</div>
              <div className="flex flex-wrap gap-1">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-[#2B2D31] rounded-[4px] border border-[#1E1F22]">
                  <div className="w-3 h-3 rounded-full bg-[#99AAB5]" />
                  <span className="text-xs font-medium text-slate-50">Member</span>
                </div>
                {isOwner && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-[#12131a] rounded-[4px] border border-[#0d0805]">
                    <div className="w-3 h-3 rounded-full bg-[#F0B232]" />
                    <span className="text-xs font-medium text-slate-50">Owner</span>
                  </div>
                )}
              </div>
            </div>

            {/* Note Section */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase mb-2">Note</div>
              <textarea
                className="w-full bg-[#111214] text-slate-50 text-xs p-2 rounded-[3px] border-none outline-none resize-none h-[36px] placeholder-[#5C5E66] focus:h-[60px] transition-all duration-200"
                placeholder="Click to add a note"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
