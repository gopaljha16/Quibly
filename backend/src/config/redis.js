const { createClient } = require("redis");
require("dotenv").config();

let client = null;
let isConnected = false;

// Check for cloud Redis (REDIS_STRING) or local Redis (REDIS_HOST)
const hasCloudRedis = process.env.REDIS_STRING && process.env.REDIS_PASSWORD;
const hasLocalRedis = process.env.REDIS_HOST || process.env.REDIS_PORT;

if (hasCloudRedis || hasLocalRedis) {
    const redisConfig = {
        socket: {
            connectTimeout: 5000 // 5 second timeout
        }
    };

    if (hasCloudRedis) {
        // Cloud Redis configuration (with password)
        console.log('🔧 Connecting to Cloud Redis...');
        redisConfig.username = 'default';
        redisConfig.password = process.env.REDIS_PASSWORD;
        redisConfig.socket.host = process.env.REDIS_STRING;
        redisConfig.socket.port = parseInt(process.env.REDIS_PORT_NO);
    } else {
        // Local Redis configuration (no password)
        console.log('🔧 Connecting to Local Redis...');
        redisConfig.socket.host = process.env.REDIS_HOST || 'localhost';
        redisConfig.socket.port = parseInt(process.env.REDIS_PORT) || 6379;
    }

    client = createClient(redisConfig);

    client.on('error', err => console.log('Redis Client Error', err));

    // Connect to Redis
    const connectRedis = async () => {
        try {
            await client.connect();
            isConnected = true;
            console.log('Connected to Redis successfully');
        } catch (error) {
            console.error('Redis connection failed:', error);
            console.log('App will continue without Redis caching');
            isConnected = false;
        }
    };

    // Initialize connection
    connectRedis();
} else {
    console.log('⚠️  Redis not configured (set REDIS_HOST/REDIS_PORT for local or REDIS_STRING/REDIS_PASSWORD for cloud)');
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
    }
};

module.exports = redisWrapper;

// Export disconnect function for graceful shutdown
module.exports.disconnectRedis = async () => {
    if (client && isConnected) {
        await client.quit();
        isConnected = false;
        console.log('Redis client disconnected');
    }
};


