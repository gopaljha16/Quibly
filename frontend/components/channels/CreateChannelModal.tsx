'use client'

import { useEffect, useState } from 'react'
import { useCreateChannelController } from '@/controllers/channels/useCreateChannelController'
import { useChannelsData } from '@/hooks/useChannelsData'

export default function CreateChannelModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [channelType, setChannelType] = useState<'TEXT' | 'VOICE'>('TEXT')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  
  const { roles } = useChannelsData()
  
  const {
    channelName,
    error,
    isLoading,
    handleChange,
    handleSubmit,
  } = useCreateChannelController(onClose, channelType, isPrivate, isReadOnly, selectedRoles)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      handleChange('')
      setChannelType('TEXT')
      setIsPrivate(false)
      setIsReadOnly(false)
      setSelectedRoles([])
    }
  }, [open])

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    )
  }

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
        <form onSubmit={handleSubmit} className="w-full max-w-[460px] rounded-[4px] bg-[#313338] shadow-2xl overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="text-lg font-bold text-[#F2F3F5] px-2">Create Channel</div>
            <button
              type="button"
              onClick={() => {
                if (!isLoading) onClose()
              }}
              className="text-slate-400 hover:text-slate-50 transition-colors"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                <path fillRule="evenodd" clipRule="evenodd" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
              </svg>
            </button>
          </div>

          <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-4 rounded bg-[#F23F43] p-2 text-xs font-medium text-white shadow-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">
                Channel Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setChannelType('TEXT')}
                  className={`flex-1 flex items-center gap-2 p-3 rounded-[3px] transition-colors ${
                    channelType === 'TEXT'
                      ? 'bg-[#404249] border-2 border-[#5865f2]'
                      : 'bg-[#2b2d31] border-2 border-transparent hover:border-[#5865f2]/50'
                  }`}
                  disabled={isLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current text-[#b5bac1]">
                    <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41001 9L8.35001 15H14.35L15.41 9H9.41001Z" />
                  </svg>
                  <span className="text-sm font-medium text-[#f2f3f5]">Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannelType('VOICE')}
                  className={`flex-1 flex items-center gap-2 p-3 rounded-[3px] transition-colors ${
                    channelType === 'VOICE'
                      ? 'bg-[#404249] border-2 border-[#5865f2]'
                      : 'bg-[#2b2d31] border-2 border-transparent hover:border-[#5865f2]/50'
                  }`}
                  disabled={isLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current text-[#b5bac1]">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 6C9.79 6 8 7.79 8 10V14C8 16.21 9.79 18 12 18C14.21 18 16 16.21 16 14V10C16 7.79 14.21 6 12 6Z" />
                  </svg>
                  <span className="text-sm font-medium text-[#f2f3f5]">Voice</span>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">
                Channel Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b5bac1]">
                  {channelType === 'TEXT' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current">
                      <path fillRule="evenodd" clipRule="evenodd" d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39657 3.41262C8.43914 3.17316 8.63877 3 8.87663 3H9.87663C10.1877 3 10.4233 3.28107 10.3689 3.58738L9.76001 7H15.76L16.3966 3.41262C16.4391 3.17316 16.6388 3 16.8766 3H17.8766C18.1877 3 18.4233 3.28107 18.3689 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3634 20.5874C15.3209 20.8268 15.1212 21 14.8834 21H13.8834C13.5723 21 13.3367 20.7189 13.3911 20.4126L14 17H8.00001L7.36343 20.5874C7.32086 20.8268 7.12123 21 6.88337 21H5.88657ZM9.41001 15H15.41L16.47 9H10.47L9.41001 15Z" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 6C9.79 6 8 7.79 8 10V14C8 16.21 9.79 18 12 18C14.21 18 16 16.21 16 14V10C16 7.79 14.21 6 12 6Z" />
                    </svg>
                  )}
                </div>
                <input
                  value={channelName}
                  onChange={(e) => handleChange(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full rounded-[3px] bg-[#1e1f22] p-2.5 pl-10 text-[#dbdee1] outline-none font-medium placeholder-[#87898C] border border-[#1e1f22] focus:border-[#5865f2]"
                  placeholder={channelType === 'TEXT' ? 'new-channel' : 'voice-channel'}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {/* Privacy Toggle */}
            <div className="mb-4">
              <div className="flex items-center justify-between p-3 bg-[#2b2d31] rounded-[3px]">
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current text-[#b5bac1]">
                    <path d="M17 11V7C17 4.243 14.757 2 12 2C9.243 2 7 4.243 7 7V11C5.897 11 5 11.897 5 13V20C5 21.103 5.897 22 7 22H17C18.103 22 19 21.103 19 20V13C19 11.897 18.103 11 17 11ZM12 18C11.172 18 10.5 17.328 10.5 16.5C10.5 15.672 11.172 15 12 15C12.828 15 13.5 15.672 13.5 16.5C13.5 17.328 12.828 18 12 18ZM15 11H9V7C9 5.346 10.346 4 12 4C13.654 4 15 5.346 15 7V11Z"/>
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-[#f2f3f5]">Private Channel</div>
                    <div className="text-xs text-[#b5bac1]">Only selected roles can view this channel</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPrivate(!isPrivate)
                    if (isPrivate) setSelectedRoles([])
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    isPrivate ? 'bg-[#5865f2]' : 'bg-[#4e5058]'
                  }`}
                  disabled={isLoading}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    isPrivate ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Read-Only Toggle */}
            <div className="mb-4">
              <div className="flex items-center justify-between p-3 bg-[#2b2d31] rounded-[3px]">
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current text-[#b5bac1]">
                    <path d="M20 2H4C2.9 2 2 2.9 2 4V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V4C22 2.9 21.1 2 20 2ZM20 18H4V4H20V18ZM18 11L14 15L12 13L10 15L6 11H18Z"/>
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-[#f2f3f5]">Read-Only Channel</div>
                    <div className="text-xs text-[#b5bac1]">Only the server owner can message in this channel</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReadOnly(!isReadOnly)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    isReadOnly ? 'bg-[#5865f2]' : 'bg-[#4e5058]'
                  }`}
                  disabled={isLoading}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    isReadOnly ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Role Selection */}
            {isPrivate && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">
                  Who can access this channel?
                </label>
                <div className="bg-[#2b2d31] rounded-[3px] p-2 max-h-40 overflow-y-auto">
                  {roles.length === 0 ? (
                    <div className="text-xs text-[#b5bac1] p-2 text-center">No roles available</div>
                  ) : (
                    <>
                      {/* Owner entry */}
                      <div className="w-full flex items-center gap-2 p-2 rounded opacity-80 cursor-default mb-1 border-b border-[#35373c] pb-2">
                        <div className="w-4 h-4 rounded border-2 flex items-center justify-center bg-[#5865f2] border-[#5865f2]">
                          <svg width="12" height="12" viewBox="0 0 24 24" className="fill-current text-white">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" title="Server Owner" />
                          <span className="text-sm text-[#f2f3f5] font-medium">Server Owner</span>
                        </div>
                      </div>

                      {roles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-[#35373c] transition-colors"
                        disabled={isLoading}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedRoles.includes(role.id)
                            ? 'bg-[#5865f2] border-[#5865f2]'
                            : 'border-[#4e5058]'
                        }`}>
                          {selectedRoles.includes(role.id) && (
                            <svg width="12" height="12" viewBox="0 0 24 24" className="fill-current text-white">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: role.color || '#99aab5' }}
                          />
                          <span className="text-sm text-[#f2f3f5]">{role.name}</span>
                        </div>
                      </button>
                      ))}
                    </>
                  )}
                </div>
                {isPrivate && selectedRoles.length === 0 && (
                  <div className="text-xs text-[#f23f43] mt-1">Please select at least one role</div>
                )}
              </div>
            )}
          </div>

          <div className="bg-[#2b2d31] p-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (!isLoading) onClose()
              }}
              className="px-4 py-2.5 text-sm font-medium text-white hover:underline transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-[3px] text-sm font-medium bg-[#5865f2] hover:bg-[#4752c4] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !channelName.trim() || (isPrivate && selectedRoles.length === 0)}
            >
              {isLoading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
