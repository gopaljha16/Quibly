'use client'

import { useEffect, useState } from 'react'
import { apiRequest, ApiError } from '@/lib/api'

type Server = {
  _id: string
  name?: string
  description?: string
  icon?: string | null
  banner?: string | null
  isPublic?: boolean
  verificationLevel?: 'none' | 'low' | 'medium' | 'high'
  ownerId?: string
  membersCount?: number
}

export default function ServerSettingsModal({
  open,
  onClose,
  server,
  onUpdate,
}: {
  open: boolean
  onClose: () => void
  server: Server | null
  onUpdate: (updatedServer: Server) => void
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    banner: '',
    isPublic: false,
    verificationLevel: 'none' as 'none' | 'low' | 'medium' | 'high'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name || '',
        description: server.description || '',
        icon: server.icon || '',
        banner: server.banner || '',
        isPublic: server.isPublic || false,
        verificationLevel: server.verificationLevel || 'none'
      })
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

  const handleSave = async () => {
    if (!server) return
    
    setSaving(true)
    setError(null)
    
    try {
      const response = await apiRequest<{ success: boolean; server: Server }>(`/server/${server._id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      })
      
      onUpdate(response.server)
      onClose()
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
      } else {
        setError('Failed to update server')
      }
    } finally {
      setSaving(false)
    }
  }

  if (!open || !server) return null

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '⚙️' },
    { id: 'moderation', name: 'Moderation', icon: '🛡️' },
    { id: 'members', name: 'Members', icon: '👥' },
    { id: 'roles', name: 'Roles', icon: '🏷️' },
    { id: 'channels', name: 'Channels', icon: '#️⃣' },
    { id: 'integrations', name: 'Integrations', icon: '🔗' },
  ]

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[600px] rounded-xl bg-[#36393f] border border-black/20 shadow-2xl overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-60 bg-[#2f3136] border-r border-black/20 flex flex-col">
            <div className="p-4 border-b border-black/20">
              <h2 className="text-lg font-semibold text-white">{server.name}</h2>
              <p className="text-sm text-white/60">Server Settings</p>
            </div>
            
            <div className="flex-1 overflow-auto p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-3 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#5865f2] text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
            
            <div className="p-4 border-t border-black/20">
              <button
                onClick={onClose}
                className="w-full px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-sm text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-black/20">
              <h3 className="text-xl font-semibold text-white capitalize">{activeTab}</h3>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {error && (
                <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
                  {error}
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Server Icon */}
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Server Icon</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                        {formData.icon ? (
                          <img src={formData.icon} alt="Server icon" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          (server.name || 'S').slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Icon URL"
                          value={formData.icon}
                          onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                          className="w-64 px-3 py-2 rounded bg-[#40444b] border border-black/20 text-white text-sm outline-none focus:border-[#5865f2]"
                        />
                        <p className="text-xs text-white/60 mt-1">Recommended size: 128x128px</p>
                      </div>
                    </div>
                  </div>

                  {/* Server Name */}
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Server Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded bg-[#40444b] border border-black/20 text-white outline-none focus:border-[#5865f2]"
                      maxLength={100}
                    />
                  </div>

                  {/* Server Description */}
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 rounded bg-[#40444b] border border-black/20 text-white outline-none focus:border-[#5865f2] resize-none"
                      rows={3}
                      maxLength={300}
                      placeholder="Tell people what your server is about"
                    />
                    <p className="text-xs text-white/60 mt-1">{formData.description.length}/300</p>
                  </div>

                  {/* Server Banner */}
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Server Banner</label>
                    <input
                      type="text"
                      placeholder="Banner URL"
                      value={formData.banner}
                      onChange={(e) => setFormData(prev => ({ ...prev, banner: e.target.value }))}
                      className="w-full px-3 py-2 rounded bg-[#40444b] border border-black/20 text-white text-sm outline-none focus:border-[#5865f2]"
                    />
                    <p className="text-xs text-white/60 mt-1">Recommended size: 960x540px</p>
                  </div>

                  {/* Privacy Settings */}
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Privacy Settings</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={formData.isPublic}
                          onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                          className="w-4 h-4 rounded border-2 border-white/20 bg-[#40444b] checked:bg-[#5865f2] checked:border-[#5865f2]"
                        />
                        <div>
                          <div className="text-white text-sm">Public Server</div>
                          <div className="text-white/60 text-xs">Allow anyone to join this server</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Verification Level */}
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Verification Level</label>
                    <select
                      value={formData.verificationLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, verificationLevel: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded bg-[#40444b] border border-black/20 text-white outline-none focus:border-[#5865f2]"
                    >
                      <option value="none">None - No verification required</option>
                      <option value="low">Low - Must have verified email</option>
                      <option value="medium">Medium - Must be registered for 5+ minutes</option>
                      <option value="high">High - Must be a member for 10+ minutes</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'moderation' && (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛡️</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Moderation Settings</h3>
                    <p className="text-white/60">Configure auto-moderation, filters, and member management</p>
                    <p className="text-white/40 text-sm mt-2">Coming soon...</p>
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Member Management</h3>
                    <p className="text-white/60">View and manage server members, bans, and invites</p>
                    <p className="text-white/40 text-sm mt-2">Coming soon...</p>
                  </div>
                </div>
              )}

              {activeTab === 'roles' && (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏷️</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Roles & Permissions</h3>
                    <p className="text-white/60">Create and manage roles with custom permissions</p>
                    <p className="text-white/40 text-sm mt-2">Coming soon...</p>
                  </div>
                </div>
              )}

              {activeTab === 'channels' && (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">#️⃣</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Channel Management</h3>
                    <p className="text-white/60">Organize channels into categories and set permissions</p>
                    <p className="text-white/40 text-sm mt-2">Coming soon...</p>
                  </div>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔗</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Integrations</h3>
                    <p className="text-white/60">Connect bots, webhooks, and external services</p>
                    <p className="text-white/40 text-sm mt-2">Coming soon...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {activeTab === 'overview' && (
              <div className="p-6 border-t border-black/20 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded bg-transparent hover:bg-white/5 text-white transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.name.trim()}
                  className="px-4 py-2 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}