const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const serverRoutes = require('./server');
const messageRoutes = require('./message');

// Use routes
router.use('/auth', authRoutes);
router.use('/server', serverRoutes);
router.use('/message', messageRoutes);

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: ' API is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;