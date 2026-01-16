'use client'

import { useEffect, useState } from 'react'

export default function CreateChannelModal({
  open,
  onClose,
  onCreate,
  loading,
  error,
}: {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => void
  loading: boolean
  error: string | null
}) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => {
          if (!loading) onClose()
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-[#1f232a] border border-white/10 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <div className="text-lg font-bold text-white">Create Channel</div>
              <div className="text-sm text-white/60">Add a new text channel</div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!loading) onClose()
              }}
              className="w-9 h-9 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-white/70"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="px-5 py-4">
            {error && (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <label className="block text-xs font-semibold text-white/60 mb-2">
              CHANNEL NAME
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-white outline-none focus:border-[#5865f2]"
              placeholder="general"
              disabled={loading}
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!loading) onClose()
                }}
                className="px-4 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onCreate(name.trim())}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#5865f2] hover:bg-[#4752c4] transition-colors disabled:opacity-50"
                disabled={loading || !name.trim()}
              >
                {loading ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
