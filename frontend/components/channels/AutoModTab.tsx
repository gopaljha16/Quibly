'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiRequest } from '@/lib/api'
import { toast } from 'sonner'

type AutoModRule = {
    id: string
    serverId: string
    name: string
    enabled: boolean
    triggerType: string
    triggerMetadata: any
    actions: any[]
    exemptRoles: string[]
    exemptChannels: string[]
}

const TRIGGER_TYPES = [
    { value: 'SPAM', label: 'Spam Detection' },
    { value: 'BANNED_WORDS', label: 'Banned Words' },
    { value: 'CAPS', label: 'Excessive Caps' },
    { value: 'LINKS', label: 'Links' },
    { value: 'MENTIONS', label: 'Mass Mentions' }
]

const ACTION_TYPES = [
    { value: 'DELETE_MESSAGE', label: 'Delete Message' },
    { value: 'TIMEOUT', label: 'Timeout User' },
    { value: 'WARN', label: 'Send Warning' }
]

export default function AutoModTab({ serverId }: { serverId: string }) {
    const queryClient = useQueryClient()
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingRule, setEditingRule] = useState<AutoModRule | null>(null)

    const { data: rulesData, isLoading } = useQuery({
        queryKey: ['autoModRules', serverId],
        queryFn: async () => {
            const response = await apiGet<{ success: boolean; rules: AutoModRule[] }>(
                `/server/${serverId}/auto-mod/rules`
            )
            return response.rules
        }
    })

    const createRuleMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiPost(`/server/${serverId}/auto-mod/rules`, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['autoModRules', serverId] })
            toast.success('Auto-mod rule created')
            setShowCreateModal(false)
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to create rule')
        }
    })

    const updateRuleMutation = useMutation({
        mutationFn: async ({ ruleId, updates }: { ruleId: string; updates: any }) => {
            return await apiRequest(`/server/${serverId}/auto-mod/rules/${ruleId}`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['autoModRules', serverId] })
            toast.success('Auto-mod rule updated')
            setEditingRule(null)
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update rule')
        }
    })

    const deleteRuleMutation = useMutation({
        mutationFn: async (ruleId: string) => {
            return await apiRequest(`/server/${serverId}/auto-mod/rules/${ruleId}`, {
                method: 'DELETE'
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['autoModRules', serverId] })
            toast.success('Auto-mod rule deleted')
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to delete rule')
        }
    })

    const rules = rulesData || []

    if (isLoading) return <div className="text-slate-400">Loading auto-mod rules...</div>

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">Auto-Moderation</h3>
                    <p className="text-sm text-slate-400">Automatically moderate messages</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-[3px] transition-colors"
                >
                    Create Rule
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {rules.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                        No auto-mod rules configured
                    </div>
                ) : (
                    rules.map((rule) => (
                        <div
                            key={rule.id}
                            className="bg-[#1E1F22] rounded-[3px] p-4 border border-[#3F4147]/50"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-semibold text-white">{rule.name}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            rule.enabled 
                                                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                                                : 'bg-slate-600/20 text-slate-400 border border-slate-600/30'
                                        }`}>
                                            {rule.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Trigger: {TRIGGER_TYPES.find(t => t.value === rule.triggerType)?.label || rule.triggerType}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateRuleMutation.mutate({
                                            ruleId: rule.id,
                                            updates: { enabled: !rule.enabled }
                                        })}
                                        className="text-xs text-slate-400 hover:text-white transition-colors"
                                    >
                                        {rule.enabled ? 'Disable' : 'Enable'}
                                    </button>
                                    <button
                                        onClick={() => setEditingRule(rule)}
                                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Delete this rule?')) {
                                                deleteRuleMutation.mutate(rule.id)
                                            }
                                        }}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div className="text-xs text-slate-400 space-y-1">
                                <div>Actions: {rule.actions.map((a: any) => a.type).join(', ')}</div>
                                {rule.exemptRoles.length > 0 && (
                                    <div>Exempt Roles: {rule.exemptRoles.length}</div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {(showCreateModal || editingRule) && (
                <CreateEditRuleModal
                    serverId={serverId}
                    rule={editingRule}
                    onClose={() => {
                        setShowCreateModal(false)
                        setEditingRule(null)
                    }}
                    onSubmit={(data) => {
                        if (editingRule) {
                            updateRuleMutation.mutate({ ruleId: editingRule.id, updates: data })
                        } else {
                            createRuleMutation.mutate(data)
                        }
                    }}
                />
            )}
        </div>
    )
}

function CreateEditRuleModal({
    serverId,
    rule,
    onClose,
    onSubmit
}: {
    serverId: string
    rule: AutoModRule | null
    onClose: () => void
    onSubmit: (data: any) => void
}) {
    const [name, setName] = useState(rule?.name || '')
    const [triggerType, setTriggerType] = useState(rule?.triggerType || 'SPAM')
    const [actions, setActions] = useState<any[]>(rule?.actions || [{ type: 'DELETE_MESSAGE' }])
    const [timeoutDuration, setTimeoutDuration] = useState(10)

    const handleSubmit = () => {
        if (!name.trim()) {
            toast.error('Rule name is required')
            return
        }

        // Format actions with duration if TIMEOUT
        const formattedActions = actions.map(action => {
            if (action.type === 'TIMEOUT') {
                return { type: 'TIMEOUT', duration: timeoutDuration }
            }
            return action
        })

        onSubmit({
            name,
            triggerType,
            triggerMetadata: {},
            actions: formattedActions
        })
    }

    const selectedActionType = actions[0]?.type || 'DELETE_MESSAGE'

    return (
        <>
            <div className="fixed inset-0 bg-black/80 z-50" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
                <div className="bg-[#313338] rounded-lg shadow-xl">
                    <div className="p-4 border-b border-[#3F4147]">
                        <h2 className="text-xl font-bold text-white">
                            {rule ? 'Edit Rule' : 'Create Auto-Mod Rule'}
                        </h2>
                    </div>

                    <div className="p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Rule Name
                            </label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[#1E1F22] text-slate-50 p-2.5 rounded-[3px] border-none outline-none"
                                placeholder="My Auto-Mod Rule"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Trigger Type
                            </label>
                            <select
                                value={triggerType}
                                onChange={(e) => setTriggerType(e.target.value)}
                                className="w-full bg-[#1E1F22] text-slate-50 p-2.5 rounded-[3px] border-none outline-none"
                            >
                                {TRIGGER_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Actions
                            </label>
                            <select
                                value={selectedActionType}
                                onChange={(e) => setActions([{ type: e.target.value }])}
                                className="w-full bg-[#1E1F22] text-slate-50 p-2.5 rounded-[3px] border-none outline-none"
                            >
                                {ACTION_TYPES.map(a => (
                                    <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                            </select>
                        </div>

                        {selectedActionType === 'TIMEOUT' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Timeout Duration (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10080"
                                    value={timeoutDuration}
                                    onChange={(e) => setTimeoutDuration(parseInt(e.target.value) || 10)}
                                    className="w-full bg-[#1E1F22] text-slate-50 p-2.5 rounded-[3px] border-none outline-none"
                                    placeholder="10"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    How long to timeout the user (1-10080 minutes)
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-[#3F4147] flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-[3px] transition-colors"
                        >
                            {rule ? 'Update' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
