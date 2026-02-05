const db = require('../config/db');
const { canAccessChannel, filterAccessibleChannels } = require('../utils/channelPermissions');

// Create channel
exports.createChannel = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { name, type, topic, position, isPrivate, isReadOnly, slowMode, allowedRoleIds } = req.body;

        if (!name || name.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Channel name is required and must be 100 characters or less'
            });
        }

        // Check if user is server owner or has permission
        const server = await db.server.findUnique({
            where: { id: serverId }
        });

        if (!server) {
            return res.status(404).json({
                success: false,
                message: 'Server not found'
            });
        }

        const member = await db.serverMember.findFirst({
            where: { serverId, userId: req.user.id }
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this server'
            });
        }

        // For now, only owner can create channels
        if (server.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the server owner can create channels'
            });
        }

        // Validate allowedRoleIds if channel is private
        if (isPrivate && allowedRoleIds && allowedRoleIds.length > 0) {
            const roles = await db.role.findMany({
                where: {
                    serverId: serverId,
                    id: { in: allowedRoleIds }
                }
            });

            if (roles.length !== allowedRoleIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more role IDs are invalid'
                });
            }
        }

        const channel = await db.channel.create({
            data: {
                serverId,
                name,
                type: type || 'TEXT',
                topic: topic || null,
                position: position || 0,
                isPrivate: isPrivate || false,
                isReadOnly: isReadOnly || false,
                slowMode: slowMode || 0,
                allowedRoleIds: allowedRoleIds || []
            }
        });

        const { id, ...rest } = channel;
        res.status(201).json({
            success: true,
            message: 'Channel created successfully',
            channel: { _id: id, ...rest }
        });
    } catch (error) {
        console.error('Create channel error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating channel'
        });
    }
};

// Get all channels in a server
exports.getChannels = async (req, res) => {
    try {
        const { serverId } = req.params;

        // Check if user is a member
        const member = await db.serverMember.findFirst({
            where: { serverId, userId: req.user.id }
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this server'
            });
        }

        const channels = await db.channel.findMany({
            where: { serverId },
            orderBy: { position: 'asc' }
        });

        // Filter channels based on user permissions
        const accessibleChannels = await filterAccessibleChannels(
            req.user.id,
            channels,
            serverId
        );

        // Transform id to _id for frontend compatibility
        const transformedChannels = accessibleChannels.map(ch => {
            const { id, ...rest } = ch;
            return { _id: id, ...rest };
        });

        res.status(200).json({
            success: true,
            channels: transformedChannels
        });
    } catch (error) {
        console.error('Get channels error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching channels'
        });
    }
};

// Get channel by ID
exports.getChannelById = async (req, res) => {
    try {
        const { channelId } = req.params;

        const channel = await db.channel.findUnique({
            where: { id: channelId }
        });

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }

        // Check if user has permission to access this channel
        const hasAccess = await canAccessChannel(req.user.id, channelId);

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this channel'
            });
        }

        res.status(200).json({
            success: true,
            channel
        });
    } catch (error) {
        console.error('Get channel error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching channel'
        });
    }
};

// Update channel
exports.updateChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { name, topic, position, type, isPrivate, isReadOnly, slowMode, allowedRoleIds } = req.body;

        const channel = await db.channel.findUnique({
            where: { id: channelId }
        });

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }

        // Check if user is server owner
        const server = await db.server.findUnique({
            where: { id: channel.serverId }
        });

        if (server.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the server owner can update channels'
            });
        }

        if (name && name.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Channel name must be 100 characters or less'
            });
        }

        if (topic && topic.length > 200) {
            return res.status(400).json({
                success: false,
                message: 'Topic must be 200 characters or less'
            });
        }

        // Validate allowedRoleIds if provided
        if (allowedRoleIds !== undefined && allowedRoleIds.length > 0) {
            const roles = await db.role.findMany({
                where: {
                    serverId: channel.serverId,
                    id: { in: allowedRoleIds }
                }
            });

            if (roles.length !== allowedRoleIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more role IDs are invalid'
                });
            }
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (topic !== undefined) updateData.topic = topic;
        if (position !== undefined) updateData.position = position;
        if (type !== undefined) {
            if (!['TEXT', 'VOICE'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid channel type'
                });
            }
            updateData.type = type;
        }
        if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
        if (isReadOnly !== undefined) updateData.isReadOnly = isReadOnly;
        if (slowMode !== undefined) updateData.slowMode = slowMode;
        if (allowedRoleIds !== undefined) updateData.allowedRoleIds = allowedRoleIds;

        const updatedChannel = await db.channel.update({
            where: { id: channelId },
            data: updateData
        });

        const { id, ...rest } = updatedChannel;
        res.status(200).json({
            success: true,
            message: 'Channel updated successfully',
            updatedChannel: { _id: id, ...rest }
        });
    } catch (error) {
        console.error('Update channel error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating channel'
        });
    }
};

// Delete channel
exports.deleteChannel = async (req, res) => {
    try {
        const { channelId } = req.params;

        const channel = await db.channel.findUnique({
            where: { id: channelId }
        });

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }

        // Check if user is server owner
        const server = await db.server.findUnique({
            where: { id: channel.serverId }
        });

        if (server.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the server owner can delete channels'
            });
        }

        await db.channel.delete({
            where: { id: channelId }
        });

        res.status(200).json({
            success: true,
            message: 'Channel deleted successfully'
        });
    } catch (error) {
        console.error('Delete channel error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting channel'
        });
    }
};

// Reorder channels
exports.reorderChannels = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { channelOrders } = req.body; // Array of {channelId, position}

        if (!Array.isArray(channelOrders)) {
            return res.status(400).json({
                success: false,
                message: 'channelOrders must be an array'
            });
        }

        // Check if user is server owner
        const server = await db.server.findUnique({
            where: { id: serverId }
        });

        if (!server) {
            return res.status(404).json({
                success: false,
                message: 'Server not found'
            });
        }

        if (server.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the server owner can reorder channels'
            });
        }

        // Update positions
        const updatePromises = channelOrders.map(({ channelId, position }) =>
            db.channel.update({
                where: { id: channelId },
                data: { position }
            })
        );

        await Promise.all(updatePromises);

        res.status(200).json({
            success: true,
            message: 'Channels reordered successfully'
        });
    } catch (error) {
        console.error('Reorder channels error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while reordering channels'
        });
    }
};

// Get recommended channels based on user interests
exports.getRecommendedChannels = async (req, res) => {
    try {
        const userId = req.user.id;
        const channels = await getRecommendedChannelsForUser(userId);

        res.status(200).json({
            success: true,
            channels
        });
    } catch (error) {
        console.error('Get recommended channels error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching recommended channels'
        });
    }
};

// Helper function for recommendation logic
async function getRecommendedChannelsForUser(userId) {
    try {
        // Get channels matching user interests using raw SQL for better performance
        const matchedChannels = await db.$queryRaw`
            SELECT 
                c.id,
                c.name,
                c."serverId",
                s.name as "serverName",
                s.icon as "serverIcon",
                s."membersCount",
                COUNT(ch."interestId")::int as "matchCount"
            FROM "Channel" c
            JOIN "ChannelHashtag" ch ON c.id = ch."channelId"
            JOIN "Server" s ON c."serverId" = s.id
            JOIN "UserInterest" ui ON ui."interestId" = ch."interestId"
            WHERE ui."userId" = ${userId}
            AND s."isPublic" = true
            AND NOT EXISTS (
                SELECT 1 FROM "ServerMember" sm
                WHERE sm."serverId" = s.id AND sm."userId" = ${userId}
            )
            GROUP BY c.id, c.name, c."serverId", s.name, s.icon, s."membersCount"
            ORDER BY "matchCount" DESC, s."membersCount" DESC
            LIMIT 5
        `;

        // If less than 5, fill with popular channels user hasn't joined
        if (matchedChannels.length < 5) {
            const excludeIds = matchedChannels.map(ch => ch.id);
            const remaining = 5 - matchedChannels.length;

            const popularChannels = await db.channel.findMany({
                where: {
                    id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
                    server: {
                        isPublic: true,
                        members: {
                            none: {
                                userId: userId
                            }
                        }
                    }
                },
                include: {
                    server: {
                        select: {
                            id: true,
                            name: true,
                            icon: true,
                            membersCount: true
                        }
                    }
                },
                orderBy: {
                    server: {
                        membersCount: 'desc'
                    }
                },
                take: remaining
            });

            const formattedPopular = popularChannels.map(ch => ({
                id: ch.id,
                name: ch.name,
                serverId: ch.server.id,
                serverName: ch.server.name,
                serverIcon: ch.server.icon,
                membersCount: ch.server.membersCount,
                matchCount: 0
            }));

            return [...matchedChannels, ...formattedPopular];
        }

        return matchedChannels;
    } catch (error) {
        console.error('Error in getRecommendedChannelsForUser:', error);
        return [];
    }
}

module.exports.getRecommendedChannelsForUser = getRecommendedChannelsForUser;
