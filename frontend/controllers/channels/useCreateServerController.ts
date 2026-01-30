import { useState } from 'react'
import { ChannelsModel } from '@/models/channels/channelsModel'
import { ServerApiService } from '@/services/api/channelsService'
import { useChannelsData } from '@/hooks/useChannelsData'

/**
 * Create Server Modal Controller
 * Manages server creation form state and logic
 */
export function useCreateServerController(onClose: () => void) {
    const { createServer, creatingServer } = useChannelsData()
    const [serverName, setServerName] = useState('')
    const [error, setError] = useState<string>()

    const handleChange = (value: string) => {
        setServerName(value)
        // Clear error when user types
        if (error) {
            setError(undefined)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate using Model
        const validationError = ChannelsModel.validateServerName(serverName)
        if (validationError) {
            setError(validationError)
            return
        }

        try {
            await createServer(serverName.trim())
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to create server')
        }
    }

    return {
        serverName,
        error,
        isLoading: creatingServer,
        handleChange,
        handleSubmit,
    }
}
