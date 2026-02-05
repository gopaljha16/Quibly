const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const redis = require('../config/redis');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate random discriminator
const generateDiscriminator = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

// Register new user
exports.register = async (req, res) => {
    try {
        const { username, email, password, interests } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }

        if (username.length < 3 || username.length > 32) {
            return res.status(400).json({
                success: false,
                message: 'Username must be between 3 and 32 characters'
            });
        }

        // NEW: Prevent email as username
        if (username.includes('@') || username.includes('.com') || username.includes('.net')) {
            return res.status(400).json({
                success: false,
                message: 'Username cannot be an email address'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // NEW: Validate interests (optional)
        // Skip interest validation for now - interests are optional
        // TODO: Sync frontend interest IDs with database or fetch from API

        // Check if email already exists
        const existingUser = await db.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user (interests skipped for now)
        const user = await db.user.create({
            data: {
                username,
                email: email.toLowerCase(),
                password: hashedPassword,
                discriminator: generateDiscriminator(),
                status: 'offline',
            }
        });

        // Store verification token in Redis (expires in 24 hours)
        await redis.set(`verify:${verificationToken}`, user.id, 86400);

        // Send verification email
        await sendVerificationEmail(user.email, verificationToken, user.id);

        // Generate JWT
        const token = generateToken(user.id);

        // Set token as HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email.',
            token,
            user: {
                id: user.id,
                username: user.username,
                discriminator: user.discriminator,
                email: user.email,
                avatar: user.avatar,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const user = await db.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if banned
        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                message: 'Account has been banned'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last seen
        await db.user.update({
            where: { id: user.id },
            data: { lastSeen: new Date() }
        });

        // Generate JWT
        const token = generateToken(user.id);

        // Set token as HTTP-only cookie
        res.cookie('token', token, {
            // httpOnly: true,
            // secure: false,
            // sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                discriminator: user.discriminator,
                email: user.email,
                avatar: user.avatar,
                banner: user.banner,
                bio: user.bio,
                status: user.status,
                customStatus: user.customStatus,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// Google OAuth login
exports.googleLogin = async (req, res) => {
    try {
        const { googleToken } = req.body;

        if (!googleToken) {
            return res.status(400).json({
                success: false,
                message: 'Google token is required'
            });
        }

        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        // Find or create user
        let user = await db.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            // Create new user if doesn't exist
            user = await db.user.create({
                data: {
                    username: name.replace(/\s+/g, '').toLowerCase().slice(0, 32),
                    email: email.toLowerCase(),
                    password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10), // Random password
                    discriminator: generateDiscriminator(),
                    avatar: picture,
                    isVerified: true, // Google emails are already verified
                    status: 'online',
                }
            });
        }

        // Generate JWT
        const token = generateToken(user.id);

        // Set token as HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: 'Google login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                discriminator: user.discriminator,
                email: user.email,
                avatar: user.avatar,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during Google login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Verify email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        // NEW: Get userId from body instead of req.user (for public access)
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Verify token from Redis
        const storedUserId = await redis.get(`verify:${token}`);

        if (!storedUserId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        if (storedUserId !== userId) {
            return res.status(400).json({
                success: false,
                message: 'Token does not match user'
            });
        }

        // Mark user as verified
        const user = await db.user.update({
            where: { id: userId },
            data: { isVerified: true }
        });

        // Delete token from Redis
        await redis.del(`verify:${token}`);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            user: {
                id: user.id,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during email verification'
        });
    }
};

// Resend verification email
exports.resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await db.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Store token in Redis (expires in 24 hours)
        await redis.set(`verify:${verificationToken}`, user.id, 86400);

        await sendVerificationEmail(user.email, verificationToken, user.id);

        res.status(200).json({
            success: true,
            message: 'Verification email sent'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while resending verification email'
        });
    }
};

// Test email verification (Development only)
exports.testEmailVerification = async (req, res) => {
    try {
        if (process.env.NODE_ENV !== 'development') {
            return res.status(403).json({
                success: false,
                message: 'This route is only available in development'
            });
        }

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const token = crypto.randomBytes(32).toString('hex');
        await sendVerificationEmail(email, token, 'test-user-id');

        res.status(200).json({
            success: true,
            message: 'Test email sent',
            token
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while sending test email'
        });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await db.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // Don't reveal if user exists or not for security
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If the email exists, a password reset link has been sent'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Store token in Redis (expires in 1 hour)
        await redis.set(`reset:${resetToken}`, user.id, 3600);

        await sendPasswordResetEmail(user.email, resetToken, user.id);

        res.status(200).json({
            success: true,
            message: 'If the email exists, a password reset link has been sent'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while processing password reset'
        });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { token, userId, newPassword } = req.body;

        if (!token || !userId || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token, userId, and newPassword are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Verify token from Redis
        const storedUserId = await redis.get(`reset:${token}`);

        if (!storedUserId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        if (storedUserId !== userId) {
            return res.status(400).json({
                success: false,
                message: 'Token does not match user'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        // Delete token from Redis
        await redis.del(`reset:${token}`);

        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while resetting password'
        });
    }
};

// ==================== PROTECTED ROUTES ====================

// Logout user
exports.logout = async (req, res) => {
    try {
        await db.user.update({
            where: { id: req.user.id },
            data: { status: 'offline', lastSeen: new Date() }
        });

        // Clear the token cookie
        res.clearCookie('token');

        res.status(200).json({ success: true, message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Server error during logout' });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await db.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true, username: true, discriminator: true, email: true,
                avatar: true, banner: true, bio: true, status: true, customStatus: true,
                isVerified: true, createdAt: true, lastSeen: true
            }
        });

        if (!user) {
            // User doesn't exist in database - clear the token with same options
            res.clearCookie('token', {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/'
            });
            return res.status(401).json({
                success: false,
                message: 'User not found. Please log in again.'
            });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching profile' });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { avatar, banner, bio, status, customStatus } = req.body;

        if (bio && bio.length > 190) {
            return res.status(400).json({ success: false, message: 'Bio must be 190 characters or less' });
        }

        if (customStatus && customStatus.length > 128) {
            return res.status(400).json({ success: false, message: 'Custom status must be 128 characters or less' });
        }

        const updateData = {};
        if (avatar !== undefined) updateData.avatar = avatar;
        if (banner !== undefined) updateData.banner = banner;
        if (bio !== undefined) updateData.bio = bio;
        if (customStatus !== undefined) updateData.customStatus = customStatus;

        if (status !== undefined) {
            if (!['online', 'idle', 'dnd', 'offline'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }
            updateData.status = status;
        }

        const user = await db.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true, username: true, discriminator: true, email: true,
                avatar: true, banner: true, bio: true, status: true, customStatus: true, isVerified: true
            }
        });

        res.status(200).json({ success: true, message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error while updating profile' });
    }
};

// Get user settings
exports.getSettings = async (req, res) => {
    try {
        const user = await db.user.findUnique({
            where: { id: req.user.id },
            select: { settings: true }
        });

        res.status(200).json({ success: true, settings: user.settings });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching settings' });
    }
};

// Update user settings
exports.updateSettings = async (req, res) => {
    try {
        const { settings } = req.body;

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ success: false, message: 'Settings object is required' });
        }

        const user = await db.user.update({
            where: { id: req.user.id },
            data: { settings },
            select: { settings: true }
        });

        res.status(200).json({ success: true, message: 'Settings updated successfully', settings: user.settings });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ success: false, message: 'Server error while updating settings' });
    }
};

// Change username
exports.changeUsername = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.length < 3 || username.length > 32) {
            return res.status(400).json({ success: false, message: 'Username must be between 3 and 32 characters' });
        }

        const user = await db.user.update({
            where: { id: req.user.id },
            data: { username },
            select: { id: true, username: true, discriminator: true }
        });

        res.status(200).json({ success: true, message: 'Username changed successfully', user });
    } catch (error) {
        console.error('Change username error:', error);
        res.status(500).json({ success: false, message: 'Server error while changing username' });
    }
};

// Change email
exports.changeEmail = async (req, res) => {
    try {
        const { newEmail } = req.body;

        if (!newEmail) {
            return res.status(400).json({ success: false, message: 'New email is required' });
        }

        const existingUser = await db.user.findUnique({
            where: { email: newEmail.toLowerCase() }
        });

        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email already in use' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');

        await db.user.update({
            where: { id: req.user.id },
            data: { pendingEmail: newEmail.toLowerCase() }
        });

        await sendVerificationEmail(newEmail, verificationToken, req.user.id);

        res.status(200).json({ success: true, message: 'Verification email sent to new address' });
    } catch (error) {
        console.error('Change email error:', error);
        res.status(500).json({ success: false, message: 'Server error while changing email' });
    }
};

// Delete profile
exports.deleteProfile = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: 'Password confirmation is required' });
        }

        const user = await db.user.findUnique({
            where: { id: req.user.id }
        });

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        await db.user.update({
            where: { id: req.user.id },
            data: { isBanned: true, status: 'offline' }
        });

        res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete profile error:', error);
        res.status(500).json({ success: false, message: 'Server error while deleting account' });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const user = await db.user.findUnique({
            where: { id: req.user.id }
        });

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Server error while changing password' });
    }
};
