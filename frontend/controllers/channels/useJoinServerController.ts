import { useState } from 'react'
import { ChannelsModel } from '@/models/channels/channelsModel'
import { useChannelsData } from '@/hooks/useChannelsData'

/**
 * Join Server Modal Controller
 * Manages server joining form state and logic
 */
export function useJoinServerController(onClose: () => void) {
    const { joinServer, joiningServer } = useChannelsData()
    const [inviteCode, setInviteCode] = useState('')
    const [error, setError] = useState<string>()

    const handleChange = (value: string) => {
        // Try to extract code from URL if pasted
        let processedValue = value.trim()
        const inviteRegex = /(?:\/invite\/|discord\.gg\/|discord\.com\/invite\/)([a-zA-Z0-9]+)/
        const match = processedValue.match(inviteRegex)
        if (match && match[1]) {
            processedValue = match[1]
        } else if (processedValue.includes('/')) {
            // Last resort for other URL formats
            const parts = processedValue.split('/')
            const lastPart = parts[parts.length - 1]
            if (lastPart) processedValue = lastPart
        }

        setInviteCode(processedValue)
        // Clear error when user types
        if (error) {
            setError(undefined)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const trimmedCode = inviteCode.trim()
        if (!trimmedCode) {
            setError('Invite code is required')
            return
        }

        try {
            await joinServer(inviteCode.trim())
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to join server')
        }
    }

    return {
        inviteCode,
        error,
        isLoading: joiningServer,
        handleChange,
        handleSubmit,
    }
}
