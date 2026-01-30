import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'
import type {
    Server,
    Channel,
    CreateServerData,
    UpdateServerData,
    CreateChannelData,
    UpdateChannelData,
} from '@/models/channels/types'

/**
 * Server API Service
 * Handles all server-related API calls
 */
export class ServerApiService {
    /**
     * Get all servers for current user
     */
    static async getServers(): Promise<Server[]> {
        return apiGet<Server[]>('/servers')
    }

    /**
     * Create a new server
     */
    static async createServer(name: string): Promise<Server> {
        return apiPost<Server>('/servers', { name })
    }

    /**
     * Join a server by ID
     */
    static async joinServer(serverId: string): Promise<void> {
        return apiPost(`/servers/${serverId}/join`, {})
    }

    /**
     * Leave a server
     */
    static async leaveServer(serverId: string): Promise<void> {
        return apiPost(`/servers/${serverId}/leave`, {})
    }

    /**
     * Delete a server (owner only)
     */
    static async deleteServer(serverId: string): Promise<void> {
        return apiDelete(`/servers/${serverId}`)
    }

    /**
     * Update server settings
     */
    static async updateServer(serverId: string, updates: UpdateServerData): Promise<Server> {
        return apiPatch<Server>(`/servers/${serverId}`, updates)
    }

    /**
     * Get server members
     */
    static async getMembers(serverId: string): Promise<{ members: any[]; ownerId: string }> {
        return apiGet(`/servers/${serverId}/members`)
    }
}

/**
 * Channel API Service
 * Handles all channel-related API calls
 */
export class ChannelApiService {
    /**
     * Get channels for a server
     */
    static async getChannels(serverId: string): Promise<Channel[]> {
        return apiGet<Channel[]>(`/servers/${serverId}/channels`)
    }

    /**
     * Create a new channel
     */
    static async createChannel(data: CreateChannelData): Promise<{ channel: Channel }> {
        return apiPost(`/servers/${data.serverId}/channels`, {
            name: data.name,
            type: data.type || 'text',
        })
    }

    /**
     * Update channel settings
     */
    static async updateChannel(
        serverId: string,
        channelId: string,
        updates: UpdateChannelData
    ): Promise<Channel> {
        return apiPatch<Channel>(`/servers/${serverId}/channels/${channelId}`, updates)
    }

    /**
     * Delete a channel
     */
    static async deleteChannel(serverId: string, channelId: string): Promise<void> {
        return apiDelete(`/servers/${serverId}/channels/${channelId}`)
    }

    /**
     * Reorder channels
     */
    static async reorderChannels(serverId: string, channelIds: string[]): Promise<void> {
        return apiPost(`/servers/${serverId}/channels/reorder`, { channelIds })
    }
}
