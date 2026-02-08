import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface NotificationSettings {
    // Per-channel notification settings
    channelSettings: Record<string, {
        muted: boolean
        muteUntil?: string
        notifyOnAllMessages: boolean
        notifyOnMentions: boolean
        notifyOnKeywords: boolean
    }>
    // Global settings
    keywords: string[]
    enablePushNotifications: boolean
    enableSounds: boolean
    enableDesktopNotifications: boolean
}

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
    // Notification settings
    settings: NotificationSettings

    incrementUnread: (id: string, serverId?: string) => void
    incrementMention: (id: string, serverId?: string) => void
    clearNotifications: (id: string, serverId?: string) => void
    setLastRead: (id: string, timestamp?: string) => void
    
    // New methods for enhanced notifications
    setChannelMuted: (channelId: string, muted: boolean, muteUntil?: string) => void
    setChannelNotificationSettings: (channelId: string, settings: Partial<NotificationSettings['channelSettings'][string]>) => void
    addKeyword: (keyword: string) => void
    removeKeyword: (keyword: string) => void
    togglePushNotifications: () => void
    checkMention: (content: string, username: string, channelId: string) => boolean
    showBrowserNotification: (title: string, body: string, icon?: string) => void
}

export const useNotificationStore = create<NotificationState>()(
    devtools(
        persist(
            (set, get) => ({
                unreads: {},
                mentions: {},
                serverUnreads: {},
                serverMentions: {},
                lastRead: {},
                settings: {
                    channelSettings: {},
                    keywords: [],
                    enablePushNotifications: true,
                    enableSounds: true,
                    enableDesktopNotifications: true,
                },

                incrementUnread: (id: string, serverId?: string) =>
                    set((state) => {
                        // Check if channel is muted
                        const channelSettings = state.settings.channelSettings[id]
                        if (channelSettings?.muted) {
                            if (channelSettings.muteUntil) {
                                const muteUntil = new Date(channelSettings.muteUntil)
                                if (muteUntil > new Date()) {
                                    return state // Still muted
                                }
                            } else {
                                return state // Permanently muted
                            }
                        }

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

                // New methods for enhanced notifications
                setChannelMuted: (channelId: string, muted: boolean, muteUntil?: string) =>
                    set((state) => ({
                        settings: {
                            ...state.settings,
                            channelSettings: {
                                ...state.settings.channelSettings,
                                [channelId]: {
                                    ...state.settings.channelSettings[channelId],
                                    muted,
                                    muteUntil,
                                    notifyOnAllMessages: state.settings.channelSettings[channelId]?.notifyOnAllMessages ?? true,
                                    notifyOnMentions: state.settings.channelSettings[channelId]?.notifyOnMentions ?? true,
                                    notifyOnKeywords: state.settings.channelSettings[channelId]?.notifyOnKeywords ?? true,
                                },
                            },
                        },
                    })),

                setChannelNotificationSettings: (channelId: string, settings: Partial<NotificationSettings['channelSettings'][string]>) =>
                    set((state) => ({
                        settings: {
                            ...state.settings,
                            channelSettings: {
                                ...state.settings.channelSettings,
                                [channelId]: {
                                    ...state.settings.channelSettings[channelId],
                                    muted: state.settings.channelSettings[channelId]?.muted ?? false,
                                    notifyOnAllMessages: state.settings.channelSettings[channelId]?.notifyOnAllMessages ?? true,
                                    notifyOnMentions: state.settings.channelSettings[channelId]?.notifyOnMentions ?? true,
                                    notifyOnKeywords: state.settings.channelSettings[channelId]?.notifyOnKeywords ?? true,
                                    ...settings,
                                },
                            },
                        },
                    })),

                addKeyword: (keyword: string) =>
                    set((state) => ({
                        settings: {
                            ...state.settings,
                            keywords: [...state.settings.keywords, keyword.toLowerCase()],
                        },
                    })),

                removeKeyword: (keyword: string) =>
                    set((state) => ({
                        settings: {
                            ...state.settings,
                            keywords: state.settings.keywords.filter((k: string) => k !== keyword.toLowerCase()),
                        },
                    })),

                togglePushNotifications: () =>
                    set((state) => ({
                        settings: {
                            ...state.settings,
                            enablePushNotifications: !state.settings.enablePushNotifications,
                        },
                    })),

                checkMention: (content: string, username: string, channelId: string) => {
                    const state = get()
                    const lowerContent = content.toLowerCase()
                    
                    // Check for @everyone
                    if (lowerContent.includes('@everyone')) {
                        return true
                    }
                    
                    // Check for @here
                    if (lowerContent.includes('@here')) {
                        return true
                    }
                    
                    // Check for direct mention
                    if (lowerContent.includes(`@${username.toLowerCase()}`)) {
                        return true
                    }
                    
                    // Check for keywords
                    const channelSettings = state.settings.channelSettings[channelId]
                    if (channelSettings?.notifyOnKeywords !== false) {
                        for (const keyword of state.settings.keywords) {
                            if (lowerContent.includes(keyword)) {
                                return true
                            }
                        }
                    }
                    
                    return false
                },

                showBrowserNotification: (title: string, body: string, icon?: string) => {
                    const state = get()
                    
                    if (!state.settings.enableDesktopNotifications) {
                        return
                    }
                    
                    // Request permission if not granted
                    if (typeof window !== 'undefined' && 'Notification' in window) {
                        if (Notification.permission === 'granted') {
                            new Notification(title, {
                                body,
                                icon: icon || '/logo.png',
                                badge: '/logo.png',
                                tag: 'quibly-notification',
                            })
                        } else if (Notification.permission !== 'denied') {
                            Notification.requestPermission().then(permission => {
                                if (permission === 'granted') {
                                    new Notification(title, {
                                        body,
                                        icon: icon || '/logo.png',
                                        badge: '/logo.png',
                                        tag: 'quibly-notification',
                                    })
                                }
                            })
                        }
                    }
                },
            }),
            {
                name: 'notification-storage',
            }
        )
    )
)
