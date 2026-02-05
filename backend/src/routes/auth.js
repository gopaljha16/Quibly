const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);
router.post('/test-email', authController.testEmailVerification);
router.post('/forgot-password', authController.forgotPassword);

// Protected routes (require authentication - user must be logged in)
router.post('/reset-password', authenticate, authController.resetPassword);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.get('/settings', authenticate, authController.getSettings);
router.patch('/settings', authenticate, authController.updateSettings);
router.patch('/account/username', authenticate, authController.changeUsername);
router.patch('/account/email', authenticate, authController.changeEmail);
router.delete('/profile', authenticate, authController.deleteProfile);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
