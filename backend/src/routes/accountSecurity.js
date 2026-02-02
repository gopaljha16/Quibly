const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const accountSecurityController = require('../controllers/accountSecurityController');

// Password Management
router.post('/change-password', authenticate, accountSecurityController.changePassword);

// Email Change (with verification)
router.post('/request-email-change', authenticate, accountSecurityController.requestEmailChange);
router.post('/verify-email-change', authenticate, accountSecurityController.verifyEmailChange);

// Account Management
router.post('/disable', authenticate, accountSecurityController.disableAccount);
router.post('/reactivate', authenticate, accountSecurityController.reactivateAccount);
router.delete('/delete', authenticate, accountSecurityController.deleteAccount);

module.exports = router;
