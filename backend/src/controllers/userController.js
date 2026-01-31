const db = require('../config/db');
const { deleteImage } = require('../utils/cloudinary');

// Get current user profile
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await db.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                discriminator: true,
                displayName: true,
                email: true,
                avatar: true,
                banner: true,
                bio: true,
                pronouns: true,
                themeColor: true,
                status: true,
                customStatus: true,
                customStatusEmoji: true,
                badges: true,
                isVerified: true,
                createdAt: true,
                userInterests: {
                    include: {
                        interest: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user profile'
        });
    }
};

// Get user profile by ID
exports.getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                discriminator: true,
                displayName: true,
                avatar: true,
                banner: true,
                bio: true,
                pronouns: true,
                themeColor: true,
                status: true,
                customStatus: true,
                customStatusEmoji: true,
                badges: true,
                isVerified: true,
                createdAt: true,
                userInterests: {
                    include: {
                        interest: true
                    }
                },
                _count: {
                    select: {
                        serverMembers: true,
                        ownedServers: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user profile'
        });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { displayName, bio, pronouns, themeColor, customStatus, customStatusEmoji } = req.body;
        const userId = req.user.id;

        // Validate bio length
        if (bio && bio.length > 190) {
            return res.status(400).json({
                success: false,
                message: 'Bio must be 190 characters or less'
            });
        }

        // Validate display name length
        if (displayName && (displayName.length < 1 || displayName.length > 32)) {
            return res.status(400).json({
                success: false,
                message: 'Display name must be between 1 and 32 characters'
            });
        }

        const updateData = {};
        if (displayName !== undefined) updateData.displayName = displayName;
        if (bio !== undefined) updateData.bio = bio;
        if (pronouns !== undefined) updateData.pronouns = pronouns;
        if (themeColor !== undefined) updateData.themeColor = themeColor;
        if (customStatus !== undefined) updateData.customStatus = customStatus;
        if (customStatusEmoji !== undefined) updateData.customStatusEmoji = customStatusEmoji;

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                discriminator: true,
                displayName: true,
                email: true,
                avatar: true,
                banner: true,
                bio: true,
                pronouns: true,
                themeColor: true,
                status: true,
                customStatus: true,
                customStatusEmoji: true,
                badges: true,
                isVerified: true,
                createdAt: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile'
        });
    }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const userId = req.user.id;
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { avatarPublicId: true }
        });

        // Delete old avatar if exists
        if (user.avatarPublicId) {
            await deleteImage(user.avatarPublicId);
        }

        // Update user with new avatar
        const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
                avatar: req.file.path,
                avatarPublicId: req.file.filename
            },
            select: {
                id: true,
                avatar: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            avatar: updatedUser.avatar
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while uploading avatar'
        });
    }
};

// Upload banner
exports.uploadBanner = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const userId = req.user.id;
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { bannerPublicId: true }
        });

        // Delete old banner if exists
        if (user.bannerPublicId) {
            await deleteImage(user.bannerPublicId);
        }

        // Update user with new banner
        const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
                banner: req.file.path,
                bannerPublicId: req.file.filename
            },
            select: {
                id: true,
                banner: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Banner uploaded successfully',
            banner: updatedUser.banner
        });
    } catch (error) {
        console.error('Upload banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while uploading banner'
        });
    }
};

// Delete avatar
exports.deleteAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { avatarPublicId: true }
        });

        // Delete from Cloudinary
        if (user.avatarPublicId) {
            await deleteImage(user.avatarPublicId);
        }

        // Update user
        await db.user.update({
            where: { id: userId },
            data: {
                avatar: null,
                avatarPublicId: null
            }
        });

        res.status(200).json({
            success: true,
            message: 'Avatar deleted successfully'
        });
    } catch (error) {
        console.error('Delete avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting avatar'
        });
    }
};

// Delete banner
exports.deleteBanner = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { bannerPublicId: true }
        });

        // Delete from Cloudinary
        if (user.bannerPublicId) {
            await deleteImage(user.bannerPublicId);
        }

        // Update user
        await db.user.update({
            where: { id: userId },
            data: {
                banner: null,
                bannerPublicId: null
            }
        });

        res.status(200).json({
            success: true,
            message: 'Banner deleted successfully'
        });
    } catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting banner'
        });
    }
};

// Update user status
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const userId = req.user.id;

        const validStatuses = ['online', 'idle', 'dnd', 'offline'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        await db.user.update({
            where: { id: userId },
            data: { status }
        });

        res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            status
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating status'
        });
    }
};

// Get active user count
exports.activeUsers = async (req, res) => {
    try {
        const count = await db.user.count({
            where: {
                isBanned: false,
                isVerified: true
            }
        });

        res.status(200).json({
            success: true,
            activeUsers: count
        });
    } catch (error) {
        console.error('Active users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching active user count'
        });
    }
};

// Get all users (paginated)
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const skip = (page - 1) * limit;

        const where = search
            ? {
                OR: [
                    { username: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            }
            : {};

        const [users, total] = await Promise.all([
            db.user.findMany({
                where,
                select: {
                    id: true,
                    username: true,
                    discriminator: true,
                    email: true,
                    avatar: true,
                    status: true,
                    isVerified: true,
                    isBanned: true,
                    createdAt: true,
                    lastSeen: true
                },
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' }
            }),
            db.user.count({ where })
        ]);

        res.status(200).json({
            success: true,
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
};

// Get platform statistics
exports.getPlatformStats = async (req, res) => {
    try {
        const [
            totalUsers,
            verifiedUsers,
            bannedUsers,
            totalServers,
            totalMessages
        ] = await Promise.all([
            db.user.count(),
            db.user.count({ where: { isVerified: true } }),
            db.user.count({ where: { isBanned: true } }),
            db.server.count(),
            db.message.count()
        ]);

        // Get users created in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newUsers = await db.user.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        });

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                verifiedUsers,
                bannedUsers,
                totalServers,
                totalMessages,
                newUsersLast30Days: newUsers,
                averageUsersPerServer: totalServers > 0 ? (totalUsers / totalServers).toFixed(2) : 0
            }
        });
    } catch (error) {
        console.error('Platform stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching platform statistics'
        });
    }
};


// Get all users (paginated)
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const skip = (page - 1) * limit;

        const where = search
            ? {
                OR: [
                    { username: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            }
            : {};

        const [users, total] = await Promise.all([
            db.user.findMany({
                where,
                select: {
                    id: true,
                    username: true,
                    discriminator: true,
                    displayName: true,
                    email: true,
                    avatar: true,
                    status: true,
                    isVerified: true,
                    isBanned: true,
                    createdAt: true,
                    lastSeen: true
                },
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' }
            }),
            db.user.count({ where })
        ]);

        res.status(200).json({
            success: true,
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
};

// Get platform statistics
exports.getPlatformStats = async (req, res) => {
    try {
        const [
            totalUsers,
            verifiedUsers,
            bannedUsers,
            totalServers,
            totalMessages
        ] = await Promise.all([
            db.user.count(),
            db.user.count({ where: { isVerified: true } }),
            db.user.count({ where: { isBanned: true } }),
            db.server.count(),
            db.message.count()
        ]);

        // Get users created in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newUsers = await db.user.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        });

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                verifiedUsers,
                bannedUsers,
                totalServers,
                totalMessages,
                newUsersLast30Days: newUsers,
                averageUsersPerServer: totalServers > 0 ? (totalUsers / totalServers).toFixed(2) : 0
            }
        });
    } catch (error) {
        console.error('Platform stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching platform statistics'
        });
    }
};
