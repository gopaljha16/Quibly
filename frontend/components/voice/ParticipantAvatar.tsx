'use client'

import { MicOff } from 'lucide-react'
import type { VoiceParticipant } from '@/lib/livekit/types'

interface ParticipantAvatarProps {
    participant: VoiceParticipant
    size?: 'sm' | 'md' | 'lg'
    showName?: boolean
}

export default function ParticipantAvatar({
    participant,
    size = 'md',
    showName = false,
}: ParticipantAvatarProps) {
    const sizeClasses = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-12 h-12 text-base',
    }

    const ringClasses = participant.isSpeaking
        ? 'ring-2 ring-[#23a559] ring-offset-2 ring-offset-[#0d0805]'
        : ''

    return (
        <div className="relative group">
            {/* Avatar */}
            <div
                className={`${sizeClasses[size]} rounded-full bg-[#f3c178]/20 flex items-center justify-center font-semibold text-[#f3c178] ${ringClasses} transition-all`}
                title={participant.username}
            >
                {participant.avatar ? (
                    <img
                        src={participant.avatar}
                        alt={participant.username}
                        className="w-full h-full rounded-full object-cover"
                    />
                ) : (
                    participant.username[0].toUpperCase()
                )}

                {/* Muted indicator */}
                {participant.isMuted && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#f35e41] rounded-full flex items-center justify-center">
                        <MicOff className="w-2.5 h-2.5 text-white" />
                    </div>
                )}
            </div>

            {/* Username tooltip or label */}
            {showName ? (
                <div className="text-xs text-[#E0E1E5] mt-1 text-center truncate max-w-[60px]">
                    {participant.username}
                </div>
            ) : (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0d0805] border border-[#1a1510] rounded text-xs text-[#E0E1E5] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {participant.username}
                    {participant.isMuted && <span className="text-[#f35e41] ml-1">(Muted)</span>}
                    {participant.isDeafened && <span className="text-[#80848E] ml-1">(Deafened)</span>}
                </div>
            )}
        </div>
    )
}
