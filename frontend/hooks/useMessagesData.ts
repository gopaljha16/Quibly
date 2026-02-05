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
export function useMessagesData(id: string | null, type: 'channel' | 'dm' = 'channel') {
  const [socket, setSocket] = useState<ReturnType<typeof connectSocket> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const joinedRoomRef = useRef<{ id: string; type: 'channel' | 'dm' } | null>(null)
  const queryClient = useQueryClient()
  const { data: currentUser } = useProfile()

  // Use a Ref to avoid closure staleness in the socket listener
  const currentUserIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (currentUser?._id) {
      currentUserIdRef.current = currentUser._id
    }
  }, [currentUser])

  // Helper to deduplicate messages by ID and sort them by date if needed
  const deduplicate = (messages: Message[]) => {
    const seen = new Set()
    return messages.filter(m => {
      const id = m._id
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
  }

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
      const msgTargetId = msg.channelId || msg.dmRoomId

      if (!msgTargetId) return

      // Add message to cache with IRONCLAD DEDUPLICATION
      queryClient.setQueryData<Message[]>(['messages', msgTargetId], (old = []) => {
        // 1. If this exact message ID already exists, update it but don't add a new one
        if (old?.some((m) => m._id === msg._id)) {
          return old.map((m) => (m._id === msg._id ? msg : m))
        }

        // 2. SOCIAL DEDUPLICATION: Replace optimistic match for CURRENT USER
        const msgSenderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId
        const currentUserId = currentUserIdRef.current

        // If it's from me, look for an optimistic message to replace
        if (msgSenderId && currentUserId && msgSenderId === currentUserId) {
          const optimisticIndex = old.findIndex(m =>
            m._id.startsWith('optimistic-') &&
            m.content.trim() === msg.content.trim()
          )

          if (optimisticIndex !== -1) {
            const newMessages = [...old]
            newMessages[optimisticIndex] = msg
            return deduplicate(newMessages)
          }
        }

        // 3. Normal addition + Final Deduplication Layer
        return deduplicate([...(old || []), msg])
      })
    }

    // Handle message updates (edits)
    const handleMessageUpdated = (incoming: any) => {
      const msg = incoming as Message
      const msgTargetId = msg.channelId || msg.dmRoomId

      if (!msgTargetId) return

      // Update message in cache
      queryClient.setQueryData<Message[]>(['messages', msgTargetId], (old = []) => {
        return old.map((m) => (m._id === msg._id ? msg : m))
      })
    }

    socketInstance.on('connect', handleConnect)
    socketInstance.on('disconnect', handleDisconnect)
    socketInstance.on('receive_message', handleReceiveMessage)
    socketInstance.on('message_updated', handleMessageUpdated)

    // Check if already connected
    if (socketInstance.connected) {
      handleConnect()
    }

    return () => {
      socketInstance.off('connect', handleConnect)
      socketInstance.off('disconnect', handleDisconnect)
      socketInstance.off('receive_message', handleReceiveMessage)
      socketInstance.off('message_updated', handleMessageUpdated)
    }
  }, [queryClient]) // This listener is global and persistent

  // Socket room management (separate effect for clean room hopping)
  useEffect(() => {
    if (!socket || !id) return

    const joinRoom = () => {
      if (!socket.connected) return

      const prevRoom = joinedRoomRef.current

      // Leave previous room if different
      if (prevRoom && (prevRoom.id !== id || prevRoom.type !== type)) {
        socket.emit(prevRoom.type === 'channel' ? 'leave_channel' : 'leave_dm', prevRoom.id)
      }

      // Join new room
      socket.emit(type === 'channel' ? 'join_channel' : 'join_dm', id)
      joinedRoomRef.current = { id, type }
    }

    if (socket.connected) joinRoom()
    socket.on('connect', joinRoom)

    return () => {
      socket.off('connect', joinRoom)
    }
  }, [socket, isConnected, id, type])

  // Queries
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useMessages(id, type)

  // Mutations
  const sendMessageMutation = useSendMessage()
  const editMessageMutation = useEditMessage()
  const deleteMessageMutation = useDeleteMessage()

  // Drafts from Zustand
  const { drafts, setDraft, clearDraft } = useUIStore()
  const draft = id ? (drafts[id] || '') : ''

  // Edit state from Zustand
  const {
    editingMessageId,
    editingMessageContent,
    startEditingMessage,
    stopEditingMessage,
  } = useUIStore()

  // Send message
  const sendMessage = async (content: string, typeMod: 'TEXT' | 'FILE' = 'TEXT', attachments: any[] = []) => {
    if (!id || (!content.trim() && attachments.length === 0)) return

    // Clear draft IMMEDIATELY for instant feedback
    const trimmedContent = content.trim()
    if (id) {
      clearDraft(id)
    }

    // Create optimistic message
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMessage: Message = {
      _id: optimisticId,
      channelId: type === 'channel' ? id : undefined,
      dmRoomId: type === 'dm' ? id : undefined,
      serverId: '',
      senderId: currentUser ? {
        _id: currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar
      } : '',
      content: trimmedContent,
      type: typeMod,
      attachments,
      createdAt: new Date().toISOString(),
    }

    // Add optimistic message to cache IMMEDIATELY
    queryClient.setQueryData<Message[]>(['messages', id], (old = []) => {
      return [...old, optimisticMessage]
    })

    try {
      // Send to server
      const newMessage = await sendMessageMutation.mutateAsync({
        channelId: type === 'channel' ? id : undefined,
        dmRoomId: type === 'dm' ? id : undefined,
        content: trimmedContent,
        type: typeMod,
        attachments,
      })

      // REPLACE optimistic message with real one IMMEDIATELY
      // This prevents the flicker while waiting for the socket
      queryClient.setQueryData<Message[]>(['messages', id], (old = []) => {
        const withReal = old.map(m => m._id === optimisticId ? newMessage : m)
        return deduplicate(withReal)
      })
    } catch (error) {
      console.error('Failed to send message:', error)

      // On error, remove optimistic message
      queryClient.setQueryData<Message[]>(['messages', id], (old = []) => {
        return old.filter(m => m._id !== optimisticId)
      })

      // Restore draft so user can retry
      if (id) {
        setDraft(id, trimmedContent)
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
    if (!id) return

    try {
      await deleteMessageMutation.mutateAsync({
        messageId,
        channelId: type === 'channel' ? id : undefined,
        dmRoomId: type === 'dm' ? id : undefined,
      })
    } catch (error) {
      console.error('Failed to delete message:', error)
      throw error
    }
  }

  // Update draft
  const updateDraft = (content: string) => {
    if (id) {
      setDraft(id, content)
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
    messages: deduplicate(messages),
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
    clearDraft: () => id && clearDraft(id),

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
