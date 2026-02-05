const { kafka, isKafkaConnected } = require('../config/kafka');
const db = require('../config/db');
const redis = require('../config/redis');
const { TOPIC_CHAT_MESSAGES } = require('./messageProducer');

let consumer = null;
let isRunning = false;

/**
 * Start the Kafka consumer (Fanout Service)
 * This service consumes messages from Kafka and:
 * 1. Caches them in Redis
 * 2. Adds to batch queue for DB write
 * 3. Broadcasts to WebSocket clients
 */
async function startFanoutService() {
    if (!isKafkaConnected() || isRunning) {
        console.error('Fanout service not started (Kafka not connected or already running)');
        return;
    }

    try {
        consumer = kafka.consumer({
            groupId: 'chat-fanout-service',
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
            maxWaitTimeInMs: 100,
            minBytes: 1,
            maxBytes: 10485760,
        });

        await consumer.connect();
        console.log('✅ Fanout service connected to Kafka');

        await consumer.subscribe({
            topic: TOPIC_CHAT_MESSAGES,
            fromBeginning: false,
        });

        isRunning = true;

        await consumer.run({
            autoCommit: true,
            autoCommitInterval: 1000,
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const messageData = JSON.parse(message.value.toString());
                    await processMessage(messageData);
                } catch (error) {
                    console.error('Error processing message from Kafka:', error);
                }
            },
        });

        console.log('✅ Fanout service is running');
    } catch (error) {
        console.error('Failed to start fanout service:', error);
        isRunning = false;
    }
}

/**
 * Process a single message from Kafka
 * @param {Object} messageData - Message data from Kafka
 */
async function processMessage(messageData) {
    try {
        const targetId = messageData.channelId || messageData.dmRoomId;

        // STEP 1: Cache in Redis
        if (redis.isConnected()) {
            await redis.cacheMessage(targetId, {
                _id: messageData.id,
                channelId: messageData.channelId || null,
                dmRoomId: messageData.dmRoomId || null,
                serverId: messageData.serverId,
                senderId: {
                    _id: messageData.senderId,
                    username: messageData.sender?.username,
                    discriminator: messageData.sender?.discriminator,
                    avatar: messageData.sender?.avatar
                },
                content: messageData.content,
                type: messageData.type || 'TEXT',
                attachments: messageData.attachments || [],
                mentions: messageData.mentions || [],
                createdAt: messageData.createdAt,
                isDeleted: false,
                parentId: messageData.parentId || null
            });

            // STEP 2: Add to batch queue for DB write
            await redis.addToBatchQueue(messageData);
        } else {
            // Fallback: Direct DB write if Redis is down
            const existingMessage = await db.message.findUnique({
                where: { id: messageData.id }
            });

            if (!existingMessage) {
                await db.message.create({
                    data: {
                        id: messageData.id,
                        channelId: messageData.channelId || null,
                        dmRoomId: messageData.dmRoomId || null,
                        serverId: messageData.serverId,
                        senderId: messageData.senderId,
                        content: messageData.content,
                        type: messageData.type || 'TEXT',
                        attachments: messageData.attachments || [],
                        mentions: messageData.mentions || [],
                        createdAt: new Date(messageData.createdAt),
                        parentId: messageData.parentId || null
                    }
                });
            }
        }

        // STEP 3: Broadcast is REMOVED here.
        // Direct broadcast happens in messageController.js or message.socket.js
        // for instant delivery, before the message even hits Kafka.
        // Re-broadcasting here causes duplicate messages.

    } catch (error) {
        console.error('Error in processMessage:', error);
        throw error;
    }
}

/**
 * Stop the fanout service gracefully
 */
async function stopFanoutService() {
    if (consumer && isRunning) {
        try {
            await consumer.disconnect();
            isRunning = false;
            console.log('Fanout service stopped');
        } catch (error) {
            console.error('Error stopping fanout service:', error);
        }
    }
}

// Handle graceful shutdown
process.on('SIGTERM', stopFanoutService);
process.on('SIGINT', stopFanoutService);

module.exports = {
    startFanoutService,
    stopFanoutService,
    isRunning: () => isRunning,
};
