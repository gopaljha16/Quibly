const express = require('express');
const router = express.Router();
const dmController = require('../controllers/dmController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/conversations', dmController.getConversations);
router.post('/room', dmController.getOrCreateDM);
router.get('/room/:roomId', dmController.getDMByRoomId);
router.get('/token/:roomId', dmController.getDMToken);

module.exports = router;
