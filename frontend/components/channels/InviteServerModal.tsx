'use client'

import { useEffect, useState } from 'react'

export default function InviteServerModal({
  open,
  onClose,
  server,
}: {
  open: boolean
  onClose: () => void
  server: { _id: string; name?: string } | null
}) {
  const [copied, setCopied] = useState(false)
  const [inviteLink, setInviteLink] = useState('')

  useEffect(() => {
    if (server) {
      // Generate invite link (you can customize this based on your app's URL structure)
      const baseUrl = window.location.origin
      setInviteLink(`${baseUrl}/invite/${server._id}`)
    }
  }, [server])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!open || !server) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-[#36393f] border border-black/20 shadow-2xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Invite friends to {server.name || 'Server'}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-white/70"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" className="fill-current">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Send a server invite link to a friend
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2 rounded bg-[#40444b] border border-black/20 text-white text-sm outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-white/60">
                Your invite link expires in 7 days. You can create a new one anytime.
              </div>
              
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 rounded bg-[#2f3136] hover:bg-[#40444b] text-white text-sm transition-colors border border-black/20">
                  Edit Invite
                </button>
                <button className="flex-1 px-4 py-2 rounded bg-[#2f3136] hover:bg-[#40444b] text-white text-sm transition-colors border border-black/20">
                  Create New
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}