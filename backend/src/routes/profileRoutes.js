const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const profileController = require('../controllers/profileController');

// Social Links
router.patch('/social-links', authenticate, profileController.updateSocialLinks);

// Profile Personalization
router.patch('/personalization', authenticate, profileController.updatePersonalization);

// Privacy Settings
router.patch('/privacy', authenticate, profileController.updatePrivacySettings);

// User Stats
router.get('/stats/:userId', authenticate, profileController.getUserStats);

// Block/Unblock
router.post('/block/:userId', authenticate, profileController.blockUser);
router.delete('/block/:userId', authenticate, profileController.unblockUser);

module.exports = router;
