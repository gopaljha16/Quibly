const db = require('../config/db');

// Create channel
exports.createChannel = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { name, type, topic, position } = req.body;

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

        const channel = await db.channel.create({
            data: {
                serverId,
                name,
                type: type || 'TEXT',
                topic: topic || null,
                position: position || 0
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

        // Transform id to _id for frontend compatibility
        const transformedChannels = channels.map(ch => {
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

        // Check if user is a member of the server
        const member = await db.serverMember.findFirst({
            where: {
                serverId: channel.serverId,
                userId: req.user.id
            }
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this channel'
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
        const { name, topic, position, type } = req.body;

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
