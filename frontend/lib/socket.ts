import { io, Socket } from 'socket.io-client'

// Helper function to get token from cookies or localStorage
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null

  // Try localStorage first (more reliable in production)
  const localToken = localStorage.getItem('token')
  if (localToken) {
    console.log('[Socket] Using token from localStorage')
    return localToken
  }

  // Fall back to cookies
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'token') {
        console.log('[Socket] Using token from cookie')
        return value
      }
    }
  }

  console.log('[Socket] No token found')
  return null
}

// Singleton socket instance and heartbeat interval
let socket: Socket | null = null
let heartbeatInterval: NodeJS.Timeout | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000').replace(/\/$/, '')
    const token = getToken()

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // Add polling fallback for load balancer compatibility
      withCredentials: true,
      autoConnect: false, // Don't connect until explicitly told to
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: token
      }
    })

    // Capture socket instance for use in event handlers
    const socketInstance = socket

    socket.on('connect', () => {
      console.log('Socket connected:', socketInstance?.id)

      // Start heartbeat
      if (heartbeatInterval) clearInterval(heartbeatInterval)
      heartbeatInterval = setInterval(() => {
        if (socketInstance.connected) {
          socketInstance.emit('presence:heartbeat')
        }
      }, 120000) // Every 2 minutes
    })

    socket.on('connect_error', (err) => {
      console.error('🔌 Socket connection error:', err.message)
      // Don't redirect on connection errors - these can happen for many reasons
      // Only redirect on explicit auth_error events from the backend
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)

      // Stop heartbeat
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }
    })

    socket.on('auth_error', (data) => {
      console.error('🔌 Socket authentication error:', data?.message || 'User not found')
      // Only redirect if we're not already on the login or signup page
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
          // Clear all authentication state
          if (typeof document !== 'undefined') {
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          }
          // Clear localStorage tokens
          localStorage.removeItem('token')
          localStorage.removeItem('auth-storage')
          // Disconnect socket
          socketInstance.disconnect()
          // Redirect to login page
          window.location.href = '/login'
        }
      }
    })
  }

  return socket
}

export const connectSocket = () => {
  const s = getSocket()
  if (!s.connected) {
    // Refresh token in auth before connecting
    const token = getToken()
    if (token && typeof s.auth === 'object') {
      (s.auth as Record<string, any>).token = token
      console.log('[Socket] Updated auth token before connecting')
    }
    s.connect()
  }
  return s
}

export const disconnectSocket = () => {
  if (socket) {
    // Stop heartbeat
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
    socket.disconnect()
    socket = null
  }
}
