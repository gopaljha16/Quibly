import { create } from 'zustand'
import { Room, RemoteParticipant } from 'livekit-client'
import type { VoiceParticipant } from '@/lib/livekit/types'
import { getLiveKitManager } from '@/lib/livekit/LiveKitManager'
import { apiGet } from '@/lib/api'

interface VoiceState {
    // Connection state
    activeChannelId: string | null
    isConnected: boolean
    isConnecting: boolean
    room: Room | null

    // Participants
    participants: Map<string, VoiceParticipant>

    // Local state
    isMuted: boolean
    isDeafened: boolean
    isVideoEnabled: boolean
    isScreenSharing: boolean

    // Actions
    connect: (channelId: string, userId: string, username: string, avatar?: string) => Promise<void>
    disconnect: () => Promise<void>
    toggleMute: () => Promise<void>
    toggleDeafen: () => void
    toggleVideo: () => Promise<void>
    toggleScreenShare: () => Promise<void>
    addParticipant: (participant: VoiceParticipant) => void
    removeParticipant: (userId: string) => void
    updateParticipant: (userId: string, updates: Partial<VoiceParticipant>) => void
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
    // Initial state
    activeChannelId: null,
    isConnected: false,
    isConnecting: false,
    room: null,
    participants: new Map(),
    isMuted: false,
    isDeafened: false,
    isVideoEnabled: false,
    isScreenSharing: false,

    // Connect to voice channel
    connect: async (channelId: string, userId: string, username: string, avatar?: string) => {
        const state = get()

        // Already connected to this channel
        if (state.activeChannelId === channelId && state.isConnected) {
            console.log('Already connected to this voice channel')
            return
        }

        // Disconnect from current channel if connected
        if (state.activeChannelId) {
            await get().disconnect()
        }

        try {
            set({ isConnecting: true })
            console.log('🎙️ Connecting to voice channel:', channelId)

            // Get LiveKit token from backend
            const response = (await apiGet(`/voice/token/${channelId}`)) as {
                token: string
                wsUrl: string
                roomName: string
            }
            const { token, wsUrl, roomName } = response

            // Connect to LiveKit room
            const livekit = getLiveKitManager()
            const room = await livekit.connect(
                { token, wsUrl, roomName, identity: userId },
                {
                    onParticipantConnected: (participant: RemoteParticipant) => {
                        console.log('Participant connected:', participant.identity)
                        // Will be updated via socket events
                    },
                    onParticipantDisconnected: (participant: RemoteParticipant) => {
                        console.log('Participant disconnected:', participant.identity)
                        get().removeParticipant(participant.identity)
                    },
                }
            )

            set({
                activeChannelId: channelId,
                isConnected: true,
                isConnecting: false,
                room,
                isMuted: false,
            })

            console.log('✅ Connected to voice channel')
        } catch (error) {
            console.error('❌ Failed to connect to voice channel:', error)
            set({ isConnecting: false })
            throw error
        }
    },

    // Disconnect from voice channel
    disconnect: async () => {
        const state = get()

        if (!state.activeChannelId) return

        try {
            console.log('📴 Disconnecting from voice channel')

            // Disconnect from LiveKit
            const livekit = getLiveKitManager()
            await livekit.disconnect()

            // Reset state
            set({
                activeChannelId: null,
                isConnected: false,
                room: null,
                participants: new Map(),
                isMuted: false,
                isDeafened: false,
                isVideoEnabled: false,
                isScreenSharing: false,
            })

            console.log('✅ Disconnected from voice channel')
        } catch (error) {
            console.error('❌ Failed to disconnect:', error)
        }
    },

    // Toggle mute
    toggleMute: async () => {
        const livekit = getLiveKitManager()
        const newMutedState = await livekit.toggleMicrophone()
        set({ isMuted: !newMutedState })
    },

    // Toggle deafen (mutes incoming audio)
    toggleDeafen: () => {
        const state = get()
        const newDeafenedState = !state.isDeafened

        // If deafening, also mute microphone
        if (newDeafenedState && !state.isMuted) {
            get().toggleMute()
        }

        set({ isDeafened: newDeafenedState })
        console.log(`🔇 Deafen ${newDeafenedState ? 'enabled' : 'disabled'}`)
    },

    // Toggle video
    toggleVideo: async () => {
        const livekit = getLiveKitManager()
        const newVideoState = await livekit.toggleCamera()
        set({ isVideoEnabled: newVideoState })
    },

    // Toggle screen share
    toggleScreenShare: async () => {
        const livekit = getLiveKitManager()
        const newScreenShareState = await livekit.toggleScreenShare()
        set({ isScreenSharing: newScreenShareState })
    },

    // Add participant
    addParticipant: (participant: VoiceParticipant) => {
        set((state) => {
            const newParticipants = new Map(state.participants)
            newParticipants.set(participant.userId, participant)
            return { participants: newParticipants }
        })
    },

    // Remove participant
    removeParticipant: (userId: string) => {
        set((state) => {
            const newParticipants = new Map(state.participants)
            newParticipants.delete(userId)
            return { participants: newParticipants }
        })
    },

    // Update participant
    updateParticipant: (userId: string, updates: Partial<VoiceParticipant>) => {
        set((state) => {
            const newParticipants = new Map(state.participants)
            const existing = newParticipants.get(userId)
            if (existing) {
                newParticipants.set(userId, { ...existing, ...updates })
            }
            return { participants: newParticipants }
        })
    },
}))
