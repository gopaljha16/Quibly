import { useState } from 'react'
import { ChannelsModel } from '@/models/channels/channelsModel'
import { useChannelsData } from '@/hooks/useChannelsData'

/**
 * Create Channel Modal Controller
 * Manages channel creation form state and logic
 */
export function useCreateChannelController(onClose: () => void) {
    const { createChannel, creatingChannel } = useChannelsData()
    const [channelName, setChannelName] = useState('')
    const [error, setError] = useState<string>()

    const handleChange = (value: string) => {
        setChannelName(value)
        // Clear error when user types
        if (error) {
            setError(undefined)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate using Model
        const validationError = ChannelsModel.validateChannelName(channelName)
        if (validationError) {
            setError(validationError)
            return
        }

        try {
            await createChannel(channelName.trim())
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to create channel')
        }
    }

    return {
        channelName,
        error,
        isLoading: creatingChannel,
        handleChange,
        handleSubmit,
    }
}
