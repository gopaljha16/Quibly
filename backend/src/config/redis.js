const {createClient} = require("redis");
require("dotenv").config();

let client = null;
let isConnected = false;

// Only create client if Redis credentials are provided
if (process.env.REDIS_STRING && process.env.REDIS_PASSWORD) {
    client = createClient({
        username: 'default',
        password: process.env.REDIS_PASSWORD,
        socket: {
            host: process.env.REDIS_STRING,
            port: parseInt(process.env.REDIS_PORT_NO),
            connectTimeout: 5000 // 5 second timeout
        }
    });

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
    console.log('Redis credentials not found, running without cache');
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
    }
};

module.exports = redisWrapper;


