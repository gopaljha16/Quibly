const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config();

// Import database connection
require("./config/db");

// Import Redis connection
require("./config/redis");

const app = express();

const PORT_NO = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('combined'));

// Routes
app.use('/api', require('./routes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

const http = require('http');
const server = http.createServer(app);
// Initialize Socket.IO
require('./socket')(server);
server.listen(PORT_NO, () => {
    console.log(`Server is listening on port ${PORT_NO}`);
});