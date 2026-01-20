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
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: false, // Don't connect until explicitly told to
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: token
      }
    })

    // Debug events
    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket?.id)
    })

    socket.on('connect_error', (err) => {
      console.error('🔌 Socket connection error:', err.message)
      console.error('Make sure you are logged in and have a valid token')
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
    })
  }

  return socket
}

export const connectSocket = () => {
  const s = getSocket()
  if (!s.connected) {
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
