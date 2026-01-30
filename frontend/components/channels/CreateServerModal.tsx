'use client'

import { useEffect } from 'react'
import { useCreateServerController } from '@/controllers/channels/useCreateServerController'

export default function CreateServerModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const {
    serverName,
    error,
    isLoading,
    handleChange,
    handleSubmit,
  } = useCreateServerController(onClose)

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
        <form onSubmit={handleSubmit} className="w-full max-w-[440px] rounded-[4px] bg-[#1a1510] shadow-2xl overflow-hidden animate-scale-in text-center">
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-2xl font-bold text-[#F2F3F5] mb-2">Create Your Server</h2>
            <p className="text-[#B5BAC1] text-sm mb-4">
              Your server is where you and your friends hang out. Make yours and start talking.
            </p>
            <button
              type="button"
              onClick={() => {
                if (!isLoading) onClose()
              }}
              className="absolute top-4 right-4 text-[#B5BAC1] hover:text-[#DBDEE1] transition-colors"
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
              <label className="block text-xs font-bold text-[#B5BAC1] uppercase mb-2">
                Server Name
              </label>
              <input
                value={serverName}
                onChange={(e) => handleChange(e.target.value)}
                className="w-full rounded-[3px] bg-[#0d0805] p-2.5 text-[#DBDEE1] outline-none font-medium placeholder-[#87898C]"
                placeholder="My Server"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="text-[10px] text-[#949BA4] text-left mb-4">
              By creating a server, you agree to Discord's <a href="#" className="text-[#f3c178] hover:underline">Community Guidelines</a>.
            </div>
          </div>

          <div className="bg-[#0d0805] p-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                if (!isLoading) onClose()
              }}
              className="text-sm font-medium text-[#DBDEE1] hover:underline transition-colors"
              disabled={isLoading}
            >
              Back
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-[3px] text-sm font-medium bg-gradient-to-r from-[#f3c178] to-[#f35e41] hover:from-[#e0a850] hover:to-[#e0442a] text-[#0b0500] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !serverName.trim()}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
