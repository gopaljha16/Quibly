import { create } from 'zustand'

export type CallStep = 'idle' | 'calling' | 'incoming' | 'in-call'

interface CallState {
    callStep: CallStep
    dmRoomId: string | null
    otherUser: any | null
    hasVideo: boolean
    token: string | null
    wsUrl: string | null

    // Actions
    setCalling: (otherUser: any, dmRoomId: string, hasVideo: boolean) => void
    setIncoming: (fromUser: any, dmRoomId: string, hasVideo: boolean) => void
    setInCall: (token: string, wsUrl: string) => void
    resetCall: () => void
}

export const useCallStore = create<CallState>((set) => ({
    callStep: 'idle',
    dmRoomId: null,
    otherUser: null,
    hasVideo: false,
    token: null,
    wsUrl: null,

    setCalling: (otherUser, dmRoomId, hasVideo) =>
        set({ callStep: 'calling', otherUser, dmRoomId, hasVideo }),

    setIncoming: (fromUser, dmRoomId, hasVideo) =>
        set({ callStep: 'incoming', otherUser: fromUser, dmRoomId, hasVideo }),

    setInCall: (token, wsUrl) =>
        set({ callStep: 'in-call', token, wsUrl }),

    resetCall: () =>
        set({ callStep: 'idle', dmRoomId: null, otherUser: null, hasVideo: false, token: null, wsUrl: null }),
}))
