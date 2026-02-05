'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useSocket } from '@/providers/SocketProvider'
import { useProfile } from '@/hooks/queries'
import { useNotificationStore } from '@/lib/store/notificationStore'
import { useUIStore } from '@/lib/store/uiStore'
import { useIdle } from '@/hooks/useIdle'
import { Message } from '@/hooks/queries'

export function NotificationManager() {
  const { socket, isConnected } = useSocket()
  const { data: currentUser } = useProfile()
  const { incrementUnread, incrementMention } = useNotificationStore()
  const { selectedChannelId } = useUIStore()
  const isIdle = useIdle(30000) // 30 seconds idle threshold
  const router = useRouter()
  const pathname = usePathname()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Extract current channel ID from pathname as a fallback
  const getChannelIdFromPath = () => {
    const parts = pathname.split('/')
    if (parts.length >= 4 && parts[1] === 'channels') {
      return parts[3] === '@me' ? parts[4] : parts[3]
    }
    return null
  }

  useEffect(() => {
    if (!socket || !isConnected || !currentUser) return

    const handleReceiveMessage = (incoming: any) => {
      const msg = incoming as Message
      const msgTargetId = msg.channelId || msg.dmRoomId
      if (!msgTargetId) return

      // Don't notify if we are in the target channel
      const activeChannelId = selectedChannelId || getChannelIdFromPath()
      if (msgTargetId === activeChannelId) return

      // Check if user is mentioned
      const isMentioned = msg.mentions?.includes(currentUser._id) || 
                          (msg.content && msg.content.includes(`@${currentUser.username}`))

      if (isMentioned) {
        incrementMention(msgTargetId, msg.serverId)
      } else {
        incrementUnread(msgTargetId, msg.serverId)
      }

      // If idle, don't show toast or play sound
      if (isIdle) return

      // Play sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(e => console.log('Audio play failed:', e))
      }

      // Show clickable premium toast
      const senderName = typeof msg.senderId === 'object' ? msg.senderId.username : 'Someone'
      // Construct redirect URL
      const redirectUrl = msg.channelId 
        ? `/channels/${msg.serverId}/${msg.channelId}` 
        : `/channels/@me/${msg.dmRoomId}`

      toast.custom((t) => (
        <div 
          className="bg-[#2b2d31] border border-[#1e1f22] p-4 rounded-lg shadow-2xl flex items-start gap-4 cursor-pointer hover:bg-[#35373c] transition-colors min-w-[320px] animate-in slide-in-from-right duration-300"
          onClick={() => {
            router.push(redirectUrl)
            toast.dismiss(t)
          }}
        >
          <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold flex-shrink-0">
            {typeof msg.senderId === 'object' && msg.senderId.avatar ? (
              <img src={msg.senderId.avatar} className="w-full h-full rounded-full object-cover" />
            ) : (
                senderName[0].toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white text-sm">{senderName}</span>
              <span className="text-[10px] text-[#949ba4]">New Message</span>
            </div>
            <p className="text-[#dbdee1] text-sm truncate">
              {msg.type === 'FILE' ? 'Sent a file' : msg.content}
            </p>
          </div>
        </div>
      ), {
        position: 'bottom-right',
        duration: 5000,
      })
    }

    socket.on('receive_message', handleReceiveMessage)

    return () => {
      socket.off('receive_message', handleReceiveMessage)
    }
  }, [socket, isConnected, currentUser, selectedChannelId, pathname, isIdle, incrementUnread, incrementMention, router])

  return (
    <>
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
    </>
  )
}
