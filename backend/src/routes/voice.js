const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const { authenticate } = require('../middleware/auth');

// Test endpoint to verify LiveKit configuration
router.get('/test-config', authenticate, (req, res) => {
  const { LIVEKIT_WS_URL } = require('../config/livekit');

  res.json({
    configured: !!(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET && process.env.LIVEKIT_WS_URL),
    wsUrl: LIVEKIT_WS_URL,
    apiKeyPrefix: process.env.LIVEKIT_API_KEY ? process.env.LIVEKIT_API_KEY.substring(0, 10) + '...' : 'not set',
    secretLength: process.env.LIVEKIT_API_SECRET ? process.env.LIVEKIT_API_SECRET.length : 0,
  });
});

// Get LiveKit token for joining voice channel
router.get('/token/:channelId', authenticate, voiceController.getVoiceToken);

// Get active participants in voice channel
router.get('/participants/:channelId', authenticate, voiceController.getVoiceParticipants);

// Activity tracking
router.post('/track-join/:channelId', authenticate, voiceController.trackVoiceJoin);
router.post('/track-leave', authenticate, voiceController.trackVoiceLeave);

// Move user to voice channel (moderator/owner only)
router.post('/move-user', authenticate, voiceController.moveUserToVoiceChannel);

module.exports = router;
