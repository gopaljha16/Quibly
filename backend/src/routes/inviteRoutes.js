const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/inviteController');
const { authenticate } = require('../middleware/auth');

// Create a new invite
router.post('/:serverId', authenticate, inviteController.createInvite);

// Resolve invite info (public preview)
router.get('/:code', authenticate, inviteController.resolveInvite);

// Join server by invite code
router.post('/:code/join', authenticate, inviteController.joinByInvite);

module.exports = router;
