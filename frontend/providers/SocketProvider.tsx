'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Socket } from 'socket.io-client'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { setupSocketQuerySync } from '@/lib/socketQuerySync'
import { queryClient } from '@/lib/queryClient'
import { useProfile } from '@/hooks/queries/useProfile'

type SocketContextValue = {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
})

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)
  const [renderKey, setRenderKey] = useState(0)
  
  // Use profile to determine if user is authenticated
  const { data: currentUser } = useProfile()
  const hasUser = !!currentUser

  useEffect(() => {
    // Only connect if user is authenticated
    if (!hasUser) {
      console.log('No user found, skipping socket connection')
      
      // Disconnect if previously connected
      if (socket) {
        disconnectSocket()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Don't reconnect if already connected
    if (socket?.connected) {
      console.log('Socket already connected, skipping reconnect')
      return
    }

    console.log('Connecting socket in provider...')
    
    // Connect socket
    const newSocket = connectSocket()
    
    // Setup event handlers
    const handleConnect = () => {
      console.log('Socket connected in provider, updating state')
      setSocket(newSocket)
      setIsConnected(true)
      setRenderKey(k => k + 1) // Force re-render
      
      // Setup query sync
      cleanupRef.current = setupSocketQuerySync(newSocket, queryClient)
    }

    const handleDisconnect = () => {
      console.log('Socket disconnected in provider')
      setIsConnected(false)
      setRenderKey(k => k + 1) // Force re-render
    }

    newSocket.on('connect', handleConnect)
    newSocket.on('disconnect', handleDisconnect)

    // Check if already connected
    if (newSocket.connected) {
      handleConnect()
    } else {
      // Set socket immediately even if not connected yet
      setSocket(newSocket)
      setRenderKey(k => k + 1)
    }

    return () => {
      newSocket.off('connect', handleConnect)
      newSocket.off('disconnect', handleDisconnect)
      
      // Cleanup query sync
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [hasUser])

  console.log('SocketProvider render - socket:', !!socket, 'connected:', isConnected, 'key:', renderKey)

  return (
    <SocketContext.Provider value={{ socket, isConnected }} key={renderKey}>
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
