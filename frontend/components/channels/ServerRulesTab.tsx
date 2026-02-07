'use client'

import { useState, useEffect } from 'react'
import { apiRequest, ApiError } from '@/lib/api'

type Rule = {
  title: string
  description: string
}

export default function ServerRulesTab({ serverId }: { serverId: string }) {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRules()
  }, [serverId])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const response = await apiRequest<{ success: boolean; rules: Rule[] }>(
        `/server/${serverId}/rules`
      )
      setRules(response.rules || [])
    } catch (error) {
      console.error('Failed to fetch rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRule = () => {
    setRules([...rules, { title: '', description: '' }])
  }

  const handleUpdateRule = (index: number, field: 'title' | 'description', value: string) => {
    const newRules = [...rules]
    newRules[index][field] = value
    setRules(newRules)
  }

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    // Validate rules
    const validRules = rules.filter(r => r.title.trim() && r.description.trim())
    
    if (validRules.length !== rules.length) {
      setError('All rules must have a title and description')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await apiRequest(`/server/${serverId}/rules`, {
        method: 'PUT',
        body: JSON.stringify({ rules: validRules })
      })
      setRules(validRules)
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
      } else {
        setError('Failed to save rules')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading rules...</div>
      </div>
    )
  }

  return (
    <div className="max-w-[600px]">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Server Rules</h2>
        <p className="text-sm text-slate-400">
          Set clear guidelines for your community. These will be displayed in a dedicated rules channel.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {rules.map((rule, index) => (
          <div key={index} className="bg-[#2B2D31] p-4 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="text-sm font-bold text-slate-400">Rule {index + 1}</div>
              <button
                onClick={() => handleRemoveRule(index)}
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Rule Title
                </label>
                <input
                  type="text"
                  value={rule.title}
                  onChange={(e) => handleUpdateRule(index, 'title', e.target.value)}
                  placeholder="e.g., Be respectful"
                  className="w-full bg-[#1E1F22] text-white p-2.5 rounded-[3px] text-sm"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Description
                </label>
                <textarea
                  value={rule.description}
                  onChange={(e) => handleUpdateRule(index, 'description', e.target.value)}
                  placeholder="Explain this rule in detail..."
                  className="w-full bg-[#1E1F22] text-white p-2.5 rounded-[3px] text-sm h-20 resize-none"
                  maxLength={500}
                />
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-8 bg-[#2B2D31] rounded-lg border-2 border-dashed border-[#4E5058]">
            <p className="text-slate-400 mb-4">No rules yet. Add your first rule!</p>
          </div>
        )}
      </div>

      <button
        onClick={handleAddRule}
        className="w-full py-3 bg-[#2B2D31] hover:bg-[#35373C] text-white rounded-[3px] text-sm font-medium transition-colors mb-6 border-2 border-dashed border-[#4E5058] hover:border-[#5865F2]"
      >
        + Add Rule
      </button>

      {error && (
        <div className="mb-4 p-3 bg-[#F23F43]/10 border border-[#F23F43] rounded text-sm text-[#F23F43]">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={fetchRules}
          className="px-4 py-2 text-sm font-medium text-white hover:underline"
          disabled={saving}
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={saving || rules.length === 0}
          className="px-6 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-[3px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Rules'}
        </button>
      </div>
    </div>
  )
}
