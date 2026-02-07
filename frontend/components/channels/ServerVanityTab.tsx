'use client'

import { useState, useEffect } from 'react'
import { apiRequest, ApiError } from '@/lib/api'

export default function ServerVanityTab({ serverId, currentVanityUrl }: { serverId: string; currentVanityUrl?: string | null }) {
  const [vanityUrl, setVanityUrl] = useState(currentVanityUrl || '')
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setVanityUrl(currentVanityUrl || '')
  }, [currentVanityUrl])

  const checkAvailability = async (url: string) => {
    if (!url || url === currentVanityUrl) {
      setAvailable(null)
      return
    }

    // Validate format
    const vanityRegex = /^[a-zA-Z0-9_-]{3,32}$/
    if (!vanityRegex.test(url)) {
      setAvailable(false)
      setError('Must be 3-32 characters (letters, numbers, hyphens, underscores)')
      return
    }

    setChecking(true)
    setError(null)

    try {
      const response = await apiRequest<{ success: boolean; available: boolean }>(
        `/server/vanity/${url}/check`
      )
      setAvailable(response.available)
      if (!response.available) {
        setError('This vanity URL is already taken')
      }
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
        setAvailable(false)
      }
    } finally {
      setChecking(false)
    }
  }

  const handleVanityChange = (value: string) => {
    setVanityUrl(value)
    setAvailable(null)
    setError(null)
    setSuccess(false)

    // Debounce check
    const timer = setTimeout(() => {
      if (value && value !== currentVanityUrl) {
        checkAvailability(value)
      }
    }, 500)

    return () => clearTimeout(timer)
  }

  const handleSave = async () => {
    if (!vanityUrl || vanityUrl === currentVanityUrl) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await apiRequest(`/server/${serverId}/vanity-url`, {
        method: 'PUT',
        body: JSON.stringify({ vanityUrl })
      })
      setSuccess(true)
      setAvailable(null)
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
      } else {
        setError('Failed to set vanity URL')
      }
    } finally {
      setSaving(false)
    }
  }

  const inviteUrl = vanityUrl 
    ? `${window.location.origin}/invite/${vanityUrl}`
    : currentVanityUrl 
    ? `${window.location.origin}/invite/${currentVanityUrl}`
    : 'Not set'

  return (
    <div className="max-w-[600px]">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Vanity URL</h2>
        <p className="text-sm text-slate-400">
          Create a custom invite link for your server that's easy to remember and share.
        </p>
      </div>

      <div className="bg-[#2B2D31] p-4 rounded-lg mb-6">
        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
          Custom URL
        </label>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 flex items-center bg-[#1E1F22] rounded-[3px] overflow-hidden">
            <span className="px-3 py-2.5 text-slate-400 text-sm bg-[#0a0b0f]">
              {window.location.origin}/invite/
            </span>
            <input
              type="text"
              value={vanityUrl}
              onChange={(e) => handleVanityChange(e.target.value.toLowerCase())}
              placeholder="my-awesome-server"
              className="flex-1 bg-transparent text-white px-3 py-2.5 outline-none text-sm"
              maxLength={32}
            />
          </div>
          
          {checking && (
            <div className="text-slate-400">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
          
          {available === true && (
            <div className="text-green-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          )}
          
          {available === false && (
            <div className="text-red-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-400 mt-2">{error}</div>
        )}

        {available === true && (
          <div className="text-xs text-green-400 mt-2">✓ This vanity URL is available!</div>
        )}

        {success && (
          <div className="text-xs text-green-400 mt-2">✓ Vanity URL updated successfully!</div>
        )}

        <div className="text-xs text-slate-500 mt-2">
          3-32 characters. Letters, numbers, hyphens, and underscores only.
        </div>
      </div>

      <div className="bg-[#2B2D31] p-4 rounded-lg mb-6">
        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Current Invite Link</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[#1E1F22] px-3 py-2 rounded-[3px] text-sm text-slate-300 font-mono truncate">
            {inviteUrl}
          </div>
          {(vanityUrl || currentVanityUrl) && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl)
              }}
              className="px-3 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-[3px] text-sm font-medium transition-colors"
            >
              Copy
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !vanityUrl || vanityUrl === currentVanityUrl || available !== true}
          className="px-6 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-[3px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Vanity URL'}
        </button>
      </div>
    </div>
  )
}
