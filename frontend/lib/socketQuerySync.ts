'use client'

import { QueryClient } from '@tanstack/react-query'
import { Socket } from 'socket.io-client'
import { Message } from '@/hooks/queries'

/**
 * Syncs socket events with TanStack Query cache
 * Call this once when socket connects
 */
export function setupSocketQuerySync(socket: Socket, queryClient: QueryClient) {
  // Handle new messages
  socket.on('receive_message', (incoming: any) => {
    console.log('📨 FRONTEND: receive_message event received:', incoming)
    const msg = incoming as Message
    const channelId = msg.channelId
    
    if (!channelId) {
      console.log('⚠️  No channelId in message, skipping')
      return
    }
    
    console.log('✅ Adding message to cache for channel:', channelId)
    
    // Add message to cache
    queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) => {
      // Check if message already exists
      const exists = old.some((m) => m._id === msg._id)
      if (exists) {
        console.log('   Message already exists, updating')
        // Update existing message
        return old.map((m) => (m._id === msg._id ? msg : m))
      }
      console.log('   Adding new message to cache')
      // Add new message
      return [...old, msg]
    })
  })
  
  // Handle message deletion
  socket.on('message_deleted', (data: { messageId: string; channelId?: string }) => {
    const { messageId, channelId } = data
    
    if (channelId) {
      // Remove from specific channel
      queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) =>
        old.filter((m) => m._id !== messageId)
      )
    } else {
      // Remove from all channels (less efficient but works)
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    }
  })
  
  // Handle message edit
  socket.on('message_edited', (updatedMessage: Message) => {
    const channelId = updatedMessage.channelId
    
    queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) =>
      old.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
    )
  })
  
  // Handle server updates (if you add socket events for these)
  socket.on('server_updated', (data: { serverId: string; icon?: string }) => {
    if (data.icon) {
      // Update specific server icon in cache
      queryClient.setQueryData<any[]>(['servers'], (old = []) =>
        old.map((s) => (s._id === data.serverId ? { ...s, icon: data.icon } : s))
      )
    } else {
      // General server update, invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ['servers'] })
    }
  })
  
  socket.on('channel_created', (data: { serverId: string }) => {
    queryClient.invalidateQueries({ queryKey: ['channels', data.serverId] })
  })
  
  socket.on('channel_deleted', (data: { serverId: string }) => {
    queryClient.invalidateQueries({ queryKey: ['channels', data.serverId] })
  })
  
  socket.on('member_joined', (data: { serverId: string }) => {
    queryClient.invalidateQueries({ queryKey: ['members', data.serverId] })
  })
  
  socket.on('member_left', (data: { serverId: string }) => {
    queryClient.invalidateQueries({ queryKey: ['members', data.serverId] })
  })
  
  return () => {
    // Cleanup function
    socket.off('receive_message')
    socket.off('message_deleted')
    socket.off('message_edited')
    socket.off('server_updated')
    socket.off('channel_created')
    socket.off('channel_deleted')
    socket.off('member_joined')
    socket.off('member_left')
  }
}
