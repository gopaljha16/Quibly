'use client'

import { useState } from 'react'
import { useBanMember, useUnbanMember } from '@/hooks/mutations/useServerMutations'
import { toast } from 'sonner'

interface BanModalProps {
    open: boolean
    onClose: () => void
    serverId: string
    userId: string
    username: string
    isBanned: boolean
    banReason?: string | null
    onSuccess?: () => void
}

export default function BanModal({
    open,
    onClose,
    serverId,
    userId,
    username,
    isBanned,
    banReason: existingBanReason,
    onSuccess
}: BanModalProps) {
    const [reason, setReason] = useState('')
    const banMutation = useBanMember(serverId)
    const unbanMutation = useUnbanMember(serverId)

    const handleBan = async () => {
        try {
            await banMutation.mutateAsync({ userId, reason })
            toast.success(`${username} has been banned from the server`)
            onSuccess?.()
            onClose()
        } catch (error: any) {
            toast.error(error?.message || 'Failed to ban member')
        }
    }

    const handleUnban = async () => {
        try {
            await unbanMutation.mutateAsync(userId)
            toast.success(`${username} has been unbanned from the server`)
            onSuccess?.()
            onClose()
        } catch (error: any) {
            toast.error(error?.message || 'Failed to unban member')
        }
    }

    if (!open) return null

    return (
        <>
            <div className="fixed inset-0 bg-black/80 z-50" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
                <div className="bg-[#313338] rounded-lg shadow-xl">
                    <div className="p-4 border-b border-[#3F4147]">
                        <h2 className="text-xl font-bold text-white">
                            {isBanned ? 'Unban Member' : 'Ban Member'}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            {isBanned 
                                ? `Are you sure you want to unban ${username}?`
                                : `Are you sure you want to ban ${username} from this server?`
                            }
                        </p>
                    </div>

                    <div className="p-4">
                        {isBanned ? (
                            existingBanReason && (
                                <div className="mb-4 p-3 bg-[#1E1F22] rounded-[3px] border border-[#3F4147]">
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Ban Reason
                                    </label>
                                    <p className="text-sm text-slate-400">{existingBanReason}</p>
                                </div>
                            )
                        ) : (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Reason (Optional)
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Enter a reason for banning this member..."
                                    className="w-full bg-[#1E1F22] text-slate-50 p-3 rounded-[3px] border-none outline-none text-sm placeholder:text-slate-500 resize-none"
                                    rows={3}
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-[3px] text-sm font-medium text-white hover:bg-[#3F4147] transition-colors"
                            >
                                Cancel
                            </button>
                            {isBanned ? (
                                <button
                                    onClick={handleUnban}
                                    disabled={unbanMutation.isPending}
                                    className="px-4 py-2 rounded-[3px] text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {unbanMutation.isPending ? 'Unbanning...' : 'Unban'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleBan}
                                    disabled={banMutation.isPending}
                                    className="px-4 py-2 rounded-[3px] text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {banMutation.isPending ? 'Banning...' : 'Ban'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
