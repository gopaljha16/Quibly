const db = require('../config/db');
const redis = require('../config/redis');

let isRunning = false;
let intervalId = null;

/**
 * Batch DB Writer Service
 * Processes messages from Redis queue and saves them to PostgreSQL in batches
 * Runs every 30 seconds (configurable)
 */

const BATCH_INTERVAL = 30000; // 30 seconds
const MAX_BATCH_SIZE = 500; // Process max 5 messages per batch

async function processBatch() {
    if (!redis.isConnected()) {
        return;
    }

    try {
        // Get messages from batch queue
        const messages = await redis.getBatchQueue(MAX_BATCH_SIZE);

        if (messages.length === 0) {
            return;
        }

        // Prepare data for batch insert
        const messagesToInsert = messages.map(msg => {
            // Ensure senderId is a string
            let senderId = msg.senderId;
            if (typeof senderId === 'object' && senderId !== null) {
                senderId = senderId._id || senderId.id;
            }

            return {
                id: msg.id,
                channelId: msg.channelId,
                serverId: msg.serverId,
                senderId: senderId, // Use extracted string ID
                content: msg.content,
                type: msg.type || 'TEXT',
                attachments: msg.attachments || [],
                mentions: msg.mentions || [],
                createdAt: new Date(msg.createdAt),
                parentId: msg.parentId || null
            };
        });

        // Batch insert to database
        const result = await db.message.createMany({
            data: messagesToInsert,
            skipDuplicates: true
        });

        console.log(`✅ Saved ${result.count} messages to PostgreSQL`);

        // Clear processed messages from queue
        await redis.clearBatchQueue(messages.length);
    } catch (error) {
        console.error('Batch DB write error:', error);
    }
}

/**
 * Start the batch DB writer service
 * @param {number} intervalMs - Interval in milliseconds (default: 30 seconds)
 */
function startBatchWriter(intervalMs = BATCH_INTERVAL) {
    if (isRunning) {
        return;
    }

    console.log(`✅ Batch DB writer started (interval: ${intervalMs / 1000} seconds)`);

    // Run immediately on start
    processBatch();

    // Then run on interval
    intervalId = setInterval(processBatch, intervalMs);
    isRunning = true;
}

/**
 * Stop the batch DB writer service
 */
function stopBatchWriter() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        isRunning = false;
    }
}

/**
 * Manually trigger a batch write (useful for testing or graceful shutdown)
 */
async function flushBatch() {
    await processBatch();
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    await flushBatch();
    stopBatchWriter();
});

process.on('SIGINT', async () => {
    await flushBatch();
    stopBatchWriter();
});

module.exports = {
    startBatchWriter,
    stopBatchWriter,
    flushBatch,
    isRunning: () => isRunning
};
