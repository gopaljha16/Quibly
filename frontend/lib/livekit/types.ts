// LiveKit TypeScript interfaces and types

export interface VoiceParticipant {
    userId: string
    username: string
    avatar?: string
    isMuted: boolean
    isDeafened: boolean
    isSpeaking: boolean
    isVideoEnabled: boolean
    isScreenSharing: boolean
    joinedAt: number
}

export interface VoiceChannelState {
    channelId: string
    participants: VoiceParticipant[]
    isConnected: boolean
}

export interface LiveKitConnectionConfig {
    token: string
    wsUrl: string
    roomName: string
    identity: string
}

export interface VoiceState {
    muted?: boolean
    deafened?: boolean
    video?: boolean
    screenshare?: boolean
}
