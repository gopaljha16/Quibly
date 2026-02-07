'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

type AuditLog = {
    id: string
    serverId: string
    userId: string
    action: string
    targetType?: string
    targetId?: string
    changes?: any
    reason?: string
    metadata?: any
    createdAt: string
}

const ACTION_LABELS: Record<string, string> = {
    MEMBER_BAN: 'Member Banned',
    MEMBER_UNBAN: 'Member Unbanned',
    MEMBER_TIMEOUT: 'Member Timed Out',
    MEMBER_KICK: 'Member Kicked',
    ROLE_CREATE: 'Role Created',
    ROLE_UPDATE: 'Role Updated',
    ROLE_DELETE: 'Role Deleted',
    CHANNEL_CREATE: 'Channel Created',
    CHANNEL_UPDATE: 'Channel Updated',
    CHANNEL_DELETE: 'Channel Deleted',
    SERVER_UPDATE: 'Server Updated',
    AUTO_MOD_RULE_CREATE: 'Auto-Mod Rule Created',
    AUTO_MOD_RULE_UPDATE: 'Auto-Mod Rule Updated',
    AUTO_MOD_RULE_DELETE: 'Auto-Mod Rule Deleted',
    AUTO_MOD_MESSAGE_BLOCKED: 'Message Blocked by Auto-Mod',
    AUTO_MOD_TIMEOUT: 'Auto-Mod Timeout Applied',
    WELCOME_SCREEN_UPDATE: 'Welcome Screen Updated',
    MEMBER_SCREENING_UPDATE: 'Member Screening Updated',
    SCREENING_APPROVED: 'Screening Approved',
    SCREENING_REJECTED: 'Screening Rejected'
}

export default function AuditLogsTab({ serverId }: { serverId: string }) {
    const [filter, setFilter] = useState<string>('all')
    const [limit] = useState(50)
    const [offset, setOffset] = useState(0)

    const { data, isLoading } = useQuery({
        queryKey: ['auditLogs', serverId, filter, offset],
        queryFn: async () => {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString()
            })
            if (filter !== 'all') params.append('action', filter)
            
            const response = await apiGet<{
                success: boolean
                logs: AuditLog[]
                total: number
            }>(`/server/${serverId}/audit-logs?${params}`)
            return response
        }
    })

    const logs = data?.logs || []
    const total = data?.total || 0

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (isLoading) return <div className="text-slate-400">Loading audit logs...</div>

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">Audit Logs</h3>
                    <p className="text-sm text-slate-400">{total} total entries</p>
                </div>
                
                <select
                    value={filter}
                    onChange={(e) => {
                        setFilter(e.target.value)
                        setOffset(0)
                    }}
                    className="bg-[#1E1F22] text-slate-50 px-3 py-2 rounded-[3px] border-none outline-none text-sm"
                >
                    <option value="all">All Actions</option>
                    <option value="MEMBER_BAN">Bans</option>
                    <option value="MEMBER_TIMEOUT">Timeouts</option>
                    <option value="ROLE_CREATE">Role Changes</option>
                    <option value="CHANNEL_CREATE">Channel Changes</option>
                    <option value="AUTO_MOD_MESSAGE_BLOCKED">Auto-Mod Actions</option>
                </select>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                        No audit logs found
                    </div>
                ) : (
                    <div className="space-y-2">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                className="bg-[#1E1F22] rounded-[3px] p-4 border border-[#3F4147]/50"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-white">
                                            {ACTION_LABELS[log.action] || log.action}
                                        </span>
                                        {log.targetType && (
                                            <span className="text-xs text-slate-400">
                                                ({log.targetType})
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {formatDate(log.createdAt)}
                                    </span>
                                </div>

                                {log.reason && (
                                    <div className="text-sm text-slate-300 mb-2">
                                        <span className="text-slate-400">Reason:</span> {log.reason}
                                    </div>
                                )}

                                {log.changes && Object.keys(log.changes).length > 0 && (
                                    <div className="text-xs text-slate-400 mt-2 p-2 bg-[#12131a] rounded">
                                        <pre className="whitespace-pre-wrap">
                                            {JSON.stringify(log.changes, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <div className="text-xs text-slate-500 mt-1">
                                        {JSON.stringify(log.metadata)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {total > limit && (
                <div className="flex items-center justify-between pt-4 border-t border-[#3F4147]">
                    <button
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                        disabled={offset === 0}
                        className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-[#3F4147] disabled:text-slate-500 text-white text-sm font-medium rounded-[3px] transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-400">
                        Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
                    </span>
                    <button
                        onClick={() => setOffset(offset + limit)}
                        disabled={offset + limit >= total}
                        className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-[#3F4147] disabled:text-slate-500 text-white text-sm font-medium rounded-[3px] transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}
