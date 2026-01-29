'use client'

import { useEffect, useRef } from 'react'
import { useMessages, useProfile } from './queries'
import { useSendMessage, useEditMessage, useDeleteMessage } from './mutations'
import { useSocket } from '@/providers/SocketProvider'
import { useUIStore } from '@/lib/store'

/**
 * Unified hook for message operations
 * Handles fetching, sending, editing, deleting messages
 * Manages drafts and socket room joining
 */
export function useMessagesData(channelId: string | null) {
  const { socket } = useSocket()
  const joinedChannelRef = useRef<string | null>(null)
  
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
    
    return () => {
      if (joinedChannelRef.current) {
        socket.emit('leave_channel', joinedChannelRef.current)
        joinedChannelRef.current = null
      }
    }
  }, [socket, channelId])
  
  // Send message
  const sendMessage = async (content: string) => {
    if (!channelId || !content.trim()) return
    
    try {
      await sendMessageMutation.mutateAsync({
        channelId,
        content: content.trim(),
      })
      
      // Clear draft on success
      if (channelId) {
        clearDraft(channelId)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
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
