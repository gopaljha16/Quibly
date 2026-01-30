import type { RouteInfo } from './types'

/**
 * Channels Model - Business logic for channels and navigation
 * Pure functions, no React dependencies
 */
export class ChannelsModel {
    /**
     * Parse pathname to extract route information
     */
    static parseRoute(pathname: string): RouteInfo {
        const parts = pathname.split('/').filter(Boolean)
        if (parts[0] !== 'channels') {
            return { isMe: false, serverId: null, channelId: null }
        }

        const slug = parts.slice(1)
        if (slug.length === 1 && slug[0] === '@me') {
            return { isMe: true, serverId: null, channelId: null }
        }

        const serverId = slug.length >= 1 ? slug[0] : null
        const channelId = slug.length >= 2 ? slug[1] : null
        return { isMe: false, serverId, channelId }
    }

    /**
     * Build channel URL
     */
    static buildChannelUrl(serverId: string, channelId: string): string {
        return `/channels/${serverId}/${channelId}`
    }

    /**
     * Build server URL
     */
    static buildServerUrl(serverId: string): string {
        return `/channels/${serverId}`
    }

    /**
     * Get @me URL
     */
    static getMeUrl(): string {
        return '/channels/@me'
    }

    /**
     * Validate server name
     */
    static validateServerName(name: string): string | undefined {
        if (!name || !name.trim()) {
            return 'Server name is required'
        }
        if (name.trim().length < 2) {
            return 'Server name must be at least 2 characters'
        }
        if (name.trim().length > 100) {
            return 'Server name must be less than 100 characters'
        }
        return undefined
    }

    /**
     * Validate channel name
     */
    static validateChannelName(name: string): string | undefined {
        if (!name || !name.trim()) {
            return 'Channel name is required'
        }
        if (name.trim().length < 2) {
            return 'Channel name must be at least 2 characters'
        }
        if (name.trim().length > 100) {
            return 'Channel name must be less than 100 characters'
        }
        return undefined
    }

    /**
     * Validate invite code
     */
    static validateInviteCode(code: string): string | undefined {
        if (!code || !code.trim()) {
            return 'Invite code is required'
        }
        // Assuming invite codes are server IDs or special codes
        if (code.trim().length < 3) {
            return 'Invalid invite code'
        }
        return undefined
    }

    /**
     * Format member count
     */
    static formatMemberCount(count: number): string {
        if (count === 1) return '1 member'
        return `${count} members`
    }

    /**
     * Check if user is owner
     */
    static isOwner(userId: string | undefined, ownerId: string | null): boolean {
        if (!userId || !ownerId) return false
        return userId === ownerId
    }
}
