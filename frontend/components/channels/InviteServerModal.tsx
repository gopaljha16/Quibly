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
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] rounded-[4px] bg-[#1a1510] shadow-2xl overflow-hidden animate-scale-in">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-[#F2F3F5] uppercase truncate pr-4">Invite friends to {server.name || 'Server'}</h2>
              <button
                onClick={onClose}
                className="text-[#B5BAC1] hover:text-[#DBDEE1] transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                  <path fillRule="evenodd" clipRule="evenodd" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-[#B5BAC1] uppercase mb-2">
                Send a server invite link to a friend
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2.5 rounded-[3px] bg-[#0d0805] text-[#DBDEE1] text-sm outline-none font-medium"
                />
                <button
                  onClick={copyToClipboard}
                  className={`px-6 py-2.5 rounded-[3px] text-sm font-medium transition-all duration-200 min-w-[75px] ${copied
                    ? 'bg-[#23A559] text-white'
                    : 'bg-gradient-to-r from-[#f3c178] to-[#f35e41] hover:from-[#e0a850] hover:to-[#e0442a] text-[#0b0500] font-bold'
                    }`}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="border-t border-[#3F4147] pt-4 mt-4">
              <div className="text-xs text-[#B5BAC1]">
                Your invite link expires in 7 days. <a href="#" className="text-[#f3c178] hover:underline">Edit invite link</a>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}