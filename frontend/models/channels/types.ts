// Channel and Server Type Definitions
export interface Server {
    _id: string
    name: string
    ownerId: string
    icon?: string
    createdAt: string
    updatedAt: string
}

export interface Channel {
    _id: string
    serverId: string
    name: string
    type: 'text' | 'voice'
    position: number
    createdAt: string
    updatedAt: string
}

export interface Member {
    _id: string
    userId: string
    username: string
    avatar?: string
    role: 'owner' | 'admin' | 'member'
    joinedAt: string
}

export interface Message {
    _id: string
    channelId: string
    senderId: string | { username: string; avatar?: string }
    content: string
    createdAt: string
    updatedAt: string
    editedAt?: string
}

export interface RouteInfo {
    isMe: boolean
    serverId: string | null
    channelId: string | null
}

export interface CreateServerData {
    name: string
}

export interface UpdateServerData {
    name?: string
    icon?: string
}

export interface CreateChannelData {
    serverId: string
    name: string
    type?: 'text' | 'voice'
}

export interface UpdateChannelData {
    name?: string
}

export interface SendMessageData {
    channelId: string
    content: string
}

export interface EditMessageData {
    messageId: string
    content: string
}
