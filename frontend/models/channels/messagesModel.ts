/**
 * Messages Model - Business logic for messages
 * Pure functions for message formatting and validation
 */
export class MessagesModel {
    /**
     * Format message timestamp
     */
    static formatTimestamp(createdAt: string | Date): string {
        const date = new Date(createdAt)
        const today = new Date()
        const isToday = date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()

        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const isYesterday = date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear()

        const timeStr = date.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
        })

        if (isToday) {
            return `Today at ${timeStr}`
        } else if (isYesterday) {
            return `Yesterday at ${timeStr}`
        } else {
            return `${date.toLocaleDateString()} ${timeStr}`
        }
    }

    /**
     * Get sender display name
     */
    static getSenderName(senderId: string | { username: string; avatar?: string }): string {
        if (typeof senderId === 'string') {
            return senderId === 'me' ? 'You' : senderId
        }
        return senderId.username
    }

    /**
     * Get sender initials
     */
    static getSenderInitials(senderName: string): string {
        return senderName?.slice(0, 1).toUpperCase() || 'U'
    }

    /**
     * Validate message content
     */
    static validateMessage(content: string): string | undefined {
        if (!content || !content.trim()) {
            return 'Message cannot be empty'
        }
        if (content.trim().length > 2000) {
            return 'Message is too long (max 2000 characters)'
        }
        return undefined
    }

    /**
     * Check if message is optimistic
     */
    static isOptimistic(messageId: string): boolean {
        return messageId.startsWith('optimistic-')
    }

    /**
     * Extract URLs from message content
     */
    static extractUrls(content: string): string[] {
        const urlRegex = /(https?:\/\/[^\s]+)/g
        return content.match(urlRegex) || []
    }

    /**
     * Check if message can be edited/deleted
     */
    static canModify(messageId: string): boolean {
        return !this.isOptimistic(messageId)
    }

    /**
     * Format edited indicator
     */
    static getEditedLabel(editedAt?: string): string {
        return editedAt ? '(edited)' : ''
    }
}
