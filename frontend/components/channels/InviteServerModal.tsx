'use client'

import { useEffect, useState } from 'react'
import { useChannelsData } from '@/hooks/useChannelsData'

export default function InviteServerModal({
  open,
  onClose,
  server,
}: {
  open: boolean
  onClose: () => void
  server: { _id: string; name?: string } | null
}) {
  const { createInvite } = useChannelsData()
  const [copied, setCopied] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset invite code when server changes or modal closes
  useEffect(() => {
    setInviteCode('')
    setCopied(false)
  }, [server?._id, open])

  useEffect(() => {
    if (server && open && !inviteCode && !loading) {
      const getInvite = async () => {
        setLoading(true)
        try {
          const invite = await createInvite(server._id, { expiresInDays: 7 })
          setInviteCode(invite.code)
        } catch (error) {
          console.error('Failed to create invite:', error)
        } finally {
          setLoading(false)
        }
      }
      getInvite()
    }
  }, [server, open, inviteCode, createInvite, loading])

  const inviteLink = inviteCode ? `${window.location.origin}/invite/${inviteCode}` : 'Generating...'

  const copyToClipboard = async () => {
    if (!inviteCode) return
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
        <div className="w-full max-w-[440px] rounded-lg bg-[#1a1a1c] border border-white/10 shadow-2xl overflow-hidden animate-scale-in">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-[#F2F3F5] uppercase truncate pr-4">Invite friends to {server.name || 'Server'}</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-50 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                  <path fillRule="evenodd" clipRule="evenodd" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                Send a server invite link to a friend
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2.5 rounded-md bg-white/5 border border-white/10 text-slate-50 text-sm outline-none font-medium focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/20 transition-all"
                />
                <button
                  onClick={copyToClipboard}
                  className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 min-w-[75px] ${copied
                    ? 'bg-[#23A559] text-white'
                    : 'bg-[#5865F2] hover:bg-[#4752C4] text-white'
                    }`}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mt-4">
              <div className="text-xs text-slate-400">
                Your invite link expires in 7 days. <a href="#" className="text-[#5865f2] hover:underline">Edit invite link</a>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}