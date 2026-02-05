import { useState } from 'react'
import { ChannelsModel } from '@/models/channels/channelsModel'
import { useChannelsData } from '@/hooks/useChannelsData'

/**
 * Create Channel Modal Controller
 * Manages channel creation form state and logic
 */
export function useCreateChannelController(
    onClose: () => void,
    channelType: 'TEXT' | 'VOICE' = 'TEXT',
    isPrivate: boolean = false,
    isReadOnly: boolean = false,
    allowedRoleIds: string[] = []
) {
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

        // Validate privacy settings
        if (isPrivate && allowedRoleIds.length === 0) {
            setError('Please select at least one role for private channels')
            return
        }

        try {
            await createChannel(channelName.trim(), channelType, isPrivate, isReadOnly, allowedRoleIds)
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
