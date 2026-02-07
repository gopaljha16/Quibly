import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant, LocalParticipant, createLocalTracks } from 'livekit-client'
import type { LiveKitConnectionConfig } from './types'

/**
 * LiveKit Manager - Handles WebRTC connections via LiveKit
 * Manages local and remote audio/video tracks, screen sharing, and connection state
 */
export class LiveKitManager {
    private room: Room | null = null
    private onParticipantConnected?: (participant: RemoteParticipant) => void
    private onParticipantDisconnected?: (participant: RemoteParticipant) => void
    private onTrackSubscribed?: (track: RemoteTrack, participant: RemoteParticipant) => void
    private onSpeakingChanged?: (isSpeaking: boolean) => void

    /**
     * Connect to a LiveKit room
     */
    async connect(config: LiveKitConnectionConfig, callbacks?: {
        onParticipantConnected?: (participant: RemoteParticipant) => void
        onParticipantDisconnected?: (participant: RemoteParticipant) => void
        onTrackSubscribed?: (track: RemoteTrack, participant: RemoteParticipant) => void
        onSpeakingChanged?: (isSpeaking: boolean) => void
    }): Promise<Room> {
        try {
            console.log('🎙️ Connecting to LiveKit room:', config.roomName)

            // Store callbacks
            this.onParticipantConnected = callbacks?.onParticipantConnected
            this.onParticipantDisconnected = callbacks?.onParticipantDisconnected
            this.onTrackSubscribed = callbacks?.onTrackSubscribed
            this.onSpeakingChanged = callbacks?.onSpeakingChanged

            // Create room instance
            this.room = new Room({
                adaptiveStream: true,
                dynacast: true,
            })

            // Setup event listeners
            this.setupEventListeners()

            // Connect to room
            await this.room.connect(config.wsUrl, config.token)

            console.log('✅ Connected to LiveKit room')

            // Enable local microphone by default
            await this.enableMicrophone()

            return this.room
        } catch (error) {
            console.error('❌ Failed to connect to LiveKit room:', error)
            throw error
        }
    }

    /**
     * Disconnect from the current room
     */
    async disconnect(): Promise<void> {
        if (this.room) {
            console.log('📴 Disconnecting from LiveKit room')
            await this.room.disconnect()
            this.room = null
        }
    }

    /**
     * Toggle microphone on/off
     */
    async toggleMicrophone(): Promise<boolean> {
        if (!this.room) return false

        const localParticipant = this.room.localParticipant
        const micEnabled = localParticipant.isMicrophoneEnabled

        await localParticipant.setMicrophoneEnabled(!micEnabled)
        console.log(`🎤 Microphone ${!micEnabled ? 'enabled' : 'disabled'}`)

        return !micEnabled
    }

    /**
     * Enable microphone
     */
    async enableMicrophone(): Promise<void> {
        if (!this.room) return

        const localParticipant = this.room.localParticipant
        if (!localParticipant.isMicrophoneEnabled) {
            await localParticipant.setMicrophoneEnabled(true)
            console.log('🎤 Microphone enabled')
        }
    }

    /**
     * Mute microphone
     */
    async muteMicrophone(): Promise<void> {
        if (!this.room) return

        const localParticipant = this.room.localParticipant
        if (localParticipant.isMicrophoneEnabled) {
            await localParticipant.setMicrophoneEnabled(false)
            console.log('🔇 Microphone muted')
        }
    }

    /**
     * Toggle camera on/off
     */
    async toggleCamera(): Promise<boolean> {
        if (!this.room) return false

        const localParticipant = this.room.localParticipant
        const cameraEnabled = localParticipant.isCameraEnabled

        await localParticipant.setCameraEnabled(!cameraEnabled)
        console.log(`📹 Camera ${!cameraEnabled ? 'enabled' : 'disabled'}`)

        return !cameraEnabled
    }

    /**
     * Toggle screen sharing
     */
    async toggleScreenShare(): Promise<boolean> {
        if (!this.room) return false

        const localParticipant = this.room.localParticipant
        const isSharing = localParticipant.isScreenShareEnabled

        await localParticipant.setScreenShareEnabled(!isSharing)
        console.log(`🖥️ Screen share ${!isSharing ? 'enabled' : 'disabled'}`)

        return !isSharing
    }

    /**
     * Get current room instance
     */
    getRoom(): Room | null {
        return this.room
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.room?.state === 'connected'
    }

    /**
     * Get local participant's microphone state
     */
    isMicrophoneEnabled(): boolean {
        return this.room?.localParticipant?.isMicrophoneEnabled ?? false
    }

    /**
     * Get local participant's camera state
     */
    isCameraEnabled(): boolean {
        return this.room?.localParticipant?.isCameraEnabled ?? false
    }

    /**
     * Get local participant's screen share state
     */
    isScreenShareEnabled(): boolean {
        return this.room?.localParticipant?.isScreenShareEnabled ?? false
    }

    /**
     * Setup event listeners for room events
     */
    private setupEventListeners(): void {
        if (!this.room) return

        // Participant connected
        this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
            console.log('👤 Participant connected:', participant.identity)
            this.onParticipantConnected?.(participant)
        })

        // Participant disconnected
        this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
            console.log('👋 Participant disconnected:', participant.identity)
            this.onParticipantDisconnected?.(participant)
        })

        // Track subscribed
        this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication, participant: RemoteParticipant) => {
            console.log('🎵 Track subscribed:', track.kind, 'from', participant.identity)
            this.onTrackSubscribed?.(track, participant)

            // Auto-play audio tracks
            if (track.kind === Track.Kind.Audio) {
                const audioElement = track.attach()
                audioElement.play()
            }
        })

        // Local speaking changed
        this.room.on(RoomEvent.LocalAudioSilenceDetected, () => {
            this.onSpeakingChanged?.(false)
        })

        // Connection state changed
        this.room.on(RoomEvent.ConnectionStateChanged, (state) => {
            console.log('🔌 Connection state:', state)
        })

        // Reconnecting
        this.room.on(RoomEvent.Reconnecting, () => {
            console.log('↻ Reconnecting to room...')
        })

        // Reconnected
        this.room.on(RoomEvent.Reconnected, () => {
            console.log('✅ Reconnected to room')
        })

        // Disconnected
        this.room.on(RoomEvent.Disconnected, (reason) => {
            console.log('📴 Disconnected from room:', reason)
        })
    }
}

// Singleton instance
let livekitManagerInstance: LiveKitManager | null = null

/**
 * Get singleton instance of LiveKitManager
 */
export function getLiveKitManager(): LiveKitManager {
    if (!livekitManagerInstance) {
        livekitManagerInstance = new LiveKitManager()
    }
    return livekitManagerInstance
}
