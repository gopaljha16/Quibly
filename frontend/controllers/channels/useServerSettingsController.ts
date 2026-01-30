import { useState, useEffect } from 'react'
import { ChannelsModel } from '@/models/channels/channelsModel'
import { useChannelsData } from '@/hooks/useChannelsData'

type ActiveTab = 'overview' | 'members'

/**
 * Server Settings Modal Controller
 * Manages server settings form state and logic
 */
export function useServerSettingsController(serverId: string, onClose: () => void) {
    const { selectedServer, updateServer, deleteServer, leaveServer, ownerId, members, currentUser } = useChannelsData() as any
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
    const [serverName, setServerName] = useState('')
    const [error, setError] = useState<string>()
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const isOwner = ChannelsModel.isOwner(currentUser?._id, ownerId)

    // Initialize form with current server data
    useEffect(() => {
        if (selectedServer) {
            setServerName(selectedServer.name)
        }
    }, [selectedServer])

    const handleNameChange = (value: string) => {
        setServerName(value)
        if (error) {
            setError(undefined)
        }
    }

    const handleSave = async () => {
        // Validate using Model
        const validationError = ChannelsModel.validateServerName(serverName)
        if (validationError) {
            setError(validationError)
            return
        }

        setIsSaving(true)
        try {
            await updateServer(serverId, { name: serverName.trim() })
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to update server')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
            return
        }

        setIsDeleting(true)
        try {
            await deleteServer(serverId)
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to delete server')
            setIsDeleting(false)
        }
    }

    const handleLeave = async () => {
        if (!window.confirm('Are you sure you want to leave this server?')) {
            return
        }

        try {
            await leaveServer(serverId)
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to leave server')
        }
    }

    const handleReset = () => {
        if (selectedServer) {
            setServerName(selectedServer.name)
            setError(undefined)
        }
    }

    return {
        // State
        activeTab,
        serverName,
        error,
        isSaving,
        isDeleting,
        isOwner,
        server: selectedServer,
        members,
        memberCount: members?.length || 0,
        // Actions
        setActiveTab,
        handleNameChange,
        handleSave,
        handleDelete,
        handleLeave,
        handleReset,
    }
}
