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
        setInviteCode(value)
        // Clear error when user types
        if (error) {
            setError(undefined)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate using Model
        const validationError = ChannelsModel.validateInviteCode(inviteCode)
        if (validationError) {
            setError(validationError)
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
