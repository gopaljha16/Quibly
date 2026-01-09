const axios = require('axios');
const redisWrapper = require("../config/redis");
const bcrypt = require('bcrypt');
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const emailService = require('../config/email');
const cloudinary = require('cloudinary').v2;
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup for memory storage (buffer)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) cb(null, true);
        else cb(new Error("Only images are allowed (jpeg, jpg, png)"));
    }
}).single("profileImage");

const register = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // Validate inputs
        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }
        if (username.length < 3 || username.length > 32) {
            return res.status(400).json({ success: false, message: 'Username must be between 3 and 32 characters' });
        }

        // Generate discriminator (4-digit number)
        const discriminator = Math.floor(1000 + Math.random() * 9000).toString();

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            username,
            discriminator,
            email: email.toLowerCase(),
            password: hashedPassword,
            isVerified: process.env.NODE_ENV === 'development' ? true : false, // Auto-verify in development
        });

        await newUser.save();

        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await redisWrapper.set(`email_verify:${verificationToken}`, newUser._id.toString(), 86400); // 24 hours

        // Send verification email (only in production or if email is configured)
        if (process.env.NODE_ENV === 'production' || (process.env.EMAIL_USER && process.env.EMAIL_PASS)) {
            try {
                await emailService.sendVerificationEmail(newUser.email, newUser.username, verificationToken);
                console.log(`Verification email sent to ${newUser.email}`);
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Don't fail registration if email fails
            }
        } else {
            console.log(`Development mode: User ${newUser.email} auto-verified`);
            console.log(`Verification token (for testing): ${verificationToken}`);
        }

        // Generate JWT token
        const token = jwt.sign({ _id: newUser._id, email: newUser.email, username: newUser.username }, process.env.JWT_SECRET, { expiresIn: 604800 });
        res.cookie("token", token, { maxAge: 604800000, httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please verify your email.',
            user: {
                _id: newUser._id,
                username: newUser.username,
                discriminator: newUser.discriminator,
                email: newUser.email,
                isVerified: newUser.isVerified,
            },
            token,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) throw new Error("Credentials Missing");

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(403).json({ success: false, message: "Invalid credentials" });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Email not verified. Please verify your email before logging in.",
                needsVerification: true,
                email: email
            });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(403).json({ success: false, message: "Invalid credentials" });
        }

        // Increase token expiration to 7 days (604800 seconds)
        const token = jwt.sign({ _id: user._id, email: user.email, username: user.username }, process.env.JWT_SECRET, { expiresIn: 604800 });
        // Increase cookie maxAge to 7 days (604800000 milliseconds)
        res.cookie("token", token, { maxAge: 604800000, httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });

        const reply = {
            username: user.username,
            discriminator: user.discriminator,
            email: user.email,
            _id: user._id,
            avatar: user.avatar,
            status: user.status
        };

        res.status(200).json({ user: reply, token, message: "Logged In Successfully" });
    } catch (err) {
        res.status(403).json({ success: false, message: "Error: " + err.message });
    }
};

const logout = async (req, res) => {
    try {
        const { token } = req.cookies;
        await redisWrapper.set(`token:${token}`, "Blocked");

        const payload = jwt.decode(token);
        await redisWrapper.expireAt(`token:${token}`, payload.exp);

        res.cookie("token", null, { expires: new Date(Date.now()), httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
        res.status(200).send("User Logged Out Successfully");
    } catch (err) {
        res.status(401).send("Error : " + err);
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select('-password');

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({
            user: {
                _id: user._id,
                username: user.username,
                discriminator: user.discriminator,
                email: user.email,
                avatar: user.avatar,
                banner: user.banner,
                bio: user.bio,
                status: user.status,
                customStatus: user.customStatus,
                createdAt: user.createdAt,
                isVerified: user.isVerified,
                settings: user.settings,
                friends: user.friends,
                servers: user.servers,
                lastSeen: user.lastSeen
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateProfile = (req, res) => {
    upload(req, res, async function (err) {
        if (err) return res.status(400).json({ error: err.message });

        try {
            const userId = req.user._id;
            const updateData = { ...req.body };

            if (req.file) {
                const uploadToCloudinary = () => {
                    return new Promise((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            { folder: "avatars", public_id: userId.toString(), overwrite: true },
                            (error, result) => error ? reject(error) : resolve(result)
                        );
                        stream.end(req.file.buffer);
                    });
                };
                const result = await uploadToCloudinary();
                updateData.avatar = result.secure_url;
            }

            const user = await User.findByIdAndUpdate(userId, updateData, { new: true })
                .select('-password');

            if (!user) return res.status(404).json({ message: "User not found" });

            res.status(200).json({
                message: "Profile updated successfully",
                user: {
                    _id: user._id,
                    username: user.username,
                    discriminator: user.discriminator,
                    email: user.email,
                    avatar: user.avatar,
                    banner: user.banner,
                    bio: user.bio,
                    status: user.status,
                    customStatus: user.customStatus,
                    createdAt: user.createdAt,
                    isVerified: user.isVerified,
                    settings: user.settings
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
};

const deleteProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        await User.findByIdAndDelete(userId);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error occurred: " + err.message });
    }
};

const activeUsers = async (req, res) => {
    try {
        const userCount = await User.countDocuments({});
        res.status(200).json({ message: "User count fetched successfully", count: userCount });
    } catch (err) {
        res.status(500).json({ message: "Error while fetching user Count", error: err.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json({
            message: "All users fetched successfully",
            users
        });
    } catch (err) {
        res.status(500).json({ message: "Error while fetching users", error: err.message });
    }
};

const getPlatformStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();

        res.status(200).json({
            message: "Platform stats fetched successfully",
            stats: {
                totalUsers,
                onlineUsers: await User.countDocuments({ status: 'online' }),
                verifiedUsers: await User.countDocuments({ isVerified: true })
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Error while fetching platform stats", error: err.message });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "Token is required" });

        // Use the access token to get user info from Google
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const { sub, email, given_name, picture } = response.data;

        let user = await User.findOne({ email }).select('+password');

        if (!user) {
            // Generate discriminator for new user
            const discriminator = Math.floor(1000 + Math.random() * 9000).toString();
            
            // For new users signing up with Google, we'll use their Google ID as a basis for a password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(sub, salt);

            user = new User({
                username: given_name || email.split('@')[0],
                discriminator,
                email: email,
                password: hashedPassword,
                avatar: picture,
                isVerified: true, // Email is verified by Google
                status: "online"
            });
            await user.save();
        }

        const jwtToken = jwt.sign(
            { _id: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: 604800 } // 7 days
        );

        res.cookie("token", jwtToken, {
            maxAge: 604800000, // 7 days
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });

        res.status(200).json({
            user: {
                username: user.username,
                discriminator: user.discriminator,
                email: user.email,
                _id: user._id,
                avatar: user.avatar,
                status: user.status
            },
            token: jwtToken,
            message: "Logged in with Google successfully",
        });
    } catch (error) {
        console.error("Google login error:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Google login failed", error: error.message });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ success: false, message: 'Verification token is required' });
        }

        // Get user ID from Redis
        const userId = await redisWrapper.get(`email_verify:${token}`);
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
        }

        // Update user verification status
        const user = await User.findByIdAndUpdate(
            userId, 
            { isVerified: true }, 
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove verification token from Redis
        await redisWrapper.del(`email_verify:${token}`);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Email verification failed' });
    }
};

const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'Email is already verified' });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await redisWrapper.set(`email_verify:${verificationToken}`, user._id.toString(), 86400); // 24 hours

        // Send verification email
        await emailService.sendVerificationEmail(user.email, user.username, verificationToken);

        res.status(200).json({
            success: true,
            message: 'Verification email sent successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send verification email' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Don't reveal if user exists or not for security
            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent'
            });
        }

        // Generate password reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        await redisWrapper.set(`password_reset:${resetToken}`, user._id.toString(), 3600); // 1 hour

        // Send password reset email
        await emailService.sendPasswordResetEmail(user.email, user.username, resetToken);

        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to process password reset request' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        
        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        // Get user ID from Redis
        const userId = await redisWrapper.get(`password_reset:${token}`);
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        const user = await User.findByIdAndUpdate(
            userId,
            { password: hashedPassword },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove reset token from Redis
        await redisWrapper.del(`password_reset:${token}`);

        // Send password change notification
        try {
            await emailService.sendPasswordChangeNotification(user.email, user.username);
        } catch (emailError) {
            console.error('Password change notification failed:', emailError);
        }

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. Please log in with your new password.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Password reset failed' });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user._id;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'New passwords do not match' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        // Get user with password
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Check if new password is different from current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ success: false, message: 'New password must be different from current password' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        // Send password change notification
        try {
            await emailService.sendPasswordChangeNotification(user.email, user.username);
        } catch (emailError) {
            console.error('Password change notification failed:', emailError);
        }

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Password change failed' });
    }
};

// Test endpoint for email verification (development only)
const testEmailVerification = async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ success: false, message: 'This endpoint is only available in development' });
    }

    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Generate test verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Store in Redis for 24 hours
        await redisWrapper.set(`email_verify:${verificationToken}`, 'test-user-id', 86400);

        // Send test email
        await emailService.sendVerificationEmail(email, 'Test User', verificationToken);

        res.status(200).json({
            success: true,
            message: 'Test verification email sent successfully',
            verificationToken: verificationToken,
            verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ success: false, message: 'Failed to send test email' });
    }
};


module.exports = {
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
};
