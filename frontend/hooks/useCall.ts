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
                console.log('🎫 Fetching call token for room:', dmRoomId)
                const response = await apiGet<{ token: string, wsUrl: string, success?: boolean }>(`/dm/token/${dmRoomId}`)
                console.log('✅ Token received:', { 
                    hasToken: !!(response as any).token, 
                    wsUrl: (response as any).wsUrl 
                })
                setInCall((response as any).token, (response as any).wsUrl)
            } catch (error) {
                console.error('❌ Failed to get call token:', error)
                resetCall()
            }
        }

        const handleIncomingCall = (data: { fromUserId: string, fromUser: any, dmRoomId: string, hasVideo: boolean }) => {
            console.log('📞 Incoming call received:', data)
            if (useCallStore.getState().callStep === 'idle') {
                setIncoming(data.fromUser, data.dmRoomId, data.hasVideo)
            } else {
                console.log('⚠️ Already in a call, sending busy signal')
                socket.emit('call:busy', { fromUserId: data.fromUserId, dmRoomId: data.dmRoomId })
            }
        }

        const handleCallAccepted = (data: { toUserId: string, dmRoomId: string }) => {
            console.log('✅ Call accepted:', data)
            fetchTokenAndJoin(data.dmRoomId)
        }

        const handleCallRejected = (data: { toUserId: string, dmRoomId: string }) => {
            console.log('❌ Call rejected:', data)
            resetCall()
        }

        const handleCallEnded = (data: { fromUserId: string, dmRoomId: string }) => {
            console.log('🔴 Call ended:', data)
            resetCall()
        }

        const handleCallBusy = (data: { toUserId: string, dmRoomId: string }) => {
            console.log('⚠️ Call busy:', data)
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
        console.log('🔵 useCall.initiateCall:', { targetUser, dmRoomId, video })
        const socket = connectSocket()
        setCalling(targetUser, dmRoomId, video)
        
        const callData = {
            toUserId: targetUser.id,
            dmRoomId,
            hasVideo: video,
            fromUser: profile
        }
        console.log('📤 Emitting call:initiate from useCall:', callData)
        socket.emit('call:initiate', callData)
    }, [profile, setCalling])

    const acceptCall = useCallback(async () => {
        const currentOtherUser = useCallStore.getState().otherUser
        const currentDmRoomId = useCallStore.getState().dmRoomId

        console.log('✅ Accepting call:', { currentOtherUser, currentDmRoomId })

        if (!currentOtherUser || !currentDmRoomId) {
            console.error('❌ Cannot accept call: Missing user or room ID')
            return
        }

        const socket = connectSocket()
        const acceptData = {
            fromUserId: currentOtherUser.id,
            dmRoomId: currentDmRoomId
        }
        console.log('📤 Emitting call:accept:', acceptData)
        socket.emit('call:accept', acceptData)

        try {
            console.log('🎫 Fetching token for accepted call...')
            const response = await apiGet<{ token: string, wsUrl: string, success?: boolean }>(`/dm/token/${currentDmRoomId}`)
            console.log('✅ Token received for accepted call')
            setInCall((response as any).token, (response as any).wsUrl)
        } catch (error) {
            console.error('❌ Failed to get call token on accept:', error)
            resetCall()
        }
    }, [setInCall, resetCall])

    const rejectCall = useCallback(() => {
        const currentOtherUser = useCallStore.getState().otherUser
        const currentDmRoomId = useCallStore.getState().dmRoomId

        console.log('❌ Rejecting call:', { currentOtherUser, currentDmRoomId })

        if (!currentOtherUser || !currentDmRoomId) {
            console.error('❌ Cannot reject call: Missing user or room ID')
            return
        }

        const socket = connectSocket()
        const rejectData = {
            fromUserId: currentOtherUser.id,
            dmRoomId: currentDmRoomId
        }
        console.log('📤 Emitting call:reject:', rejectData)
        socket.emit('call:reject', rejectData)
        resetCall()
    }, [resetCall])

    const endCall = useCallback(() => {
        const currentOtherUser = useCallStore.getState().otherUser
        const currentDmRoomId = useCallStore.getState().dmRoomId

        console.log('🔴 Ending call:', { currentOtherUser, currentDmRoomId })

        if (!currentOtherUser || !currentDmRoomId) {
            console.log('⚠️ No active call to end, just resetting state')
            resetCall()
            return
        }

        const socket = connectSocket()
        const endData = {
            targetUserId: currentOtherUser.id,
            dmRoomId: currentDmRoomId
        }
        console.log('📤 Emitting call:end:', endData)
        socket.emit('call:end', endData)
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
