import { io, Socket } from 'socket.io-client'

// Helper function to get token from cookies
const getTokenFromCookies = (): string | null => {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'token') {
      return value
    }
  }
  return null
}

// Singleton socket instance
let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000').replace(/\/$/, '')
    const token = getTokenFromCookies()

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
    })

    socket.on('connect_error', (err) => {
      console.error('🔌 Socket connection error:', err.message)
      // Don't redirect on connection errors - these can happen for many reasons
      // Only redirect on explicit auth_error events from the backend
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    socket.on('auth_error', (data) => {
      console.error('🔌 Socket authentication error:', data?.message || 'User not found')
      // Only redirect if we're not already on the login or signup page
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
          // Clear authentication cookie
          if (typeof document !== 'undefined') {
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
            // Disconnect socket
            socketInstance.disconnect()
            // Redirect to login page
            window.location.href = '/login'
          }
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
    const token = getTokenFromCookies()
    if (token && typeof s.auth === 'object') {
      (s.auth as Record<string, any>).token = token
    }
    s.connect()
  }
  return s
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
