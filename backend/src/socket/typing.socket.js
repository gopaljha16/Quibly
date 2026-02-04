const db = require('../config/db')

/**
 * Typing indicator socket handler
 * Manages real-time typing status for channels and DMs
 */

// Track typing users per room: { roomId: Set<userId> }
const typingUsers = new Map()

// Auto-cleanup timers: { `${roomId}-${userId}`: timeoutId }
const typingTimers = new Map()

const TYPING_TIMEOUT = 8000 // 8 seconds

module.exports = (io, socket) => {
    /**
     * User started typing in a channel
     */
    socket.on('typing_start', async ({ channelId, dmRoomId }) => {
        try {
            const userId = socket.user?.id
            const roomId = channelId || dmRoomId

            if (!roomId) {
                return socket.emit('error', { message: 'Channel ID or DM Room ID required' })
            }

            // Verify user exists
            const user = await db.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    avatar: true
                }
            })
            if (!user) {
                return socket.emit('error', { message: 'User not found' })
            }

            // Initialize typing set for this room if needed
            if (!typingUsers.has(roomId)) {
                typingUsers.set(roomId, new Set())
            }

            const roomTypingUsers = typingUsers.get(roomId)

            // Only broadcast if user wasn't already typing
            if (!roomTypingUsers.has(userId)) {
                roomTypingUsers.add(userId)

                const broadcastData = {
                    userId,
                    username: user.username,
                    avatar: user.avatar,
                    channelId,
                    dmRoomId,
                }

                // Broadcast to others in the room
                socket.to(roomId).emit('user_typing', broadcastData)
            }

            // Clear existing timer and set new one
            const timerKey = `${roomId}-${userId}`
            if (typingTimers.has(timerKey)) {
                clearTimeout(typingTimers.get(timerKey))
            }

            // Auto-stop typing after timeout
            const timer = setTimeout(() => {
                handleStopTyping(socket, userId, roomId, channelId, dmRoomId)
            }, TYPING_TIMEOUT)

            typingTimers.set(timerKey, timer)
        } catch (error) {
            console.error('❌ [TYPING] Error handling typing_start:', error)
            socket.emit('error', { message: 'Failed to process typing event' })
        }
    })

    /**
     * User stopped typing in a channel
     */
    socket.on('typing_stop', async ({ channelId, dmRoomId }) => {
        try {
            const userId = socket.user.id
            const roomId = channelId || dmRoomId

            if (!roomId) return

            await handleStopTyping(socket, userId, roomId, channelId, dmRoomId)
        } catch (error) {
            console.error('Error handling typing_stop:', error)
        }
    })

    /**
     * Cleanup typing state when user disconnects
     */
    socket.on('disconnect', async () => {
        try {
            const userId = socket.user?.id
            if (!userId) return

            // Clear all typing states for this user
            for (const [roomId, users] of typingUsers.entries()) {
                if (users.has(userId)) {
                    users.delete(userId)

                    // Broadcast stop typing to room
                    io.to(roomId).emit('user_stopped_typing', { userId })

                    // Clear timer
                    const timerKey = `${roomId}-${userId}`
                    if (typingTimers.has(timerKey)) {
                        clearTimeout(typingTimers.get(timerKey))
                        typingTimers.delete(timerKey)
                    }
                }
            }
        } catch (error) {
            console.error('Error cleaning up typing state on disconnect:', error)
        }
    })
}

/**
 * Helper to handle stop typing logic
 */
async function handleStopTyping(socket, userId, roomId, channelId, dmRoomId) {
    if (!typingUsers.has(roomId)) return

    const roomTypingUsers = typingUsers.get(roomId)

    if (roomTypingUsers.has(userId)) {
        roomTypingUsers.delete(userId)

        // Broadcast to others in the room
        socket.to(roomId).emit('user_stopped_typing', {
            userId,
            channelId,
            dmRoomId,
        })

        // Clear timer
        const timerKey = `${roomId}-${userId}`
        if (typingTimers.has(timerKey)) {
            clearTimeout(typingTimers.get(timerKey))
            typingTimers.delete(timerKey)
        }
    }

    // Cleanup empty room
    if (roomTypingUsers.size === 0) {
        typingUsers.delete(roomId)
    }
}
