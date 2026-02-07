import { useEffect, useState } from 'react'
import { Room } from 'livekit-client'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useSocket } from '@/providers/SocketProvider'
import type { VoiceParticipant, VoiceState } from '@/lib/livekit/types'

/**
 * React hook for managing LiveKit voice connection and state
 * Integrates with Socket.IO for signaling and participant management
 */
export function useLiveKit() {
    const { socket, isConnected: isSocketConnected } = useSocket()
    const {
        activeChannelId,
        isConnected,
        isConnecting,
        room,
        participants,
        isMuted,
        isDeafened,
        isVideoEnabled,
        isScreenSharing,
        connect,
        disconnect,
        toggleMute,
        toggleDeafen,
        toggleVideo,
        toggleScreenShare,
        addParticipant,
        removeParticipant,
        updateParticipant,
    } = useVoiceStore()

    const [error, setError] = useState<string | null>(null)

    // Setup Socket.IO event listeners
    useEffect(() => {
        if (!socket || !isSocketConnected) return

        // User joined voice channel
        socket.on('voice:user-joined', ({ userId, username, avatar, participants: participantsList }) => {
            console.log('🎤 User joined voice:', username)

            // Update participants list
            participantsList.forEach((p: any) => {
                addParticipant({
                    userId: p.userId,
                    username: p.username,
                    avatar: p.avatar,
                    isMuted: p.muted,
                    isDeafened: p.deafened,
                    isSpeaking: false,
                    isVideoEnabled: p.video,
                    isScreenSharing: p.screenshare,
                    joinedAt: Date.now(),
                })
            })
        })

        // User left voice channel
        socket.on('voice:user-left', ({ userId, participants: participantsList }) => {
            console.log('👋 User left voice:', userId)
            removeParticipant(userId)
        })

        // Voice state changed
        socket.on('voice:state-changed', ({ userId, state }: { userId: string, state: VoiceState }) => {
            console.log('🔄 Voice state changed:', userId, state)
            updateParticipant(userId, {
                isMuted: state.muted ?? undefined,
                isDeafened: state.deafened ?? undefined,
                isVideoEnabled: state.video ?? undefined,
                isScreenSharing: state.screenshare ?? undefined,
            })
        })

        // Voice error
        socket.on('voice:error', ({ message }) => {
            console.error('❌ Voice error:', message)
            setError(message)
        })

        return () => {
            socket.off('voice:user-joined')
            socket.off('voice:user-left')
            socket.off('voice:state-changed')
            socket.off('voice:error')
        }
    }, [socket, isSocketConnected])

    // Emit state updates to Socket.IO when local state changes
    useEffect(() => {
        if (!socket || !activeChannelId || !isSocketConnected) return

        socket.emit('voice:state-update', {
            channelId: activeChannelId,
            userId: socket.id, // Use actual user ID from auth context
            state: {
                muted: isMuted,
                deafened: isDeafened,
                video: isVideoEnabled,
                screenshare: isScreenSharing,
            },
        })
    }, [isMuted, isDeafened, isVideoEnabled, isScreenSharing, activeChannelId, socket, isSocketConnected])

    // Join voice channel (emits to Socket.IO)
    const joinVoiceChannel = async (channelId: string, userId: string, username: string, avatar?: string) => {
        try {
            setError(null)

            // Connect to LiveKit
            await connect(channelId, userId, username, avatar)

            // Emit to Socket.IO
            if (socket && isSocketConnected) {
                socket.emit('voice:join', {
                    channelId,
                    userId,
                    username,
                    avatar,
                })
            }
        } catch (err: any) {
            setError(err.message || 'Failed to join voice channel')
            throw err
        }
    }

    // Leave voice channel (emits to Socket.IO)
    const leaveVoiceChannel = async (userId: string) => {
        if (!activeChannelId) return

        try {
            // Emit to Socket.IO first
            if (socket && isSocketConnected) {
                socket.emit('voice:leave', {
                    channelId: activeChannelId,
                    userId,
                })
            }

            // Disconnect from LiveKit
            await disconnect()
            setError(null)
        } catch (err: any) {
            setError(err.message || 'Failed to leave voice channel')
        }
    }

    return {
        // State
        activeChannelId,
        isConnected,
        isConnecting,
        room,
        participants: Array.from(participants.values()),
        isMuted,
        isDeafened,
        isVideoEnabled,
        isScreenSharing,
        error,

        // Actions
        joinVoiceChannel,
        leaveVoiceChannel,
        toggleMute,
        toggleDeafen,
        toggleVideo,
        toggleScreenShare,
    }
}
