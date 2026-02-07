'use client'

import { Mic, MicOff, Headphones, PhoneOff, Settings } from 'lucide-react'
import { useLiveKit } from '@/hooks/useLiveKit'
import ParticipantAvatar from '@/components/voice/ParticipantAvatar'

interface VoiceChannelPanelProps {
    channelName: string
    onDisconnect: () => void
}

export default function VoiceChannelPanel({ channelName, onDisconnect }: VoiceChannelPanelProps) {
    const {
        participants,
        isMuted,
        isDeafened,
        toggleMute,
        toggleDeafen,
    } = useLiveKit()

    const handleMuteToggle = async () => {
        try {
            await toggleMute()
        } catch (error) {
            console.error('Failed to toggle mute:', error)
        }
    }

    const handleDeafenToggle = () => {
        toggleDeafen()
    }

    const handleDisconnect = () => {
        if (window.confirm('Leave voice channel?')) {
            onDisconnect()
        }
    }

    return (
        <div className="bg-[#0d0805] border-t border-[#1a1510] p-3">
            {/* Channel info */}
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-[#23a559] rounded-full animate-pulse" />
                <div className="flex-1">
                    <div className="text-xs text-[#23a559] font-semibold">Voice Connected</div>
                    <div className="text-xs text-[#80848E] truncate">{channelName}</div>
                </div>
            </div>

            {/* Participants */}
            {participants.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {participants.slice(0, 8).map((participant) => (
                        <ParticipantAvatar
                            key={participant.userId}
                            participant={participant}
                            size="sm"
                        />
                    ))}
                    {participants.length > 8 && (
                        <div className="w-6 h-6 rounded-full bg-[#1a1510] flex items-center justify-center">
                            <span className="text-[10px] text-[#80848E]">+{participants.length - 8}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between gap-2">
                {/* Voice controls */}
                <div className="flex items-center gap-1">
                    {/* Mute button */}
                    <button
                        onClick={handleMuteToggle}
                        className={`p-2 rounded transition-colors ${isMuted
                            ? 'bg-[#f35e41] hover:bg-[#f35e41]/80 text-white'
                            : 'bg-[#1a1510] hover:bg-[#252018] text-[#B5BAC1]'
                            }`}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Deafen button */}
                    <button
                        onClick={handleDeafenToggle}
                        className={`p-2 rounded transition-colors ${isDeafened
                            ? 'bg-[#f35e41] hover:bg-[#f35e41]/80 text-white'
                            : 'bg-[#1a1510] hover:bg-[#252018] text-[#B5BAC1]'
                            }`}
                        title={isDeafened ? 'Undeafen' : 'Deafen'}
                    >
                        <Headphones className="w-4 h-4" />
                    </button>

                    {/* Settings */}
                    <button
                        className="p-2 rounded bg-[#1a1510] hover:bg-[#252018] text-[#B5BAC1] transition-colors"
                        title="Voice Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>

                {/* Disconnect button */}
                <button
                    onClick={handleDisconnect}
                    className="p-2 rounded bg-[#f35e41] hover:bg-[#f35e41]/80 text-white transition-colors"
                    title="Disconnect"
                >
                    <PhoneOff className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
