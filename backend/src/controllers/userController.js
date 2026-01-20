const db = require('../config/db');

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
