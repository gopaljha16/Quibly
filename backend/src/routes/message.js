const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.post('/', messageController.createMessage);
router.get('/:channelId', messageController.getMessages);
router.put('/:id', messageController.editMessage);
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
