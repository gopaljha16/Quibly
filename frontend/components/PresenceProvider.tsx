'use client'

import { createContext, useContext, ReactNode } from 'react'
import { usePresence } from '@/lib/usePresence'

type UserStatus = 'online' | 'idle' | 'dnd' | 'offline'

type PresenceContextType = {
  isConnected: boolean
  myStatus: UserStatus
  changeStatus: (status: UserStatus) => void
  getUserStatus: (userId: string) => UserStatus
  getUserLastSeen: (userId: string) => Date | null
  isUserOnline: (userId: string) => boolean
  getServerOnlineUsers: (serverId: string) => void
  userStatuses: { [userId: string]: any }
}

const PresenceContext = createContext<PresenceContextType | null>(null)

export function PresenceProvider({ children }: { children: ReactNode }) {
  const presence = usePresence()

  return (
    <PresenceContext.Provider value={presence}>
      {children}
    </PresenceContext.Provider>
  )
}

export function usePresenceContext() {
  const context = useContext(PresenceContext)
  if (!context) {
    throw new Error('usePresenceContext must be used within a PresenceProvider')
  }
  return context
}