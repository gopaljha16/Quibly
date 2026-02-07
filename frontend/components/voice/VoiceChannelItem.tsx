'use client'

import { Volume2, Users } from 'lucide-react'
import type { VoiceParticipant } from '@/lib/livekit/types'

interface VoiceChannelItemProps {
    channel: {
        _id: string
        name: string
        type: string
    }
    isConnected: boolean
    participants: VoiceParticipant[]
    onJoin: () => void
}

export default function VoiceChannelItem({
    channel,
    isConnected,
    participants,
    onJoin,
}: VoiceChannelItemProps) {
    const participantCount = participants.length

    return (
        <div
            className={`group relative flex items-center px-2 py-1.5 mx-2 rounded cursor-pointer transition-all ${isConnected
                    ? 'bg-[#f3c178]/20 text-[#f3c178]'
                    : 'text-[#80848E] hover:bg-[#1a1510] hover:text-[#E0E1E5]'
                }`}
            onClick={onJoin}
        >
            {/* Voice icon */}
            <Volume2 className={`w-5 h-5 mr-1.5 ${isConnected ? 'text-[#f3c178]' : 'text-[#80848E]'}`} />

            {/* Channel name */}
            <span className="flex-1 text-sm font-medium truncate">{channel.name}</span>

            {/* Participant count */}
            {participantCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-[#80848E]">
                    <Users className="w-3.5 h-3.5" />
                    <span>{participantCount}</span>
                </div>
            )}

            {/* Connected indicator */}
            {isConnected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#f3c178] rounded-r" />
            )}

            {/* Participants list on hover (when not connected) */}
            {!isConnected && participantCount > 0 && (
                <div className="absolute left-full ml-2 top-0 bg-[#0d0805] border border-[#1a1510] rounded-lg p-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none min-w-[150px] shadow-xl">
                    <div className="text-xs font-semibold text-[#B5BAC1] mb-2">In Voice</div>
                    {participants.slice(0, 5).map((p) => (
                        <div key={p.userId} className="flex items-center gap-2 mb-1.5">
                            <div className="w-6 h-6 rounded-full bg-[#f3c178]/20 flex items-center justify-center text-xs">
                                {p.username[0].toUpperCase()}
                            </div>
                            <span className="text-xs text-[#E0E1E5] truncate">{p.username}</span>
                        </div>
                    ))}
                    {participantCount > 5 && (
                        <div className="text-xs text-[#80848E] mt-1">+{participantCount - 5} more</div>
                    )}
                </div>
            )}
        </div>
    )
}
