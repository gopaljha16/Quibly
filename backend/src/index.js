require('dotenv').config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const db = require("./config/db");
const { startFanoutService } = require("./services/messageFanout");

const app = express();
const server = http.createServer(app);

// Middleware
// Add server ID to all responses for debugging
app.use((req, res, next) => {
    res.setHeader('X-Server-ID', require('./config/redis').getServerId());
    next();
});

// Parse FRONTEND_URL to support multiple origins
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, curl)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // In development, allow all origins
            if (process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
const routes = require('./routes');
app.use('/api', routes);

// Health check with detailed status
app.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            serverId: require('./config/redis').getServerId(),
            uptime: process.uptime(),
            services: {
                redis: false,
                kafka: false,
                database: false,
                socketio: false
            }
        };

        // Check Redis
        const redis = require('./config/redis');
        health.services.redis = redis.isConnected();

        // Check Kafka
        const { isKafkaConnected } = require('./config/kafka');
        health.services.kafka = isKafkaConnected();

        // Check Database
        try {
            await db.$queryRaw`SELECT 1`;
            health.services.database = true;
        } catch (dbErr) {
            health.services.database = false;
        }

        // Check Socket.IO
        health.services.socketio = global.io ? true : false;
        
        // Add Socket.IO connection count
        if (global.io) {
            health.socketConnections = global.io.engine.clientsCount;
        }

        // Check if batch writer is leader
        if (health.services.redis) {
            const lockOwner = await redis.getLockOwner('batch-writer-leader');
            health.batchWriterLeader = lockOwner === redis.getServerId();
        }

        // Overall health status
        const allHealthy = Object.values(health.services).every(v => v === true);
        health.status = allHealthy ? 'healthy' : 'degraded';

        res.status(allHealthy ? 200 : 503).json(health);
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Debug endpoint to see connected users (only in development)
app.get('/debug/connections', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: 'Only available in development' });
    }
    
    try {
        const redis = require('./config/redis');
        const serverId = redis.getServerId();
        
        // Get all connected sockets on this server
        const sockets = await global.io?.fetchSockets() || [];
        const connectedUsers = sockets.map(s => ({
            userId: s.userId,
            socketId: s.id,
            rooms: Array.from(s.rooms)
        }));
        
        res.json({
            serverId,
            connectionCount: sockets.length,
            connectedUsers,
            redisConnected: redis.isConnected()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test route (can be removed later)
app.get("/", async (req, res) => {
    try {
        const users = await db.user.findMany({
            take: 5,
            select: {
                id: true,
                username: true,
                email: true,
                discriminator: true
            }
        });
        res.status(200).json({
            success: true,
            message: 'Discord Backend API',
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching data',
            error: error.message
        });
    }
});

// 404 handler for unmatched routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.path}`,
        availableRoutes: [
            '/api/auth/*',
            '/api/users/*',
            '/api/server/*',
            '/api/message/*',
            '/api/link-preview/*'
        ]
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            error: err.message
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
require('./socket')(server);

// Start batch DB writer service (writes to DB every 30 seconds)
const { startBatchWriter } = require('./services/batchDBWriter');
const redis = require('./config/redis');

// Wait a bit for Redis to connect, then start batch writer and presence cleanup
setTimeout(() => {
    if (redis.isConnected()) {
        console.log('Starting batch DB writer service...');
        startBatchWriter(); // Runs every 30 seconds, processes 5 messages per batch
        
        // Start presence cleanup job
        console.log('Starting presence cleanup job...');
        setInterval(async () => {
            try {
                // Get all users marked as online in Redis
                const onlineUserIds = await redis.getOnlineUsers();
                
                if (onlineUserIds.length === 0) return;
                
                console.log(`Checking ${onlineUserIds.length} online users for stale connections...`);
                
                // Check each user to see if they actually have active connections
                for (const userId of onlineUserIds) {
                    const isActuallyOnline = await redis.isUserOnline(userId);
                    
                    if (!isActuallyOnline) {
                        // User is in Redis but has no active connection - clean up
                        console.log(`Cleaning up stale user: ${userId}`);
                        
                        // Update database
                        await db.user.update({
                            where: { id: userId },
                            data: {
                                status: "offline",
                                lastSeen: new Date()
                            }
                        }).catch(err => console.error(`Error updating user ${userId}:`, err));
                        
                        // Remove from Redis
                        await redis.trackUserOffline(userId);
                        
                        // Broadcast offline status
                        if (global.io) {
                            global.io.emit("user_status_change", {
                                userId,
                                status: "offline",
                                lastSeen: new Date().toISOString()
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Error in presence cleanup job:", error);
            }
        }, 30000); // Run every 30 seconds
    } else {
        console.log('Batch writer not started (Redis not connected)');
    }
}, 2000);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Email: ${process.env.EMAIL_USER}`);

    // Verify LiveKit configuration
    if (process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET && process.env.LIVEKIT_WS_URL) {
        console.log('LiveKit configured:');
        console.log(`   - API Key: ${process.env.LIVEKIT_API_KEY.substring(0, 10)}...`);
        console.log(`   - Secret Length: ${process.env.LIVEKIT_API_SECRET.length} chars`);
        console.log(`   - WebSocket URL: ${process.env.LIVEKIT_WS_URL}`);
    } else {
        console.warn('⚠️  LiveKit NOT configured - voice features will not work');
        console.warn('   Missing:', {
            apiKey: !process.env.LIVEKIT_API_KEY,
            apiSecret: !process.env.LIVEKIT_API_SECRET,
            wsUrl: !process.env.LIVEKIT_WS_URL
        });
    }

    console.log(` Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(` Socket.IO server initialized`);

    // Wait for Kafka to connect, then start fanout service
    global.onKafkaConnected = () => {
        console.log("Kafka connected! Now starting fanout service...");
        startFanoutService().catch(err => {
            console.error('Failed to start fanout service:', err);
        });
    };

    // Also try to start immediately in case Kafka is already connected
    setTimeout(() => {
        const { isKafkaConnected } = require('./config/kafka');
        if (isKafkaConnected()) {
            console.log("Kafka already connected! Starting fanout service...");
            startFanoutService().catch(err => {
                console.error('Failed to start fanout service:', err);
            });
        }
    }, 3000); // Wait 3 seconds for Kafka to connect
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    let shutdownComplete = false;

    // Force shutdown after 10 seconds
    const forceShutdownTimer = setTimeout(() => {
        if (!shutdownComplete) {
            console.error('⚠️  Graceful shutdown timeout - forcing exit');
            process.exit(1);
        }
    }, 10000);

    try {
        // Stop accepting new connections
        await new Promise((resolve) => {
            server.close(() => {
                console.log('HTTP server closed');
                resolve();
            });
        });

        // Disconnect services in parallel
        await Promise.allSettled([
            (async () => {
                try {
                    const { disconnectKafka } = require('./config/kafka');
                    await disconnectKafka();
                    console.log('Kafka disconnected');
                } catch (err) {
                    console.error('Error disconnecting Kafka:', err.message);
                }
            })(),
            (async () => {
                try {
                    const { disconnectRedis } = require('./config/redis');
                    await disconnectRedis();
                    console.log('Redis disconnected');
                } catch (err) {
                    console.error('Error disconnecting Redis:', err.message);
                }
            })(),
            (async () => {
                try {
                    await db.$disconnect();
                    console.log('Database disconnected');
                } catch (err) {
                    console.error('Error disconnecting database:', err.message);
                }
            })()
        ]);

        shutdownComplete = true;
        clearTimeout(forceShutdownTimer);
        console.log('Graceful shutdown complete');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        clearTimeout(forceShutdownTimer);
        process.exit(1);
    }
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});


console.log("node env" , process.env.NODE_ENV)