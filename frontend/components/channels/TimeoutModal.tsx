'use client'

import { useState, useEffect } from 'react'
import { apiPatch } from '@/lib/api'

type TimeoutDuration = {
    label: string
    value: number // minutes
}

const DURATIONS: TimeoutDuration[] = [
    { label: '60 Seconds', value: 1 },
    { label: '5 Minutes', value: 5 },
    { label: '10 Minutes', value: 10 },
    { label: '1 Hour', value: 60 },
    { label: '1 Day', value: 1440 },
    { label: '1 Week', value: 10080 },
]

export default function TimeoutModal({
    open,
    onClose,
    serverId,
    userId,
    username,
    timeoutUntil,
    timeoutReason,
    onSuccess
}: {
    open: boolean
    onClose: () => void
    serverId: string
    userId: string
    username: string
    timeoutUntil?: string | null
    timeoutReason?: string | null
    onSuccess?: () => void
}) {
    const isCurrentlyTimedOut = timeoutUntil && new Date(timeoutUntil) > new Date()
    const [selectedDuration, setSelectedDuration] = useState<number>(10)
    const [reason, setReason] = useState(timeoutReason || '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!open) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    if (!open) return null

    const handleTimeout = async () => {
        setLoading(true)
        setError(null)
        try {
            await apiPatch(`/server/${serverId}/members/${userId}/timeout`, {
                duration: selectedDuration,
                reason
            })
            onSuccess?.()
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to apply timeout')
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveTimeout = async () => {
        setLoading(true)
        setError(null)
        try {
            await apiPatch(`/server/${serverId}/members/${userId}/timeout`, {
                duration: 0,
                reason: 'Timeout removed by administrator'
            })
            onSuccess?.()
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to remove timeout')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="w-full max-w-[440px] bg-[#313338] rounded-lg shadow-2xl overflow-hidden animate-scale-in relative border border-[#232428]">
                <div className="p-4">
                    <h2 className="text-xl font-bold text-white mb-1">Timeout {username}</h2>
                    <p className="text-sm text-slate-400 mb-6 font-medium">
                        Temporarily restrict this member's ability to send messages in this server.
                    </p>

                    {isCurrentlyTimedOut && (
                        <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-[4px] text-sm text-yellow-500 flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse" />
                            <span>Currently timed out until {new Date(timeoutUntil!).toLocaleString()}</span>
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Duration</label>
                        <div className="grid grid-cols-2 gap-2">
                            {DURATIONS.map((dur) => (
                                <button
                                    key={dur.value}
                                    onClick={() => setSelectedDuration(dur.value)}
                                    className={`px-3 py-2 rounded-[3px] text-sm font-medium transition-all text-left ${
                                        selectedDuration === dur.value
                                            ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                                            : 'bg-[#1e1f22] text-slate-300 hover:bg-[#3f4147]'
                                    }`}
                                >
                                    {dur.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Reason</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Reason for timeout (optional)"
                            className="w-full bg-[#1e1f22] text-slate-50 p-3 rounded-[3px] border border-[#1e1f22] outline-none text-sm placeholder:text-slate-500 focus:border-cyan-500/50 min-h-[80px] transition-all"
                        />
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-[4px] text-sm text-red-400">
                            {error}
                        </div>
                    )}
                </div>

                <div className="bg-[#2b2d31] p-4 flex items-center justify-between">
                    <button
                        onClick={handleRemoveTimeout}
                        disabled={loading}
                        className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Remove Timeout
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-white hover:underline"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleTimeout}
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white text-sm font-bold rounded-[3px] shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Applying...
                                </>
                            ) : 'Timeout'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
