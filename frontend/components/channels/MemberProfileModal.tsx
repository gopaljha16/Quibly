'use client'

import { useEffect } from 'react'

type MemberUser = {
  _id: string
  username: string
  discriminator: string
  avatar?: string | null
  banner?: string | null
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
  roleIds,
  roles,
}: {
  open: boolean
  onClose: () => void
  user: MemberUser | null
  isOwner: boolean
  roleIds?: string[]
  roles?: Array<{ id: string, name: string, color: string | null }>
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
          <div className="h-[60px] relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-600">
            {user.banner && (
              <img
                src={user.banner}
                alt="Profile Banner"
                className="w-full h-full object-cover"
              />
            )}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 transition-colors flex items-center justify-center text-white/80 z-10"
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
                <div 
                  className="text-lg font-bold"
                  style={{ color: isOwner ? '#F0B232' : '#F2F3F5' }}
                >
                  {user.username}
                </div>
                {isOwner && (
                  <svg className="w-3.5 h-3.5 text-[#f0b232]" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.6572 5.42868C13.8879 5.29002 14.1806 5.30402 14.3973 5.46468C14.6133 5.62602 14.7119 5.90068 14.6473 6.16202L13.3139 11.4954C13.2393 11.7927 12.9726 12.0007 12.6666 12.0007H3.33325C3.02725 12.0007 2.76058 11.7927 2.68592 11.4954L1.35258 6.16202C1.28792 5.90068 1.38658 5.62602 1.60258 5.46468C1.81992 5.30468 2.11192 5.29068 2.34325 5.42868L5.13192 7.10202L7.44592 3.63068C7.46173 3.60697 7.48026 3.5853 7.50125 3.56602C7.62192 3.45535 7.78058 3.39002 7.94525 3.38202H8.05458C8.21925 3.39002 8.37792 3.45535 8.49925 3.56602C8.52024 3.5853 8.53877 3.60697 8.55458 3.63068L10.8686 7.10202L13.6572 5.42868ZM2.66667 13.334H13.3333V14.6673H2.66667V13.334Z" />
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

            {/* Roles Section */}
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-400 uppercase mb-2">Roles</div>
              <div className="flex flex-wrap gap-1">
                {(roles || []).filter(r => roleIds?.includes(r.id)).map(role => (
                  <div 
                    key={role.id}
                    className="flex items-center gap-1.5 px-2 py-1 bg-[#2B2D31] rounded-[4px] border border-[#1E1F22]"
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color || '#99AAB5' }} />
                    <span className="text-xs font-medium text-slate-50">{role.name}</span>
                  </div>
                ))}
                {isOwner && !(roles || []).some(r => r.name === 'Owner' && roleIds?.includes(r.id)) && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-[#2B2D31] rounded-[4px] border border-[#1E1F22]">
                    <div className="w-3 h-3 rounded-full bg-[#F0B232]" />
                    <span className="text-xs font-medium text-slate-50">Owner</span>
                  </div>
                )}
                {(roles || []).filter(r => roleIds?.includes(r.id)).length === 0 && !isOwner && (
                  <span className="text-xs text-slate-500 italic">No roles assigned</span>
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
