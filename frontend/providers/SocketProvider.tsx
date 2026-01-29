'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Socket } from 'socket.io-client'
import { connectSocket } from '@/lib/socket'
import { setupSocketQuerySync } from '@/lib/socketQuerySync'
import { queryClient } from '@/lib/queryClient'

type SocketContextValue = {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
})

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    // Connect socket
    const socket = connectSocket()
    socketRef.current = socket

    // Setup event handlers
    const handleConnect = () => {
      console.log('🟢 Socket connected')
      setIsConnected(true)
      
      // Setup query sync
      cleanupRef.current = setupSocketQuerySync(socket, queryClient)
    }

    const handleDisconnect = () => {
      console.log('🔴 Socket disconnected')
      setIsConnected(false)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    // Check if already connected
    if (socket.connected) {
      handleConnect()
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      
      // Cleanup query sync
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}
