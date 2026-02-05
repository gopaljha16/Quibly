const db = require('../config/db');
const { publishMessage } = require('../services/messageProducer');
const { isKafkaConnected } = require('../config/kafka');

/**
 * Creates a system message in a channel/DM and broadcasts it.
 */
async function createSystemMessage({ channelId, dmRoomId, serverId, content, metadata = {} }) {
    try {
        const messageId = `sys_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const messageData = {
            id: messageId,
            channelId: channelId || null,
            dmRoomId: dmRoomId || null,
            serverId: serverId || null,
            senderId: null, // DB expects null or a valid User ID
            content: content,
            type: 'SYSTEM',
            metadata: metadata || {},
            createdAt: new Date().toISOString(),
            attachments: [],
            mentions: []
        };

        // Save to DB
        await db.message.create({
            data: {
                id: messageId,
                channelId: channelId || null,
                dmRoomId: dmRoomId || null,
                serverId: serverId || null,
                senderId: null, // System messages don't have a user sender
                content: content,
                type: 'SYSTEM',
                metadata: metadata || {},
                createdAt: new Date(messageData.createdAt)
            }
        });

        // Broadcast via Kafka/WebSocket if available
        if (isKafkaConnected()) {
            // Include a mock sender object for the broadcast if needed
            await publishMessage({
                ...messageData,
                senderId: {
                    _id: 'system',
                    username: 'System',
                    avatar: null
                }
            });
        }

        // Also broadcast directly via global.io if available
        if (global.io) {
            const room = channelId || dmRoomId;
            if (room) {
                global.io.to(room).emit('receive_message', {
                    _id: messageId,
                    ...messageData,
                    senderId: {
                        _id: 'system',
                        username: 'System',
                        avatar: null
                    }
                });
            }
        }

        return messageData;
    } catch (error) {
        console.error('Error creating system message:', error);
        return null;
    }
}

module.exports = { createSystemMessage };
