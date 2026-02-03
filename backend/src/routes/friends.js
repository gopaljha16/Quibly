const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/pending', friendController.getPendingRequests);
router.post('/request', friendController.sendFriendRequest);
router.post('/accept/:requestId', friendController.acceptFriendRequest);
router.delete('/reject/:requestId', friendController.rejectFriendRequest);
router.delete('/:friendId', friendController.removeFriend);
router.post('/block', friendController.blockUser);
router.get('/', friendController.getFriends);

module.exports = router;

