const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const db = require("./config/db");
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

server.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
    console.log(` Email: ${process.env.EMAIL_USER}`);
    console.log(` Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(` Socket.IO server initialized`);
});
