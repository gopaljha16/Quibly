const db = require('../config/db');
const redis = require('../config/redis');
const { publishMessage } = require('../services/messageProducer');
const { isKafkaConnected } = require('../config/kafka');

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

        // Get sender info
        const sender = await db.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                discriminator: true,
                avatar: true
            }
        });

        // Generate message ID
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Create message object
        const messageData = {
            id: messageId,
            channelId: channelId,
            serverId: channel.serverId,
            senderId: req.user.id,
            content: content?.trim() || '',
            type: type || 'TEXT', // Changed from 'DEFAULT' to 'TEXT'
            sender: sender,
            createdAt: new Date().toISOString(),
            attachments: attachments || [],
            mentions: mentions || []
        };

        // Use Kafka for scalable message processing
        const useKafka = true;
        
        // Try to publish to Kafka first
        if (useKafka && isKafkaConnected()) {
            const published = await publishMessage(messageData);
            
            if (published) {
                // HYBRID APPROACH: Broadcast immediately via WebSocket for instant delivery
                // Kafka will still save to DB for durability
                const responseData = {
                    _id: messageId,
                    channelId: channelId,
                    serverId: channel.serverId,
                    senderId: {
                        _id: sender.id,
                        username: sender.username,
                        discriminator: sender.discriminator,
                        avatar: sender.avatar
                    },
                    content: content?.trim() || '',
                    type: type || 'TEXT',
                    attachments: attachments || [],
                    mentions: mentions || [],
                    createdAt: messageData.createdAt,
                    isDeleted: false
                };
                
                // Broadcast immediately for instant delivery
                if (global.io) {
                    global.io.to(channelId).emit('receive_message', responseData);
                }
                
                return res.status(201).json(responseData);
            } else {
                console.error('⚠️  Kafka publish failed, falling back to direct DB');
            }
        } else {
            console.error('⚠️  Kafka not connected, using direct DB write');
        }

        // Fallback: Direct DB write if Kafka is not available
        const message = await db.message.create({
            data: {
                id: messageId,
                channelId,
                serverId: channel.serverId,
                senderId: req.user.id,
                content: content || '',
                type: type || 'TEXT',
                attachments: attachments || [],
                mentions: mentions || []
            }
        });

        const responseData = {
            _id: message.id,
            channelId: message.channelId,
            serverId: message.serverId,
            senderId: {
                _id: sender.id,
                username: sender.username,
                discriminator: sender.discriminator,
                avatar: sender.avatar
            },
            content: message.content,
            type: message.type,
            attachments: message.attachments,
            mentions: message.mentions,
            createdAt: message.createdAt
        };

        // Emit socket event (fallback mode)
        if (global.io) {
            global.io.to(channelId).emit('receive_message', responseData);
        }

        res.status(201).json(responseData);
    } catch (error) {
        console.error('❌ Create message error:', error);
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

        // STEP 1: Try to get messages from Redis cache (fast!)
        let messages = [];
        let fromCache = false;
        
        if (redis.isConnected()) {
            // Get all cached messages (up to 100)
            const cachedMessages = await redis.getCachedMessages(channelId, 100);
            
            if (cachedMessages && cachedMessages.length > 0) {
                // Apply pagination filter if 'before' timestamp is provided
                let filteredMessages = cachedMessages;
                if (before) {
                    const beforeDate = new Date(before);
                    filteredMessages = cachedMessages.filter(msg => 
                        new Date(msg.createdAt) < beforeDate
                    );
                }
                
                // Take only the requested limit
                messages = filteredMessages.slice(0, parseInt(limit));
                
                // Only use cache if we got enough messages
                if (messages.length > 0) {
                    fromCache = true;
                }
            }
        }

        // STEP 2: Fallback to PostgreSQL if not in cache or need older messages
        if (!fromCache) {
            // Build query
            const where = {
                channelId,
                isDeleted: false
            };

            if (before) {
                where.createdAt = { lt: new Date(before) };
            }

            // Fetch messages from DB
            messages = await db.message.findMany({
                where,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' }
            });
        }

        // Get unique sender IDs
        const senderIds = [...new Set(messages.map(m => {
            // Handle both cached format (senderId is object) and DB format (senderId is string)
            return typeof m.senderId === 'string' ? m.senderId : m.senderId?._id;
        }))].filter(Boolean);

        // Fetch sender info if needed (for DB messages)
        let sendersMap = {};
        if (!fromCache && senderIds.length > 0) {
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

            sendersMap = Object.fromEntries(senders.map(s => {
                const { id, ...rest } = s;
                return [s.id, { _id: id, ...rest }];
            }));
        }

        // Format messages
        const messagesWithSenders = messages.map(msg => {
            if (fromCache) {
                // Cached messages already have sender info
                return msg;
            } else {
                // DB messages need sender info added
                const { id, ...rest } = msg;
                return {
                    _id: id,
                    ...rest,
                    senderId: sendersMap[msg.senderId] || msg.senderId
                };
            }
        });

        // Return in chronological order (oldest first)
        const sortedMessages = messagesWithSenders.reverse();
        
        res.status(200).json(sortedMessages);
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
