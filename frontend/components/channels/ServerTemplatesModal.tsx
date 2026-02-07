'use client'

import { useState, useEffect } from 'react'
import { apiRequest, ApiError } from '@/lib/api'

type Template = {
  id: string
  name: string
  description: string
  category: string
  icon: string
  channels: any[]
  roles: any[]
  settings: any
  isOfficial: boolean
  usageCount: number
}

export default function ServerTemplatesModal({
  open,
  onClose,
  onServerCreated,
}: {
  open: boolean
  onClose: () => void
  onServerCreated: (server: any) => void
}) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [serverName, setServerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'customize'>('select')

  useEffect(() => {
    if (open) {
      fetchTemplates()
    }
  }, [open])

  const fetchTemplates = async () => {
    try {
      const response = await apiRequest<{ success: boolean; templates: Template[] }>('/server/templates')
      setTemplates(response.templates)
    } catch (e) {
      console.error('Failed to fetch templates:', e)
    }
  }

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setServerName(`My ${template.name}`)
    setStep('customize')
  }

  const handleCreateServer = async () => {
    if (!selectedTemplate || !serverName.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiRequest<{ success: boolean; server: any }>('/server/templates/create-server', {
        method: 'POST',
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          name: serverName.trim()
        })
      })

      onServerCreated(response.server)
      onClose()
      resetModal()
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
      } else {
        setError('Failed to create server')
      }
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setStep('select')
    setSelectedTemplate(null)
    setServerName('')
    setError(null)
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      setTimeout(resetModal, 300)
    }
  }

  if (!open) return null

  const categories = Array.from(new Set(templates.map(t => t.category)))

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[600px] bg-[#313338] rounded-lg shadow-xl overflow-hidden animate-scale-in">
          
          {step === 'select' && (
            <>
              <div className="p-6 border-b border-[#3F4147]">
                <h2 className="text-2xl font-bold text-white mb-2">Choose a Template</h2>
                <p className="text-slate-400 text-sm">Start with a pre-configured server setup</p>
              </div>

              <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                {categories.map(category => (
                  <div key={category} className="mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">{category}</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {templates.filter(t => t.category === category).map(template => (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className="flex items-start gap-4 p-4 bg-[#2B2D31] hover:bg-[#35373C] rounded-lg transition-colors text-left group"
                        >
                          <div className="text-4xl flex-shrink-0">{template.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-white font-semibold group-hover:text-[#00B0F4] transition-colors">
                                {template.name}
                              </h4>
                              {template.isOfficial && (
                                <span className="text-[10px] bg-[#5865F2] text-white px-2 py-0.5 rounded-full font-bold">
                                  OFFICIAL
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 mb-2">{template.description}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{template.channels.length} channels</span>
                              <span>•</span>
                              <span>{template.roles.length} roles</span>
                              {template.usageCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{template.usageCount.toLocaleString()} uses</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-slate-400 group-hover:text-white transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9.29 6.71a.996.996 0 0 0 0 1.41L13.17 12l-3.88 3.88a.996.996 0 1 0 1.41 1.41l4.59-4.59a.996.996 0 0 0 0-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z"/>
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-[#2B2D31] flex justify-between items-center">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white hover:underline"
                >
                  Skip & Create Blank
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white hover:underline"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {step === 'customize' && selectedTemplate && (
            <>
              <div className="p-6 border-b border-[#3F4147]">
                <button
                  onClick={() => setStep('select')}
                  className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                  </svg>
                  Back to templates
                </button>
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{selectedTemplate.icon}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedTemplate.name}</h2>
                    <p className="text-slate-400 text-sm">{selectedTemplate.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Server Name
                  </label>
                  <input
                    type="text"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    placeholder="Enter server name"
                    className="w-full bg-[#1E1F22] text-white p-3 rounded-[3px] border-none outline-none"
                    maxLength={100}
                  />
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold text-white mb-3">What's Included</h3>
                  
                  <div className="space-y-3">
                    <div className="bg-[#2B2D31] p-3 rounded-lg">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-2">Channels</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.channels.map((channel, i) => (
                          <span key={i} className="text-xs bg-[#1E1F22] text-slate-300 px-2 py-1 rounded">
                            {channel.type === 'VOICE' ? '🔊' : channel.type === 'ANNOUNCEMENT' ? '📢' : channel.type === 'RULES' ? '📜' : '#'} {channel.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#2B2D31] p-3 rounded-lg">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-2">Roles</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.roles.map((role, i) => (
                          <span key={i} className="text-xs bg-[#1E1F22] text-slate-300 px-2 py-1 rounded">
                            {role.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-[#F23F43]/10 border border-[#F23F43] rounded text-sm text-[#F23F43]">
                    {error}
                  </div>
                )}
              </div>

              <div className="p-4 bg-[#2B2D31] flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white hover:underline"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateServer}
                  disabled={loading || !serverName.trim()}
                  className="px-6 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-[3px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Server'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
