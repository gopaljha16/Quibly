const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const serverRoutes = require('./server');
const messageRoutes = require('./message');
const linkPreviewRoutes = require('./linkPreview');
const userRoutes = require('./users');
const interestRoutes = require('./interest');
const voiceRoutes = require('./voice');
const profileRoutes = require('./profileRoutes');
const accountSecurityRoutes = require('./accountSecurity');

// Use routes
router.use('/auth', authRoutes);
router.use('/server', serverRoutes);
router.use('/message', messageRoutes);
router.use('/link-preview', linkPreviewRoutes);
router.use('/users', userRoutes);
router.use('/interests', interestRoutes);
router.use('/voice', voiceRoutes);
router.use('/profile', profileRoutes);
router.use('/account', accountSecurityRoutes);

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: ' API is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;