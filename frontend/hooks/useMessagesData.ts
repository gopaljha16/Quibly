'use client'

import { useEffect, useRef, useState } from 'react'
import { useMessages, useProfile } from './queries'
import { useSendMessage, useEditMessage, useDeleteMessage } from './mutations'
import { connectSocket } from '@/lib/socket'
import { useUIStore } from '@/lib/store'
import { useQueryClient } from '@tanstack/react-query'
import { Message } from './queries'

/**
 * Unified hook for message operations
 * Handles fetching, sending, editing, deleting messages
 * Manages drafts and socket room joining
 */
export function useMessagesData(channelId: string | null) {
  const [socket, setSocket] = useState<ReturnType<typeof connectSocket> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const joinedChannelRef = useRef<string | null>(null)
  const queryClient = useQueryClient()

  // Initialize socket connection and set up message listener
  useEffect(() => {
    const socketInstance = connectSocket()
    setSocket(socketInstance)

    const handleConnect = () => {
      setIsConnected(true)
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    // Handle incoming messages
    const handleReceiveMessage = (incoming: any) => {
      const msg = incoming as Message
      const msgChannelId = msg.channelId

      if (!msgChannelId) return

      // Add message to cache
      queryClient.setQueryData<Message[]>(['messages', msgChannelId], (old = []) => {
        const exists = old?.some((m) => m._id === msg._id)
        if (exists) {
          return old.map((m) => (m._id === msg._id ? msg : m))
        }
        return [...(old || []), msg]
      })
    }

    socketInstance.on('connect', handleConnect)
    socketInstance.on('disconnect', handleDisconnect)
    socketInstance.on('receive_message', handleReceiveMessage)

    // Check if already connected
    if (socketInstance.connected) {
      handleConnect()
    }

    return () => {
      socketInstance.off('connect', handleConnect)
      socketInstance.off('disconnect', handleDisconnect)
      socketInstance.off('receive_message', handleReceiveMessage)
    }
  }, [queryClient])

  // Queries
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useMessages(channelId)
  const { data: currentUser } = useProfile()

  // Mutations
  const sendMessageMutation = useSendMessage()
  const editMessageMutation = useEditMessage()
  const deleteMessageMutation = useDeleteMessage()

  // Drafts from Zustand
  const { drafts, setDraft, clearDraft } = useUIStore()
  const draft = channelId ? (drafts[channelId] || '') : ''

  // Edit state from Zustand
  const {
    editingMessageId,
    editingMessageContent,
    startEditingMessage,
    stopEditingMessage,
  } = useUIStore()

  // Socket room management
  useEffect(() => {
    if (!socket || !channelId) return

    const joinChannel = () => {
      if (!socket.connected) return

      const prevChannel = joinedChannelRef.current

      // Leave previous channel
      if (prevChannel && prevChannel !== channelId) {
        socket.emit('leave_channel', prevChannel)
      }

      // Join new channel
      if (joinedChannelRef.current !== channelId) {
        socket.emit('join_channel', channelId)
        joinedChannelRef.current = channelId
      }
    }

    // Join immediately if already connected
    if (socket.connected) {
      joinChannel()
    }

    // Also join when socket connects
    socket.on('connect', joinChannel)

    return () => {
      socket.off('connect', joinChannel)

      if (joinedChannelRef.current) {
        socket.emit('leave_channel', joinedChannelRef.current)
        joinedChannelRef.current = null
      }
    }
  }, [socket, isConnected, channelId])

  // Send message
  const sendMessage = async (content: string) => {
    if (!channelId || !content.trim()) return

    // Clear draft IMMEDIATELY for instant feedback
    const trimmedContent = content.trim()
    if (channelId) {
      clearDraft(channelId)
    }

    // Create optimistic message
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMessage: Message = {
      _id: optimisticId,
      channelId,
      serverId: '',
      senderId: currentUser ? {
        _id: currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar
      } : '',
      content: trimmedContent,
      createdAt: new Date().toISOString(),
    }

    // Add optimistic message to cache IMMEDIATELY
    queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) => {
      return [...old, optimisticMessage]
    })

    try {
      // Send to server in background
      await sendMessageMutation.mutateAsync({
        channelId,
        content: trimmedContent,
      })

      // Success! The real message will come via Socket.IO
      // Remove optimistic message when real one arrives (handled in handleReceiveMessage)
      queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) => {
        return old.filter(m => m._id !== optimisticId)
      })
    } catch (error) {
      console.error('Failed to send message:', error)

      // On error, remove optimistic message
      queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) => {
        return old.filter(m => m._id !== optimisticId)
      })

      // Restore draft so user can retry
      if (channelId) {
        setDraft(channelId, trimmedContent)
      }

      throw error
    }
  }

  // Edit message
  const editMessage = async (messageId: string, content: string) => {
    if (!content.trim()) return

    try {
      await editMessageMutation.mutateAsync({
        messageId,
        content: content.trim(),
      })
      stopEditingMessage()
    } catch (error) {
      console.error('Failed to edit message:', error)
      throw error
    }
  }

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!channelId) return

    try {
      await deleteMessageMutation.mutateAsync({
        messageId,
        channelId,
      })
    } catch (error) {
      console.error('Failed to delete message:', error)
      throw error
    }
  }

  // Update draft
  const updateDraft = (content: string) => {
    if (channelId) {
      setDraft(channelId, content)
    }
  }

  // Start editing
  const startEditing = (messageId: string, content: string) => {
    startEditingMessage(messageId, content)
  }

  // Cancel editing
  const cancelEditing = () => {
    stopEditingMessage()
  }

  // Save edit
  const saveEdit = async () => {
    if (editingMessageId && editingMessageContent.trim()) {
      await editMessage(editingMessageId, editingMessageContent)
    }
  }

  return {
    // Data
    messages,
    currentUser,

    // Loading states
    messagesLoading,
    sending: sendMessageMutation.isPending,
    editing: editMessageMutation.isPending,
    deleting: deleteMessageMutation.isPending,

    // Errors
    messagesError,
    sendError: sendMessageMutation.error,
    editError: editMessageMutation.error,
    deleteError: deleteMessageMutation.error,

    // Draft state
    draft,
    updateDraft,
    clearDraft: () => channelId && clearDraft(channelId),

    // Edit state
    editingMessageId,
    editingMessageContent,
    startEditing,
    cancelEditing,
    saveEdit,

    // Operations
    sendMessage,
    editMessage,
    deleteMessage,
  }
}
