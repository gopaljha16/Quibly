'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Socket } from 'socket.io-client'
import { connectSocket, disconnectSocket } from '@/lib/socket'
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

// Helper to check if user has a token
const hasAuthToken = (): boolean => {
  if (typeof document === 'undefined') return false
  return document.cookie.includes('token=')
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)
  const [hasToken, setHasToken] = useState(false)
  const [renderKey, setRenderKey] = useState(0) // Force re-render

  // Check for token on mount and periodically
  useEffect(() => {
    const checkToken = () => {
      const tokenExists = hasAuthToken()
      setHasToken(tokenExists)
    }

    checkToken()
    
    // Check for token changes every second (e.g., after login)
    const interval = setInterval(checkToken, 1000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Only connect if user is authenticated
    if (!hasToken) {
      console.log('📵 No auth token found, skipping socket connection')
      
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
      console.log('✅ Socket already connected, skipping reconnect')
      return
    }

    console.log('🔌 Connecting socket in provider...')
    
    // Connect socket
    const newSocket = connectSocket()
    
    // Setup event handlers
    const handleConnect = () => {
      console.log('🟢 Socket connected in provider, updating state')
      setSocket(newSocket)
      setIsConnected(true)
      setRenderKey(k => k + 1) // Force re-render
      
      // Setup query sync
      cleanupRef.current = setupSocketQuerySync(newSocket, queryClient)
    }

    const handleDisconnect = () => {
      console.log('🔴 Socket disconnected in provider')
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
  }, [hasToken])

  console.log('🔄 SocketProvider render - socket:', !!socket, 'connected:', isConnected, 'key:', renderKey)

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
