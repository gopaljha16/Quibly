const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const db = require("./config/db");
const { startFanoutService } = require("./services/messageFanout");
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
const routes = require('./routes');
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date()
    });
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

// Start batch DB writer service (writes to DB every 15 minutes)
const { startBatchWriter } = require('./services/batchDBWriter');
if (process.env.REDIS_STRING && process.env.REDIS_PASSWORD) {
    // Wait a bit for Redis to connect, then start batch writer
    setTimeout(() => {
        startBatchWriter(); // Runs every 15 minutes by default
    }, 2000);
}

server.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
    console.log(` Email: ${process.env.EMAIL_USER}`);
    console.log(` Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(` Socket.IO server initialized`);
    
    // Wait for Kafka to connect, then start fanout service
    global.onKafkaConnected = () => {
        console.log("🎯 Kafka connected! Now starting fanout service...");
        startFanoutService().catch(err => {
            console.error('Failed to start fanout service:', err);
        });
    };
    
    // Also try to start immediately in case Kafka is already connected
    setTimeout(() => {
        const { isKafkaConnected } = require('./config/kafka');
        if (isKafkaConnected()) {
            console.log("🎯 Kafka already connected! Starting fanout service...");
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
                console.log('✓ HTTP server closed');
                resolve();
            });
        });
        
        // Disconnect services in parallel
        await Promise.allSettled([
            (async () => {
                try {
                    const { disconnectKafka } = require('./config/kafka');
                    await disconnectKafka();
                    console.log('✓ Kafka disconnected');
                } catch (err) {
                    console.error('Error disconnecting Kafka:', err.message);
                }
            })(),
            (async () => {
                try {
                    const { disconnectRedis } = require('./config/redis');
                    await disconnectRedis();
                    console.log('✓ Redis disconnected');
                } catch (err) {
                    console.error('Error disconnecting Redis:', err.message);
                }
            })(),
            (async () => {
                try {
                    await db.$disconnect();
                    console.log('✓ Database disconnected');
                } catch (err) {
                    console.error('Error disconnecting database:', err.message);
                }
            })()
        ]);
        
        shutdownComplete = true;
        clearTimeout(forceShutdownTimer);
        console.log('✓ Graceful shutdown complete');
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
