'use client'

import { useEffect, useRef, useState } from 'react'
import { connectSocket } from '@/lib/socket'

interface TypingUser {
    userId: string
    username: string
    avatar?: string
}

/**
 * Hook to manage typing indicator with debouncing
 */
export function useTypingIndicator(channelId: string | null, dmRoomId: string | null) {
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
    const [isTyping, setIsTyping] = useState(false)

    const isTypingRef = useRef(false)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const stopTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null)

    const roomId = channelId || dmRoomId

    // Initialize socket and listeners
    useEffect(() => {
        const socket = connectSocket()
        socketRef.current = socket

        const handleUserTyping = (data: TypingUser & { channelId?: string; dmRoomId?: string }) => {
            const eventRoomId = data.channelId || data.dmRoomId
            if (eventRoomId !== roomId) return

            setTypingUsers((prev) => {
                if (prev.some((u) => u.userId === data.userId)) return prev
                return [...prev, { userId: data.userId, username: data.username, avatar: data.avatar }]
            })
        }

        const handleUserStoppedTyping = (data: { userId: string; channelId?: string; dmRoomId?: string }) => {
            const eventRoomId = data.channelId || data.dmRoomId
            if (eventRoomId !== roomId) return

            setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId))
        }

        socket.on('user_typing', handleUserTyping)
        socket.on('user_stopped_typing', handleUserStoppedTyping)

        return () => {
            socket.off('user_typing', handleUserTyping)
            socket.off('user_stopped_typing', handleUserStoppedTyping)
        }
    }, [roomId])

    // Cleanup typing state when room changes
    useEffect(() => {
        setTypingUsers([])
        setIsTyping(false)
        isTypingRef.current = false

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = null
        }
        if (stopTypingTimeoutRef.current) {
            clearTimeout(stopTypingTimeoutRef.current)
            stopTypingTimeoutRef.current = null
        }
    }, [roomId])

    const handleTyping = () => {
        if (!roomId || !socketRef.current) return
        if (!socketRef.current.connected) return

        if (stopTypingTimeoutRef.current) {
            clearTimeout(stopTypingTimeoutRef.current)
            stopTypingTimeoutRef.current = null
        }

        if (!isTypingRef.current) {
            socketRef.current.emit('typing_start', {
                channelId,
                dmRoomId,
            })
            setIsTyping(true)
            isTypingRef.current = true
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        typingTimeoutRef.current = setTimeout(() => {
            if (isTypingRef.current) {
                socketRef.current?.emit('typing_start', {
                    channelId,
                    dmRoomId,
                })
            }
        }, 3000)

        stopTypingTimeoutRef.current = setTimeout(() => {
            handleStopTyping()
        }, 5000)
    }

    const handleStopTyping = () => {
        if (!roomId || !socketRef.current || !isTypingRef.current) return

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = null
        }
        if (stopTypingTimeoutRef.current) {
            clearTimeout(stopTypingTimeoutRef.current)
            stopTypingTimeoutRef.current = null
        }

        socketRef.current.emit('typing_stop', {
            channelId,
            dmRoomId,
        })
        setIsTyping(false)
        isTypingRef.current = false
    }

    useEffect(() => {
        return () => {
            if (isTypingRef.current && socketRef.current) {
                socketRef.current.emit('typing_stop', {
                    channelId,
                    dmRoomId,
                })
            }

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            if (stopTypingTimeoutRef.current) clearTimeout(stopTypingTimeoutRef.current)
        }
    }, [channelId, dmRoomId])

    return {
        typingUsers,
        handleTyping,
        handleStopTyping,
    }
}
