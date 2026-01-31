const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { uploadAvatar, uploadBanner } = require('../utils/cloudinary');

// Protected routes - require authentication
router.get('/me', authenticate, userController.getCurrentUser);
router.get('/profile/:userId', authenticate, userController.getUserProfile);
router.patch('/profile', authenticate, userController.updateProfile);
router.post('/avatar', authenticate, uploadAvatar.single('avatar'), userController.uploadAvatar);
router.post('/banner', authenticate, uploadBanner.single('banner'), userController.uploadBanner);
router.delete('/avatar', authenticate, userController.deleteAvatar);
router.delete('/banner', authenticate, userController.deleteBanner);
router.patch('/status', authenticate, userController.updateStatus);

// Admin routes (TODO: Add admin authentication middleware)
router.get('/count', userController.activeUsers);
router.get('/', userController.getAllUsers);
router.get('/stats', userController.getPlatformStats);

module.exports = router;
