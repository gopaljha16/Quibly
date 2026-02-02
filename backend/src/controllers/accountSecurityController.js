const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validate inputs
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        // Get user with password
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true }
        });

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while changing password'
        });
    }
};

// Request email change (sends verification email)
exports.requestEmailChange = async (req, res) => {
    try {
        const { newEmail } = req.body;
        const userId = req.user.id;

        // Validate email
        if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        // Check if email is already in use
        const existingUser = await db.user.findUnique({
            where: { email: newEmail }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email is already in use'
            });
        }

        // Generate verification token (6-digit code)
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Update user with pending email and token
        await db.user.update({
            where: { id: userId },
            data: {
                pendingEmail: newEmail,
                emailVerificationToken: verificationToken,
                emailVerificationTokenExpiry: tokenExpiry
            }
        });

        // TODO: Send verification email with token
        console.log(`📧 Email verification code for ${newEmail}: ${verificationToken}`);

        res.status(200).json({
            success: true,
            message: 'Verification code sent to new email address',
            // For development, return the code
            verificationCode: verificationToken
        });
    } catch (error) {
        console.error('Request email change error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while requesting email change'
        });
    }
};

// Verify email change
exports.verifyEmailChange = async (req, res) => {
    try {
        const { verificationCode } = req.body;
        const userId = req.user.id;

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                emailVerificationToken: true,
                emailVerificationTokenExpiry: true,
                pendingEmail: true
            }
        });

        // Validate token
        if (!user.emailVerificationToken || !user.pendingEmail) {
            return res.status(400).json({
                success: false,
                message: 'No pending email change request'
            });
        }

        if (user.emailVerificationToken !== verificationCode) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        if (new Date() > user.emailVerificationTokenExpiry) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired'
            });
        }

        // Update email
        const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
                email: user.pendingEmail,
                pendingEmail: null,
                emailVerificationToken: null,
                emailVerificationTokenExpiry: null
            },
            select: {
                id: true,
                email: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Email changed successfully',
            email: updatedUser.email
        });
    } catch (error) {
        console.error('Verify email change error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while verifying email change'
        });
    }
};

// Disable account (7 day grace period)
exports.disableAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        await db.user.update({
            where: { id: userId },
            data: {
                isDisabled: true,
                disabledAt: new Date()
            }
        });

        res.status(200).json({
            success: true,
            message: 'Account disabled. You have 7 days to reactivate before permanent deletion.'
        });
    } catch (error) {
        console.error('Disable account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while disabling account'
        });
    }
};

// Reactivate disabled account
exports.reactivateAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await db.user.findUnique({
            where: { id: userId },
            select: { isDisabled: true, disabledAt: true }
        });

        if (!user.isDisabled) {
            return res.status(400).json({
                success: false,
                message: 'Account is not disabled'
            });
        }

        // Check if within 7-day grace period
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (user.disabledAt < sevenDaysAgo) {
            return res.status(400).json({
                success: false,
                message: 'Grace period has expired. Account cannot be reactivated.'
            });
        }

        await db.user.update({
            where: { id: userId },
            data: {
                isDisabled: false,
                disabledAt: null
            }
        });

        res.status(200).json({
            success: true,
            message: 'Account reactivated successfully'
        });
    } catch (error) {
        console.error('Reactivate account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while reactivating account'
        });
    }
};

// Delete account permanently
exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to delete account'
            });
        }

        // Verify password
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { password: true, avatar: true, banner: true }
        });

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        // TODO: Delete user's avatar and banner from Cloudinary
        // TODO: Remove user from all servers
        // TODO: Delete user's messages (or anonymize them)

        // Delete user
        await db.user.delete({
            where: { id: userId }
        });

        res.status(200).json({
            success: true,
            message: 'Account deleted permanently'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting account'
        });
    }
};

module.exports = exports;
