const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const { authenticate } = require('../middleware/auth');

// Get LiveKit token for joining voice channel
router.get('/token/:channelId', authenticate, voiceController.getVoiceToken);

// Get active participants in voice channel
router.get('/participants/:channelId', authenticate, voiceController.getVoiceParticipants);

module.exports = router;
