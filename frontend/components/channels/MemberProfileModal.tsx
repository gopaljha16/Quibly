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
        <div className="w-full max-w-md rounded-2xl bg-[#1f232a] border border-white/10 shadow-2xl overflow-hidden">
          <div className="h-24 bg-[#2b313a]" />

          <div className="px-5 pb-5">
            <div className="-mt-10 flex items-end justify-between">
              <div className="w-20 h-20 rounded-full bg-[#11151b] border-4 border-[#1f232a] flex items-center justify-center text-2xl font-bold">
                {initials}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-white/70"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-2">
                <div className="text-xl font-bold text-white">{user.username}</div>
                {isOwner && <div title="Server Owner">👑</div>}
              </div>
              <div className="text-sm text-white/70">
                {user.username}
                {user.discriminator ? `#${user.discriminator}` : ''}
              </div>

              {(user.bio || user.customStatus) && (
                <div className="mt-3 rounded-xl bg-black/20 border border-white/10 p-3">
                  {user.customStatus && (
                    <div className="text-sm text-white/80">{user.customStatus}</div>
                  )}
                  {user.bio && (
                    <div className="text-sm text-white/70 mt-1">{user.bio}</div>
                  )}
                </div>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  className="w-full rounded-lg bg-[#5865f2] hover:bg-[#4752c4] transition-colors px-4 py-2 text-sm font-medium"
                >
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
