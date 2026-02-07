const db = require('../config/db');

// Get server analytics
exports.getServerAnalytics = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { days = 30 } = req.query;

        // Check if user is a member
        const member = await db.serverMember.findFirst({
            where: {
                serverId,
                userId: req.user.id
            }
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this server'
            });
        }

        // Get server to check ownership
        const server = await db.server.findUnique({
            where: { id: serverId },
            select: { ownerId: true }
        });

        // Only owner can view detailed analytics
        if (server.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the server owner can view analytics'
            });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const analytics = await db.serverAnalytics.findMany({
            where: {
                serverId,
                date: {
                    gte: startDate
                }
            },
            orderBy: { date: 'asc' }
        });

        // Get current stats
        const currentMembers = await db.serverMember.count({
            where: { serverId, isBanned: false }
        });

        const totalMessages = await db.message.count({
            where: { serverId, isDeleted: false }
        });

        // Get most active members (by message count)
        const mostActiveMembers = await db.message.groupBy({
            by: ['senderId'],
            where: {
                serverId,
                isDeleted: false,
                senderId: { not: null },
                createdAt: {
                    gte: startDate
                }
            },
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 10
        });

        // Get user details for most active members
        const memberIds = mostActiveMembers.map(m => m.senderId).filter(Boolean);
        const users = await db.user.findMany({
            where: { id: { in: memberIds } },
            select: {
                id: true,
                username: true,
                discriminator: true,
                avatar: true
            }
        });

        const mostActiveWithDetails = mostActiveMembers.map(m => {
            const user = users.find(u => u.id === m.senderId);
            return {
                user,
                messageCount: m._count.id
            };
        });

        // Get most active channels
        const mostActiveChannels = await db.message.groupBy({
            by: ['channelId'],
            where: {
                serverId,
                isDeleted: false,
                channelId: { not: null },
                createdAt: {
                    gte: startDate
                }
            },
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 10
        });

        // Get channel details
        const channelIds = mostActiveChannels.map(c => c.channelId).filter(Boolean);
        const channels = await db.channel.findMany({
            where: { id: { in: channelIds } },
            select: {
                id: true,
                name: true,
                type: true
            }
        });

        const mostActiveChannelsWithDetails = mostActiveChannels.map(c => {
            const channel = channels.find(ch => ch.id === c.channelId);
            return {
                channel,
                messageCount: c._count.id
            };
        });

        // Calculate growth rate
        const firstDayMembers = analytics[0]?.newMembers || 0;
        const lastDayMembers = analytics[analytics.length - 1]?.newMembers || 0;
        const growthRate = firstDayMembers > 0 
            ? ((lastDayMembers - firstDayMembers) / firstDayMembers * 100).toFixed(2)
            : 0;

        res.status(200).json({
            success: true,
            analytics: {
                timeline: analytics,
                summary: {
                    currentMembers,
                    totalMessages,
                    growthRate: parseFloat(growthRate),
                    totalNewMembers: analytics.reduce((sum, a) => sum + a.newMembers, 0),
                    totalLeftMembers: analytics.reduce((sum, a) => sum + a.leftMembers, 0),
                    totalVoiceMinutes: analytics.reduce((sum, a) => sum + a.voiceMinutes, 0)
                },
                mostActiveMembers: mostActiveWithDetails,
                mostActiveChannels: mostActiveChannelsWithDetails
            }
        });
    } catch (error) {
        console.error('Get server analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching analytics'
        });
    }
};

// Record analytics (called by cron job or event handlers)
exports.recordDailyAnalytics = async (serverId) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get yesterday's date for comparison
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Count new members today
        const newMembers = await db.serverMember.count({
            where: {
                serverId,
                joinedAt: {
                    gte: today
                }
            }
        });

        // Count messages today
        const totalMessages = await db.message.count({
            where: {
                serverId,
                createdAt: {
                    gte: today
                },
                isDeleted: false
            }
        });

        // Count active members (sent at least one message today)
        const activeMembers = await db.message.findMany({
            where: {
                serverId,
                createdAt: {
                    gte: today
                },
                isDeleted: false,
                senderId: { not: null }
            },
            distinct: ['senderId']
        });

        // Create or update analytics record
        await db.serverAnalytics.upsert({
            where: {
                serverId_date: {
                    serverId,
                    date: today
                }
            },
            update: {
                newMembers,
                totalMessages,
                activeMembers: activeMembers.length
            },
            create: {
                serverId,
                date: today,
                newMembers,
                totalMessages,
                activeMembers: activeMembers.length,
                leftMembers: 0,
                voiceMinutes: 0
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Record daily analytics error:', error);
        return { success: false, error: error.message };
    }
};

// Update voice minutes (called when voice session ends)
exports.updateVoiceMinutes = async (serverId, minutes) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await db.serverAnalytics.upsert({
            where: {
                serverId_date: {
                    serverId,
                    date: today
                }
            },
            update: {
                voiceMinutes: {
                    increment: minutes
                }
            },
            create: {
                serverId,
                date: today,
                voiceMinutes: minutes,
                newMembers: 0,
                leftMembers: 0,
                totalMessages: 0,
                activeMembers: 0
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Update voice minutes error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = exports;
