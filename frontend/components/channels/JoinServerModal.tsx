'use client'

import { useEffect } from 'react'
import { useJoinServerController } from '@/controllers/channels/useJoinServerController'

export default function JoinServerModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const {
    inviteCode,
    error,
    isLoading,
    handleChange,
    handleSubmit,
  } = useJoinServerController(onClose)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      handleChange('')
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={() => {
          if (!isLoading) onClose()
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="w-full max-w-[440px] rounded-[4px] bg-[#12131a] shadow-2xl overflow-hidden animate-scale-in text-center">
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-2xl font-bold text-[#F2F3F5] mb-2">Join a Server</h2>
            <p className="text-slate-400 text-sm mb-4">
              Enter an invite below to join an existing server
            </p>
            <button
              type="button"
              onClick={() => {
                if (!isLoading) onClose()
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-50 transition-colors"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                <path fillRule="evenodd" clipRule="evenodd" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
              </svg>
            </button>
          </div>

          <div className="px-4 pb-4">
            {error && (
              <div className="mb-4 rounded bg-[#F23F43] p-2 text-xs font-medium text-white shadow-sm text-left">
                {error}
              </div>
            )}

            <div className="mb-4 text-left">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                Invite Link *
              </label>
              <input
                value={inviteCode}
                onChange={(e) => handleChange(e.target.value)}
                className="w-full rounded-[3px] bg-[#12131a] p-2.5 text-slate-50 outline-none font-medium placeholder-[#87898C]"
                placeholder="https://discord.gg/hTKzmak"
                disabled={isLoading}
                autoFocus
              />
              <div className="mt-2 text-xs text-slate-500">
                Invites should look like <span className="font-mono text-slate-50">hTKzmak</span>, <span className="font-mono text-slate-50">https://discord.gg/hTKzmak</span>, or <span className="font-mono text-slate-50">https://discord.com/invite/hTKzmak</span>.
              </div>
            </div>
          </div>

          <div className="bg-[#12131a] p-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                if (!isLoading) onClose()
              }}
              className="text-sm font-medium text-slate-50 hover:underline transition-colors"
              disabled={isLoading}
            >
              Back
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-[3px] text-sm font-medium bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-[#0b0500] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !inviteCode.trim()}
            >
              {isLoading ? 'Joining...' : 'Join Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
