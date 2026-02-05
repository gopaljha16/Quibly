const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const reactionController = require('../controllers/reactionController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.post('/', messageController.createMessage);
router.get('/:channelId', messageController.getMessages);
router.get('/dm/:dmRoomId', messageController.getMessages);

// Pinning routes - MUST come before generic /:id routes
router.get('/pinned/:channelId', messageController.getPinnedMessages);
router.put('/:id/pin', messageController.pinMessage);
router.delete('/:id/pin', messageController.unpinMessage);

// Generic message routes
router.put('/:id', messageController.editMessage);
router.put('/:id', messageController.editMessage);
router.delete('/:id', messageController.deleteMessage);

// Reaction routes
router.post('/:messageId/reactions', reactionController.toggleReaction);

module.exports = router;

