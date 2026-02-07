'use client'

import { useEffect, useState } from 'react'
import { useCreateServerController } from '@/controllers/channels/useCreateServerController'
import ServerTemplatesModal from './ServerTemplatesModal'

export default function CreateServerModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [showTemplates, setShowTemplates] = useState(false)
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
      setShowTemplates(false)
    }
  }, [open])

  const handleServerCreated = (server: any) => {
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-black/70"
          onClick={() => {
            if (!isLoading) onClose()
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-[440px] rounded-[4px] bg-[#313338] shadow-2xl overflow-hidden animate-scale-in">
            <div className="px-6 pt-6 pb-2 text-center">
              <h2 className="text-2xl font-bold text-[#F2F3F5] mb-2">Create Your Server</h2>
              <p className="text-slate-400 text-sm mb-4">
                Your server is where you and your friends hang out. Make yours and start talking.
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
              {/* Template Option */}
              <button
                type="button"
                onClick={() => setShowTemplates(true)}
                className="w-full mb-3 p-4 bg-[#2B2D31] hover:bg-[#35373C] rounded-lg transition-colors text-left group border-2 border-transparent hover:border-[#5865F2]"
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📋</div>
                  <div className="flex-1">
                    <div className="text-white font-semibold group-hover:text-[#5865F2] transition-colors">
                      Start from a Template
                    </div>
                    <div className="text-sm text-slate-400">
                      Choose a pre-configured setup
                    </div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-slate-400 group-hover:text-white transition-colors">
                    <path d="M9.29 6.71a.996.996 0 0 0 0 1.41L13.17 12l-3.88 3.88a.996.996 0 1 0 1.41 1.41l4.59-4.59a.996.996 0 0 0 0-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z"/>
                  </svg>
                </div>
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-[#3F4147]" />
                <span className="text-xs text-slate-500 uppercase font-bold">Or</span>
                <div className="flex-1 h-px bg-[#3F4147]" />
              </div>

              {error && (
                <div className="mb-4 rounded bg-[#F23F43] p-2 text-xs font-medium text-white shadow-sm text-left">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4 text-left">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Server Name
                  </label>
                  <input
                    value={serverName}
                    onChange={(e) => handleChange(e.target.value)}
                    className="w-full rounded-[3px] bg-[#1E1F22] p-2.5 text-slate-50 outline-none font-medium placeholder-[#87898C]"
                    placeholder="My Server"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                <div className="text-[10px] text-slate-500 text-left mb-4">
                  By creating a server, you agree to the Community Guidelines.
                </div>

                <div className="flex justify-between items-center pt-2">
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
                    className="px-6 py-2.5 rounded-[3px] text-sm font-medium bg-[#5865F2] hover:bg-[#4752C4] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !serverName.trim()}
                  >
                    {isLoading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <ServerTemplatesModal
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onServerCreated={handleServerCreated}
      />
    </>
  )
}
