const db = require('../config/db');

// Send new message
exports.createMessage = async (req, res) => {
    try {
        const { channelId, content, type, attachments, mentions } = req.body;

        if (!channelId) {
            return res.status(400).json({
                success: false,
                message: 'Channel ID is required'
            });
        }

        if (!content || content.trim().length === 0) {
            if (!attachments || attachments.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Message content or attachments are required'
                });
            }
        }

        if (content && content.length > 4000) {
            return res.status(400).json({
                success: false,
                message: 'Message content must be 4000 characters or less'
            });
        }

        // Check if channel exists and user has access
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

        if (member.isMuted) {
            return res.status(403).json({
                success: false,
                message: 'You are muted in this server'
            });
        }

        // Create message
        const message = await db.message.create({
            data: {
                channelId,
                serverId: channel.serverId,
                senderId: req.user.id,
                content: content || '',
                type: type || 'TEXT',
                attachments: attachments || [],
                mentions: mentions || []
            }
        });

        // Get sender info for response
        const messageWithSender = await db.message.findUnique({
            where: { id: message.id },
            include: {
                channel: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                }
            }
        });

        const { id, ...msgRest } = messageWithSender;
        const senderData = {
            _id: req.user.id,
            username: req.user.username,
            discriminator: req.user.discriminator,
            avatar: req.user.avatar
        };

        const responseData = {
            _id: id,
            ...msgRest,
            senderId: senderData
        };

        // Emit socket event
        if (global.io) {
            global.io.to(channelId).emit('receive_message', responseData);
        }

        res.status(201).json(responseData);
    } catch (error) {
        console.error('Create message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while sending message'
        });
    }
};

// Get messages in a channel
exports.getMessages = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { limit = 50, before } = req.query;

        // Check if channel exists
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

        // Build query
        const where = {
            channelId,
            isDeleted: false
        };

        if (before) {
            where.createdAt = { lt: new Date(before) };
        }

        // Fetch messages
        const messages = await db.message.findMany({
            where,
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' }
        });

        // Get unique sender IDs
        const senderIds = [...new Set(messages.map(m => m.senderId))];

        // Fetch sender info
        const senders = await db.user.findMany({
            where: { id: { in: senderIds } },
            select: {
                id: true,
                username: true,
                discriminator: true,
                avatar: true,
                status: true
            }
        });

        // Map senders to messages
        const sendersMap = Object.fromEntries(senders.map(s => {
            const { id, ...rest } = s;
            return [s.id, { _id: id, ...rest }];
        }));

        const messagesWithSenders = messages.map(msg => {
            const { id, ...rest } = msg;
            return {
                _id: id,
                ...rest,
                senderId: sendersMap[msg.senderId]
            };
        });

        res.status(200).json(messagesWithSenders.reverse());
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching messages'
        });
    }
};

// Edit message
exports.editMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        if (content.length > 4000) {
            return res.status(400).json({
                success: false,
                message: 'Message content must be 4000 characters or less'
            });
        }

        const message = await db.message.findUnique({
            where: { id }
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        if (message.senderId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own messages'
            });
        }

        if (message.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit a deleted message'
            });
        }

        const updatedMessage = await db.message.update({
            where: { id },
            data: { content, editedAt: new Date() }
        });

        const { id: msgId, ...rest } = updatedMessage;
        const responseData = { _id: msgId, ...rest };

        // Emit socket event
        if (global.io) {
            global.io.to(updatedMessage.channelId).emit('message_updated', responseData);
        }

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Edit message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while editing message'
        });
    }
};

// Delete message
exports.deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const message = await db.message.findUnique({
            where: { id },
            include: {
                channel: {
                    include: {
                        server: true
                    }
                }
            }
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // User can delete their own messages or if they're the server owner
        const isOwner = message.channel.server.ownerId === req.user.id;
        const isAuthor = message.senderId === req.user.id;

        if (!isOwner && !isAuthor) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this message'
            });
        }

        // Soft delete
        await db.message.update({
            where: { id },
            data: { isDeleted: true }
        });

        // Emit socket event
        if (global.io) {
            global.io.to(message.channelId).emit('message_deleted', { messageId: id });
        }

        res.status(200).json({
            success: true,
            messageId: id
        });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting message'
        });
    }
};
