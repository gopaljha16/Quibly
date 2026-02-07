const db = require('../config/db');
const redis = require('../config/redis');

let isRunning = false;
let intervalId = null;
let isLeader = false;

const BATCH_INTERVAL = 30000; // 30 seconds
const MAX_BATCH_SIZE = 500; // Process max 500 messages per batch
const LOCK_KEY = 'batch-writer-leader';
const LOCK_TTL = 60; // 60 seconds

/**
 * Batch DB Writer Service with Leader Election
 * Only ONE server instance processes the batch at a time
 * Uses Redis distributed lock for leader election
 */

async function processBatch() {
    if (!redis.isConnected()) {
        return;
    }

    try {
        // Try to acquire leader lock
        const acquired = await redis.acquireLock(LOCK_KEY, LOCK_TTL);

        if (!acquired) {
            // Another server is the leader
            if (isLeader) {
                console.log(`Lost leadership - another server is now batch writer leader`);
                isLeader = false;
            }
            return;
        }

        // We are the leader!
        if (!isLeader) {
            console.log(`Acquired batch writer leadership (Server: ${redis.getServerId()})`);
            isLeader = true;
        }

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
                senderId: senderId,
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

        console.log(`[LEADER] Saved ${result.count} messages to PostgreSQL`);

        // Clear processed messages from queue
        await redis.clearBatchQueue(messages.length);
    } catch (error) {
        console.error('❌ Batch DB write error:', error);
        // Release lock on error
        if (isLeader) {
            await redis.releaseLock(LOCK_KEY);
            isLeader = false;
        }
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

    console.log(`Batch DB writer started (interval: ${intervalMs / 1000} seconds)`);

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

        // Release leadership lock
        if (isLeader && redis.isConnected()) {
            redis.releaseLock(LOCK_KEY).then(() => {
                console.log('Released batch writer leadership');
                isLeader = false;
            });
        }
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
