const {createClient} = require("redis");
require("dotenv").config();

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_STRING,
        port: parseInt(process.env.REDIS_PORT_NO)
    }
});

client.on('error', err => console.log('Redis Client Error', err));

// Connect to Redis
const connectRedis = async () => {
    try {
        await client.connect();
        console.log('Connected to Redis successfully');
    } catch (error) {
        console.error('Redis connection failed:', error);
    }
};

// Initialize connection
connectRedis();

// Redis wrapper with common operations
const redisWrapper = {
    async get(key) {
        try {
            return await client.get(key);
        } catch (error) {
            console.error('Redis GET error:', error);
            return null;
        }
    },

    async set(key, value, expireInSeconds = null) {
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
        try {
            return await client.del(key);
        } catch (error) {
            console.error('Redis DEL error:', error);
            return null;
        }
    },

    async expireAt(key, timestamp) {
        try {
            return await client.expireAt(key, timestamp);
        } catch (error) {
            console.error('Redis EXPIREAT error:', error);
            return null;
        }
    },

    async exists(key) {
        try {
            return await client.exists(key);
        } catch (error) {
            console.error('Redis EXISTS error:', error);
            return false;
        }
    }
};

module.exports = redisWrapper;


