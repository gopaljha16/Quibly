// Simple test script to verify backend functionality
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const db = require('./src/config/db');
        const userCount = await db.user.count();
        res.json({
            success: true,
            message: 'Database connection successful',
            userCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Test Redis connection
app.get('/test-redis', async (req, res) => {
    try {
        const redis = require('./src/config/redis');
        await redis.set('test', 'hello', 10);
        const value = await redis.get('test');
        res.json({
            success: true,
            message: 'Redis connection successful',
            testValue: value
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Redis connection failed',
            error: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date(),
        env: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
            JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
            FRONTEND_URL: process.env.FRONTEND_URL
        }
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🧪 Test server running on port ${PORT}`);
    console.log(`📊 Test endpoints:`);
    console.log(`   GET /health - Server health check`);
    console.log(`   GET /test-db - Database connection test`);
    console.log(`   GET /test-redis - Redis connection test`);
});