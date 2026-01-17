'use client'

import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

type UserStatus = 'online' | 'idle' | 'dnd' | 'offline'

type UserPresence = {
  userId: string
  username: string
  discriminator: string
  avatar?: string | null
  status: UserStatus
  lastSeen: string
}

type PresenceState = {
  [userId: string]: UserPresence
}

export function usePresence() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [userStatuses, setUserStatuses] = useState<PresenceState>({})
  const [myStatus, setMyStatus] = useState<UserStatus>('offline')
  const [isConnected, setIsConnected] = useState(false)

  // Initialize socket connection
  useEffect(() => {
    const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000').replace(/\/$/, '')
    
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
    })

    setSocket(socketInstance)

    // Connection events
    socketInstance.on('connect', () => {
      console.log('🟢 Presence connected')
      setIsConnected(true)
      // Automatically mark user as online when connected
      socketInstance.emit('user_online')
      setMyStatus('online')
    })

    socketInstance.on('disconnect', () => {
      console.log('🔴 Presence disconnected')
      setIsConnected(false)
      setMyStatus('offline')
    })

    // Listen for user status changes
    socketInstance.on('user_status_change', (data: {
      userId: string
      status: UserStatus
      lastSeen: string
    }) => {
      setUserStatuses(prev => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          status: data.status,
          lastSeen: data.lastSeen
        }
      }))
    })

    // Listen for server online users
    socketInstance.on('server_online_users', (data: {
      serverId: string
      users: UserPresence[]
    }) => {
      const newStatuses: PresenceState = {}
      data.users.forEach(user => {
        newStatuses[user.userId] = user
      })
      setUserStatuses(prev => ({ ...prev, ...newStatuses }))
    })

    // Handle errors
    socketInstance.on('error', (error: string) => {
      console.error('Presence error:', error)
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Change user status
  const changeStatus = useCallback((newStatus: UserStatus) => {
    if (socket && isConnected) {
      socket.emit('change_status', newStatus)
      setMyStatus(newStatus)
    }
  }, [socket, isConnected])

  // Get online users for a server
  const getServerOnlineUsers = useCallback((serverId: string) => {
    if (socket && isConnected) {
      socket.emit('get_server_online_users', serverId)
    }
  }, [socket, isConnected])

  // Get user status
  const getUserStatus = useCallback((userId: string): UserStatus => {
    return userStatuses[userId]?.status || 'offline'
  }, [userStatuses])

  // Get user last seen
  const getUserLastSeen = useCallback((userId: string): Date | null => {
    const lastSeen = userStatuses[userId]?.lastSeen
    return lastSeen ? new Date(lastSeen) : null
  }, [userStatuses])

  // Check if user is online
  const isUserOnline = useCallback((userId: string): boolean => {
    return getUserStatus(userId) === 'online'
  }, [getUserStatus])

  // Auto-detect idle status based on user activity
  useEffect(() => {
    if (!socket || !isConnected || myStatus === 'offline') return

    let idleTimer: NodeJS.Timeout
    let isIdle = false

    const resetIdleTimer = () => {
      clearTimeout(idleTimer)
      
      // If user was idle and now active, mark as online
      if (isIdle && myStatus === 'idle') {
        changeStatus('online')
        isIdle = false
      }

      // Set new idle timer (5 minutes)
      idleTimer = setTimeout(() => {
        if (myStatus === 'online') {
          changeStatus('idle')
          isIdle = true
        }
      }, 5 * 60 * 1000) // 5 minutes
    }

    // Activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true)
    })

    // Initial timer
    resetIdleTimer()

    return () => {
      clearTimeout(idleTimer)
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true)
      })
    }
  }, [socket, isConnected, myStatus, changeStatus])

  // Handle page visibility changes
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, but don't change status immediately
        // Let the idle timer handle it
      } else {
        // Page is visible, mark as online if we were idle
        if (myStatus === 'idle') {
          changeStatus('online')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [socket, isConnected, myStatus, changeStatus])

  return {
    // Connection state
    isConnected,
    myStatus,
    
    // User status functions
    changeStatus,
    getUserStatus,
    getUserLastSeen,
    isUserOnline,
    
    // Server functions
    getServerOnlineUsers,
    
    // All user statuses
    userStatuses,
  }
}