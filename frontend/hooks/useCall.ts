import { useEffect, useRef, useCallback } from 'react'
import { useCallStore } from '@/lib/store'
import { connectSocket } from '@/lib/socket'
import { useProfile } from './queries'
import { apiGet } from '@/lib/api'

export const useCall = () => {
    const { setIncoming, setCalling, setInCall, resetCall, callStep, dmRoomId, otherUser, hasVideo, token, wsUrl } = useCallStore()
    const { data: profile } = useProfile()
    const listenersAttachedRef = useRef(false)

    useEffect(() => {
        const socket = connectSocket()

        const fetchTokenAndJoin = async (dmRoomId: string) => {
            try {
                const response = await apiGet<{ token: string, wsUrl: string, success?: boolean }>(`/dm/token/${dmRoomId}`)
                setInCall((response as any).token, (response as any).wsUrl)
            } catch (error) {
                console.error('Failed to get call token:', error)
                resetCall()
            }
        }

        const handleIncomingCall = (data: { fromUserId: string, fromUser: any, dmRoomId: string, hasVideo: boolean }) => {
            if (useCallStore.getState().callStep === 'idle') {
                setIncoming(data.fromUser, data.dmRoomId, data.hasVideo)
            } else {
                const socket = connectSocket()
                socket.emit('call:busy', { fromUserId: data.fromUserId, dmRoomId: data.dmRoomId })
            }
        }

        const handleCallAccepted = (data: { toUserId: string, dmRoomId: string }) => {
            fetchTokenAndJoin(data.dmRoomId)
        }

        const handleCallRejected = (data: { toUserId: string, dmRoomId: string }) => {
            resetCall()
        }

        const handleCallEnded = (data: { fromUserId: string, dmRoomId: string }) => {
            resetCall()
        }

        const handleCallBusy = (data: { toUserId: string, dmRoomId: string }) => {
            resetCall()
        }

        const attachListeners = () => {
            socket.off('call:incoming', handleIncomingCall)
            socket.off('call:accepted', handleCallAccepted)
            socket.off('call:rejected', handleCallRejected)
            socket.off('call:ended', handleCallEnded)
            socket.off('call:busy', handleCallBusy)

            socket.on('call:incoming', handleIncomingCall)
            socket.on('call:accepted', handleCallAccepted)
            socket.on('call:rejected', handleCallRejected)
            socket.on('call:ended', handleCallEnded)
            socket.on('call:busy', handleCallBusy)

            listenersAttachedRef.current = true
        }

        const handleReconnect = () => {
            attachListeners()
        }

        // Attach listeners initially
        attachListeners()

        // Reattach on reconnection
        socket.on('connect', handleReconnect)

        return () => {
            socket.off('connect', handleReconnect)
            socket.off('call:incoming', handleIncomingCall)
            socket.off('call:accepted', handleCallAccepted)
            socket.off('call:rejected', handleCallRejected)
            socket.off('call:ended', handleCallEnded)
            socket.off('call:busy', handleCallBusy)
            listenersAttachedRef.current = false
        }
    }, [setIncoming, setInCall, resetCall])

    const initiateCall = useCallback((targetUser: any, dmRoomId: string, video: boolean) => {
        const socket = connectSocket()
        setCalling(targetUser, dmRoomId, video)

        const callData = {
            toUserId: targetUser.id || targetUser._id,
            dmRoomId,
            hasVideo: video,
            fromUser: {
                ...profile,
                id: profile?._id || profile?.id
            }
        }
        socket.emit('call:initiate', callData)
    }, [profile, setCalling])

    const acceptCall = useCallback(async () => {
        const currentOtherUser = useCallStore.getState().otherUser
        const currentDmRoomId = useCallStore.getState().dmRoomId

        if (!currentOtherUser || !currentDmRoomId) {
            return
        }

        const socket = connectSocket()
        const acceptData = {
            fromUserId: currentOtherUser.id || currentOtherUser._id,
            dmRoomId: currentDmRoomId
        }
        socket.emit('call:accept', acceptData)

        try {
            const response = await apiGet<{ token: string, wsUrl: string, success?: boolean }>(`/dm/token/${currentDmRoomId}`)
            setInCall((response as any).token, (response as any).wsUrl)
        } catch (error) {
            console.error('Failed to get call token on accept:', error)
            resetCall()
        }
    }, [setInCall, resetCall])

    const rejectCall = useCallback(() => {
        const currentOtherUser = useCallStore.getState().otherUser
        const currentDmRoomId = useCallStore.getState().dmRoomId

        if (currentOtherUser && currentDmRoomId) {
            const socket = connectSocket()
            const rejectData = {
                fromUserId: currentOtherUser.id || currentOtherUser._id,
                dmRoomId: currentDmRoomId
            }
            socket.emit('call:reject', rejectData)
        }
        resetCall()
    }, [resetCall])

    const endCall = useCallback(() => {
        const currentOtherUser = useCallStore.getState().otherUser
        const currentDmRoomId = useCallStore.getState().dmRoomId

        if (currentOtherUser && currentDmRoomId) {
            const socket = connectSocket()
            const endData = {
                targetUserId: currentOtherUser.id || currentOtherUser._id,
                dmRoomId: currentDmRoomId
            }
            socket.emit('call:end', endData)
        }
        resetCall()
    }, [resetCall])

    return {
        callStep,
        dmRoomId,
        otherUser,
        hasVideo,
        token,
        wsUrl,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall
    }
}
