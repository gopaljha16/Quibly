import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface NotificationState {
    // unreads: Record<id, count> (id can be channelId or dmRoomId)
    unreads: Record<string, number>
    // mentions: Record<id, count>
    mentions: Record<string, number>
    // serverUnreads: Record<serverId, count>
    serverUnreads: Record<string, number>
    // serverMentions: Record<serverId, count>
    serverMentions: Record<string, number>
    // lastRead: Record<id, timestamp>
    lastRead: Record<string, string>

    incrementUnread: (id: string, serverId?: string) => void
    incrementMention: (id: string, serverId?: string) => void
    clearNotifications: (id: string, serverId?: string) => void
    setLastRead: (id: string, timestamp?: string) => void
}

export const useNotificationStore = create<NotificationState>()(
    devtools(
        persist(
            (set) => ({
                unreads: {},
                mentions: {},
                serverUnreads: {},
                serverMentions: {},
                lastRead: {},

                incrementUnread: (id: string, serverId?: string) =>
                    set((state) => {
                        const newUnreads = {
                            ...state.unreads,
                            [id]: (state.unreads[id] || 0) + 1,
                        }
                        const newServerUnreads = serverId ? {
                            ...state.serverUnreads,
                            [serverId]: (state.serverUnreads[serverId] || 0) + 1,
                        } : state.serverUnreads

                        return {
                            unreads: newUnreads,
                            serverUnreads: newServerUnreads,
                        }
                    }),

                incrementMention: (id: string, serverId?: string) =>
                    set((state) => {
                        const newMentions = {
                            ...state.mentions,
                            [id]: (state.mentions[id] || 0) + 1,
                        }
                        const newUnreads = {
                            ...state.unreads,
                            [id]: (state.unreads[id] || 0) + 1,
                        }
                        const newServerMentions = serverId ? {
                            ...state.serverMentions,
                            [serverId]: (state.serverMentions[serverId] || 0) + 1,
                        } : state.serverMentions
                        const newServerUnreads = serverId ? {
                            ...state.serverUnreads,
                            [serverId]: (state.serverUnreads[serverId] || 0) + 1,
                        } : state.serverUnreads

                        return {
                            mentions: newMentions,
                            unreads: newUnreads,
                            serverMentions: newServerMentions,
                            serverUnreads: newServerUnreads,
                        }
                    }),

                clearNotifications: (id: string, serverId?: string) =>
                    set((state) => {
                        const unreadCount = state.unreads[id] || 0
                        const mentionCount = state.mentions[id] || 0

                        const { [id]: _u, ...restUnreads } = state.unreads
                        const { [id]: _m, ...restMentions } = state.mentions

                        const newServerUnreads = serverId ? {
                            ...state.serverUnreads,
                            [serverId]: Math.max(0, (state.serverUnreads[serverId] || 0) - unreadCount),
                        } : state.serverUnreads

                        const newServerMentions = serverId ? {
                            ...state.serverMentions,
                            [serverId]: Math.max(0, (state.serverMentions[serverId] || 0) - mentionCount),
                        } : state.serverMentions

                        return {
                            unreads: restUnreads,
                            mentions: restMentions,
                            serverUnreads: newServerUnreads,
                            serverMentions: newServerMentions,
                            lastRead: {
                                ...state.lastRead,
                                [id]: new Date().toISOString(),
                            },
                        }
                    }),

                setLastRead: (id: string, timestamp?: string) =>
                    set((state) => ({
                        lastRead: {
                            ...state.lastRead,
                            [id]: timestamp || new Date().toISOString(),
                        },
                    })),
            }),
            {
                name: 'discord-notification-store',
            }
        )
    )
)
