const { createClient } = require("redis");
require("dotenv").config();

let client = null;
let pubClient = null;
let subClient = null;
let isConnected = false;

// Generate unique server ID for this instance
const SERVER_ID = process.env.SERVER_ID || `server_${Date.now()}_${Math.random().toString(36).substring(7)}`;

// Check for any Redis configuration
const hasRedisConfig = process.env.REDIS_HOST || process.env.REDIS_PORT || process.env.REDIS_STRING;

if (hasRedisConfig) {
    const redisConfig = {
        socket: {
            connectTimeout: 5000,
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    console.error('❌ Redis max retries reached');
                    return new Error('Max retries exceeded');
                }
                const delay = Math.min(retries * 100, 3000);
                console.log(`Redis reconnecting... (attempt ${retries}, delay ${delay}ms)`);
                return delay;
            }
        }
    };

    if (process.env.REDIS_PASSWORD) {
        console.log('Connecting to Redis with password authentication...');
        redisConfig.password = process.env.REDIS_PASSWORD;
        // Some managed Redis instances (like Redis Labs) might require a default username,
        // but often just the password is enough. We'll set it just in case, or if REDIS_USER is provided.
        if (process.env.REDIS_USER) {
            redisConfig.username = process.env.REDIS_USER;
        } else if (process.env.REDIS_STRING) {
            redisConfig.username = 'default';
        }
    } else {
        console.log('Connecting to Redis without password...');
    }

    redisConfig.socket.host = process.env.REDIS_HOST || process.env.REDIS_STRING || 'localhost';
    redisConfig.socket.port = parseInt(process.env.REDIS_PORT || process.env.REDIS_PORT_NO) || 6379;

    // Main client for general operations
    client = createClient(redisConfig);

    // Pub/Sub clients for Socket.IO adapter (must be separate instances)
    pubClient = createClient(redisConfig);
    subClient = createClient(redisConfig);

    // Event handlers for main client
    client.on('error', err => console.error('❌ Redis Client Error:', err.message));
    client.on('reconnecting', () => console.log('Redis reconnecting...'));
    client.on('ready', () => {
        isConnected = true;
        console.log('Redis ready');
    });
    client.on('end', () => {
        isConnected = false;
        console.log('Redis connection closed');
    });

    // Event handlers for pub/sub clients
    pubClient.on('error', err => console.error('❌ Redis Pub Error:', err.message));
    pubClient.on('ready', () => console.log('Redis Pub client ready'));

    subClient.on('error', err => console.error('❌ Redis Sub Error:', err.message));
    subClient.on('ready', () => console.log('Redis Sub client ready'));

    // Connect to Redis
    const connectRedis = async () => {
        try {
            await Promise.all([
                client.connect(),
                pubClient.connect(),
                subClient.connect()
            ]);
            isConnected = true;
            console.log(`Connected to Redis successfully (Server ID: ${SERVER_ID})`);
        } catch (error) {
            console.error('❌ Redis connection failed:', error);
            console.log('App will continue without Redis caching');
            isConnected = false;
        }
    };

    // Initialize connection
    connectRedis();
} else {
    console.log('Redis not configured (set REDIS_HOST/REDIS_PORT for local or REDIS_STRING/REDIS_PASSWORD for cloud)');
}

// Redis wrapper with common operations
const redisWrapper = {
    async get(key) {
        if (!client || !isConnected) return null;
        try {
            return await client.get(key);
        } catch (error) {
            console.error('Redis GET error:', error);
            return null;
        }
    },

    async set(key, value, expireInSeconds = null) {
        if (!client || !isConnected) return null;
        try {
            if (expireInSeconds) {
                return await client.setEx(key, expireInSeconds, value);
            }
            return await client.set(key, value);
        } catch (error) {
            console.error('Redis SET error:', error);
            return null;
        }
    },

    async del(key) {
        if (!client || !isConnected) return null;
        try {
            return await client.del(key);
        } catch (error) {
            console.error('Redis DEL error:', error);
            return null;
        }
    },

    async expireAt(key, timestamp) {
        if (!client || !isConnected) return null;
        try {
            return await client.expireAt(key, timestamp);
        } catch (error) {
            console.error('Redis EXPIREAT error:', error);
            return null;
        }
    },

    async exists(key) {
        if (!client || !isConnected) return false;
        try {
            return await client.exists(key);
        } catch (error) {
            console.error('Redis EXISTS error:', error);
            return false;
        }
    },

    // Message caching operations
    async cacheMessage(channelId, message) {
        if (!client || !isConnected) return null;
        try {
            const key = `channel:${channelId}:messages`;
            const score = new Date(message.createdAt).getTime();
            const value = JSON.stringify(message);

            // Add to sorted set (sorted by timestamp)
            await client.zAdd(key, { score, value });

            // Keep only last 100 messages per channel
            await client.zRemRangeByRank(key, 0, -101);

            // Set expiry to 24 hours
            await client.expire(key, 86400);

            return true;
        } catch (error) {
            console.error('Redis cacheMessage error:', error);
            return null;
        }
    },

    async getCachedMessages(channelId, limit = 50) {
        if (!client || !isConnected) return null;
        try {
            const key = `channel:${channelId}:messages`;

            // Get messages in reverse order (newest first)
            const messages = await client.zRange(key, 0, limit - 1, { REV: true });

            return messages.map(msg => JSON.parse(msg));
        } catch (error) {
            console.error('Redis getCachedMessages error:', error);
            return null;
        }
    },

    async addToBatchQueue(message) {
        if (!client || !isConnected) return null;
        try {
            const value = JSON.stringify(message);
            await client.lPush('messages:pending_db_write', value);
            return true;
        } catch (error) {
            console.error('Redis addToBatchQueue error:', error);
            return null;
        }
    },

    async getBatchQueue(limit = 1000) {
        if (!client || !isConnected) return [];
        try {
            const messages = await client.lRange('messages:pending_db_write', 0, limit - 1);
            return messages.map(msg => JSON.parse(msg));
        } catch (error) {
            console.error('Redis getBatchQueue error:', error);
            return [];
        }
    },

    async clearBatchQueue(count) {
        if (!client || !isConnected) return null;
        try {
            // Remove processed messages from the queue
            await client.lTrim('messages:pending_db_write', count, -1);
            return true;
        } catch (error) {
            console.error('Redis clearBatchQueue error:', error);
            return null;
        }
    },

    isConnected() {
        return isConnected;
    },

    // Voice channel operations
    async sadd(key, ...members) {
        if (!client || !isConnected) return null;
        try {
            return await client.sAdd(key, members);
        } catch (error) {
            console.error('Redis SADD error:', error);
            return null;
        }
    },

    async srem(key, ...members) {
        if (!client || !isConnected) return null;
        try {
            return await client.sRem(key, members);
        } catch (error) {
            console.error('Redis SREM error:', error);
            return null;
        }
    },

    async smembers(key) {
        if (!client || !isConnected) return [];
        try {
            return await client.sMembers(key);
        } catch (error) {
            console.error('Redis SMEMBERS error:', error);
            return [];
        }
    },

    async hset(key, field, value) {
        if (!client || !isConnected) return null;
        try {
            // If field is an object, use hSet with object
            if (typeof field === 'object') {
                return await client.hSet(key, field);
            }
            return await client.hSet(key, field, value);
        } catch (error) {
            console.error('Redis HSET error:', error);
            return null;
        }
    },

    async hget(key, field) {
        if (!client || !isConnected) return null;
        try {
            return await client.hGet(key, field);
        } catch (error) {
            console.error('Redis HGET error:', error);
            return null;
        }
    },

    async hgetall(key) {
        if (!client || !isConnected) return {};
        try {
            return await client.hGetAll(key);
        } catch (error) {
            console.error('Redis HGETALL error:', error);
            return {};
        }
    },

    async keys(pattern) {
        if (!client || !isConnected) return [];
        try {
            return await client.keys(pattern);
        } catch (error) {
            console.error('Redis KEYS error:', error);
            return [];
        }
    },

    // Distributed presence operations
    async trackUserOnline(userId, socketId) {
        if (!client || !isConnected) return null;
        try {
            await Promise.all([
                client.sAdd('online:users', userId),
                client.zAdd('online:heartbeats', {
                    score: Date.now(),
                    value: userId
                }),
                client.hSet(`user:${userId}:connection`, {
                    serverId: SERVER_ID,
                    socketId: socketId,
                    connectedAt: Date.now().toString()
                }),
                client.expire(`user:${userId}:connection`, 300) // 5 minute TTL
            ]);
            return true;
        } catch (error) {
            console.error('Redis trackUserOnline error:', error);
            return null;
        }
    },

    async trackUserOffline(userId) {
        if (!client || !isConnected) return null;
        try {
            await Promise.all([
                client.sRem('online:users', userId),
                client.zRem('online:heartbeats', userId),
                client.del(`user:${userId}:connection`)
            ]);
            return true;
        } catch (error) {
            console.error('Redis trackUserOffline error:', error);
            return null;
        }
    },

    async getOnlineUsers() {
        if (!client || !isConnected) return [];
        try {
            return await client.sMembers('online:users');
        } catch (error) {
            console.error('Redis getOnlineUsers error:', error);
            return [];
        }
    },

    async isUserOnline(userId) {
        if (!client || !isConnected) return false;
        try {
            return await client.sIsMember('online:users', userId);
        } catch (error) {
            console.error('Redis isUserOnline error:', error);
            return false;
        }
    },

    async isActuallyConnected(userId) {
        if (!client || !isConnected) return false;
        try {
            // Check if the individual connection key still exists (hasn't expired)
            const exists = await client.exists(`user:${userId}:connection`);
            return exists === 1;
        } catch (error) {
            console.error('Redis isActuallyConnected error:', error);
            return false;
        }
    },

    async refreshConnection(userId) {
        if (!client || !isConnected) return false;
        try {
            await Promise.all([
                client.expire(`user:${userId}:connection`, 300),
                client.zAdd('online:heartbeats', {
                    score: Date.now(),
                    value: userId
                })
            ]);
            return true;
        } catch (error) {
            console.error('Redis refreshConnection error:', error);
            return false;
        }
    },

    async getStaleUsers(maxTimestamp, limit = 100) {
        if (!client || !isConnected) return [];
        try {
            // Find users who haven't updated their heartbeat since maxTimestamp
            // Modern node-redis v4 syntax for ZRANGEBYSCORE
            return await client.zRange('online:heartbeats', '-inf', maxTimestamp, {
                BY: 'SCORE',
                LIMIT: { offset: 0, count: limit }
            });
        } catch (error) {
            console.error('Redis getStaleUsers error:', error);
            return [];
        }
    },

    async removeFromOnline(userId) {
        if (!client || !isConnected) return false;
        try {
            await Promise.all([
                client.sRem('online:users', userId),
                client.zRem('online:heartbeats', userId),
                client.del(`user:${userId}:connection`)
            ]);
            return true;
        } catch (error) {
            console.error('Redis removeFromOnline error:', error);
            return false;
        }
    },

    // Leader election for batch writer
    async acquireLock(lockKey, ttlSeconds = 60) {
        if (!client || !isConnected) return false;
        try {
            const result = await client.set(lockKey, SERVER_ID, {
                NX: true,
                EX: ttlSeconds
            });
            return result === 'OK';
        } catch (error) {
            console.error('Redis acquireLock error:', error);
            return false;
        }
    },

    async releaseLock(lockKey) {
        if (!client || !isConnected) return false;
        try {
            const value = await client.get(lockKey);
            if (value === SERVER_ID) {
                await client.del(lockKey);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Redis releaseLock error:', error);
            return false;
        }
    },

    async getLockOwner(lockKey) {
        if (!client || !isConnected) return null;
        try {
            return await client.get(lockKey);
        } catch (error) {
            console.error('Redis getLockOwner error:', error);
            return null;
        }
    },

    // Getters for Socket.IO adapter
    getPubClient() {
        return pubClient;
    },

    getSubClient() {
        return subClient;
    },

    getServerId() {
        return SERVER_ID;
    }
};

module.exports = redisWrapper;

// Export disconnect function for graceful shutdown
module.exports.disconnectRedis = async () => {
    if (isConnected) {
        try {
            await Promise.allSettled([
                client?.quit(),
                pubClient?.quit(),
                subClient?.quit()
            ]);
            isConnected = false;
            console.log('Redis clients disconnected');
        } catch (err) {
            console.error('Error disconnecting Redis:', err);
        }
    }
};


