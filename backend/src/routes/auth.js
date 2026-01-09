const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    deleteProfile,
    activeUsers,
    googleLogin,
    getAllUsers,
    getPlatformStats,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    changePassword,
    testEmailVerification
} = require('../controller/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);

// Email verification routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Test route for development
router.post('/test-email', testEmailVerification);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (require authentication)
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.delete('/profile', authenticateToken, deleteProfile);
router.post('/change-password', authenticateToken, changePassword);

//admin route--pending..
router.get('/users/count', activeUsers);
router.get('/users', getAllUsers);
router.get('/stats', getPlatformStats);

module.exports = router;