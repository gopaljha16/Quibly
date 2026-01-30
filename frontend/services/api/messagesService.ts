import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'
import type { Message, SendMessageData, EditMessageData } from '@/models/channels/types'

/**
 * Messages API Service
 * Handles all message-related API calls
 */
export class MessagesApiService {
    /**
     * Get messages for a channel
     */
    static async getMessages(channelId: string): Promise<Message[]> {
        return apiGet<Message[]>(`/messages/${channelId}`)
    }

    /**
     * Send a new message
     */
    static async sendMessage(data: SendMessageData): Promise<Message> {
        return apiPost<Message>('/messages', {
            channelId: data.channelId,
            content: data.content,
        })
    }

    /**
     * Edit a message
     */
    static async editMessage(data: EditMessageData): Promise<Message> {
        return apiPatch<Message>(`/messages/${data.messageId}`, {
            content: data.content,
        })
    }

    /**
     * Delete a message
     */
    static async deleteMessage(messageId: string): Promise<void> {
        return apiDelete(`/messages/${messageId}`)
    }
}
