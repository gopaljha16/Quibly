const db = require('../config/db');
const redis = require('../config/redis');
const { publishMessage } = require('../services/messageProducer');
const { isKafkaConnected } = require('../config/kafka');
const { canAccessChannel } = require('../utils/channelPermissions');
const { checkMessageAutoMod } = require('./autoModController');
const { createAuditLog } = require('./auditLogController');

// Send new message
exports.createMessage = async (req, res) => {
    try {
        const { channelId, dmRoomId, content, type, attachments, mentions, parentId } = req.body;

        if (!channelId && !dmRoomId) {
            return res.status(400).json({
                success: false,
                message: 'Channel ID or DM Room ID is required'
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

        let serverId = null;
        let targetId = null;

        if (channelId) {
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

            // Check if user has permission to access this channel
            const hasAccess = await canAccessChannel(req.user.id, channelId);

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this channel'
                });
            }

            // Get member info for additional checks
            const member = await db.serverMember.findFirst({
                where: {
                    serverId: channel.serverId,
                    userId: req.user.id
                }
            });

            // Check if user is banned
            if (member.isBanned) {
                return res.status(403).json({
                    success: false,
                    message: 'You are banned from this server'
                });
            }

            if (member.isMuted) {
                return res.status(403).json({
                    success: false,
                    message: 'You are muted in this server'
                });
            }

            // Check for timeout
            if (member.timeoutUntil && new Date(member.timeoutUntil) > new Date()) {
                return res.status(403).json({
                    success: false,
                    message: 'You are timed out from this server',
                    timeoutUntil: member.timeoutUntil,
                    timeoutReason: member.timeoutReason
                });
            }

            serverId = channel.serverId;

            // Check for banned words
            const server = await db.server.findUnique({
                where: { id: serverId },
                select: { ownerId: true, bannedWords: true }
            });

            // Check if channel is read-only and user is not owner
            if (channel.isReadOnly && server.ownerId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Only the server owner can message in this channel'
                });
            }

            // --- SLOW MODE CHECK ---
            if (channel.slowMode > 0 && server.ownerId !== req.user.id) {
                // Find the user's last message in this channel
                const lastMessage = await db.message.findFirst({
                    where: {
                        channelId: channelId,
                        senderId: req.user.id,
                        isDeleted: false
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });

                if (lastMessage) {
                    const lastMsgTime = new Date(lastMessage.createdAt).getTime();
                    const now = Date.now();
                    const diffSeconds = Math.floor((now - lastMsgTime) / 1000);

                    if (diffSeconds < channel.slowMode) {
                        return res.status(429).json({
                            success: false,
                            message: `Slow mode is enabled. Please wait ${channel.slowMode - diffSeconds} more seconds.`,
                            cooldown: channel.slowMode - diffSeconds
                        });
                    }
                }
            }
            // -----------------------

            if (server && server.bannedWords && server.bannedWords.length > 0 && content) {
                const lowerContent = content.toLowerCase();
                for (const word of server.bannedWords) {
                    if (lowerContent.includes(word.toLowerCase())) {
                        return res.status(400).json({
                            success: false,
                            message: `Message contains a banned word: ${word}`,
                            bannedWord: word
                        });
                    }
                }
            }

            // Check auto-moderation rules
            if (content) {
                const autoModResult = await checkMessageAutoMod(
                    serverId,
                    channelId,
                    req.user.id,
                    content,
                    member.roleIds
                );

                if (autoModResult.triggered) {
                    // Execute auto-mod actions
                    const actions = autoModResult.actions;
                    
                    for (const action of actions) {
                        // Handle both string and object action formats
                        const actionType = typeof action === 'string' ? action : action.type;
                        
                        switch (actionType) {
                            case 'DELETE_MESSAGE':
                                // Message won't be created
                                await createAuditLog({
                                    serverId,
                                    userId: req.user.id,
                                    action: 'AUTO_MOD_MESSAGE_BLOCKED',
                                    metadata: { rule: autoModResult.rule.name, content }
                                });
                                return res.status(400).json({
                                    success: false,
                                    message: 'Your message was blocked by auto-moderation',
                                    rule: autoModResult.rule.name
                                });

                            case 'TIMEOUT':
                                const duration = action.duration || 10; // minutes
                                
                                await db.serverMember.update({
                                    where: { serverId_userId: { serverId, userId: req.user.id } },
                                    data: {
                                        timeoutUntil: new Date(Date.now() + duration * 60 * 1000),
                                        timeoutReason: `Auto-mod: ${autoModResult.rule.name}`
                                    }
                                });
                                
                                await createAuditLog({
                                    serverId,
                                    userId: req.user.id,
                                    action: 'AUTO_MOD_TIMEOUT',
                                    targetType: 'User',
                                    targetId: req.user.id,
                                    metadata: { rule: autoModResult.rule.name, duration }
                                });
                                
                                // Emit socket event
                                if (global.io) {
                                    global.io.to(req.user.id).emit('auto_mod_timeout', {
                                        serverId,
                                        duration,
                                        reason: `Auto-mod: ${autoModResult.rule.name}`
                                    });
                                }
                                
                                break;

                            case 'WARN':
                                // Send warning message
                                if (global.io) {
                                    global.io.to(req.user.id).emit('auto_mod_warning', {
                                        rule: autoModResult.rule.name,
                                        message: action.message || 'Your message violated server rules'
                                    });
                                }
                                break;
                        }
                    }
                }
            }

            targetId = channelId;
        } else if (dmRoomId) {
            // Check if user is a participant of the DM room
            const participant = await db.dMParticipant.findFirst({
                where: {
                    dmRoomId,
                    userId: req.user.id
                }
            });

            if (!participant) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have access to this DM room'
                });
            }

            targetId = dmRoomId;

            // Update DMRoom updatedAt to bring it to top of list
            await db.dMRoom.update({
                where: { id: dmRoomId },
                data: { updatedAt: new Date() }
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

        // Fetch parent message if it's a reply
        let parentData = null;
        if (parentId) {
            try {
                const parentMsg = await db.message.findUnique({
                    where: { id: parentId },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                });
                if (parentMsg && parentMsg.sender) {
                    parentData = {
                        _id: parentMsg.id,
                        content: parentMsg.content,
                        senderId: {
                            _id: parentMsg.sender.id,
                            username: parentMsg.sender.username,
                            avatar: parentMsg.sender.avatar
                        }
                    };
                }
            } catch (err) {
                console.error("Error fetching parent message:", err);
                // Fallback: just send parentId, context will be resolved by sender if possible
            }
        }

        // Create message object
        const messageData = {
            id: messageId,
            channelId: channelId || null,
            dmRoomId: dmRoomId || null,
            serverId: serverId,
            senderId: req.user.id,
            content: content?.trim() || '',
            type: type || 'TEXT',
            sender: sender,
            createdAt: new Date().toISOString(),
            attachments: attachments || [],
            mentions: mentions || [],
            parentId: parentId || null,
            parent: parentData
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
                    channelId: channelId || null,
                    dmRoomId: dmRoomId || null,
                    serverId: serverId,
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
                    isDeleted: false,
                    parentId: parentId || null
                };

                // Broadcast immediately for instant delivery
                if (global.io) {
                    global.io.to(targetId).emit('receive_message', responseData);
                }

                // Track activity (Sync/Async)
                try {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // 1. Increment total messages for user
                    await db.user.update({
                        where: { id: req.user.id },
                        data: { messagesSent: { increment: 1 } }
                    });

                    // 2. Update daily activity heatmap
                    await db.userDailyActivity.upsert({
                        where: {
                            userId_date: {
                                userId: req.user.id,
                                date: today
                            }
                        },
                        update: {
                            count: { increment: 1 },
                            messageCount: { increment: 1 }
                        },
                        create: {
                            userId: req.user.id,
                            date: today,
                            count: 1,
                            messageCount: 1
                        }
                    });
                } catch (activityError) {
                    console.error('⚠️ Failed to track activity metrics (Kafka branch):', activityError);
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
                channelId: channelId || null,
                dmRoomId: dmRoomId || null,
                serverId: serverId,
                senderId: req.user.id,
                content: content || '',
                type: type || 'TEXT',
                attachments: attachments || [],
                mentions: mentions || [],
                parentId: parentId || null
            }
        });

        // Track activity (Sync/Async)
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 1. Increment total messages for user
            await db.user.update({
                where: { id: req.user.id },
                data: { messagesSent: { increment: 1 } }
            });

            // 2. Update daily activity heatmap
            await db.userDailyActivity.upsert({
                where: {
                    userId_date: {
                        userId: req.user.id,
                        date: today
                    }
                },
                update: {
                    count: { increment: 1 },
                    messageCount: { increment: 1 }
                },
                create: {
                    userId: req.user.id,
                    date: today,
                    count: 1,
                    messageCount: 1
                }
            });
        } catch (activityError) {
            console.error('⚠️ Failed to track activity metrics:', activityError);
        }

        const responseData = {
            _id: message.id,
            channelId: message.channelId,
            dmRoomId: message.dmRoomId,
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
            createdAt: message.createdAt,
            parentId: message.parentId
        };

        // Emit socket event (fallback mode)
        if (global.io) {
            global.io.to(targetId).emit('receive_message', responseData);
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
        const { channelId, dmRoomId } = req.params;
        const { limit = 50, before } = req.query;

        const targetId = channelId || dmRoomId;

        if (!targetId) {
            return res.status(400).json({ success: false, message: 'ID is required' });
        }

        if (channelId) {
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

            // Check if user has permission to access this channel
            const hasAccess = await canAccessChannel(req.user.id, channelId);

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this channel'
                });
            }
        } else if (dmRoomId) {
            // Check if user is a participant of the DM room
            const participant = await db.dMParticipant.findFirst({
                where: {
                    dmRoomId,
                    userId: req.user.id
                }
            });

            if (!participant) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have access to this DM room'
                });
            }
        }

        // STEP 1: Try to get messages from Redis cache (fast!)
        let messages = [];
        let fromCache = false;

        if (redis.isConnected()) {
            // Get all cached messages (up to 100)
            const cachedMessages = await redis.getCachedMessages(targetId, 100);

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
                channelId: channelId || null,
                dmRoomId: dmRoomId || null,
                isDeleted: false
            };

            if (before) {
                where.createdAt = { lt: new Date(before) };
            }

            // Fetch messages from DB
            messages = await db.message.findMany({
                where,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    reactions: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    avatar: true
                                }
                            }
                        }
                    },
                    parent: {
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    username: true,
                                    avatar: true
                                }
                            }
                        }
                    }
                }
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
                const { id, parent, ...rest } = msg;
                const formattedParent = parent ? {
                    _id: parent.id,
                    content: parent.content,
                    senderId: parent.sender ? {
                        _id: parent.sender.id,
                        username: parent.sender.username,
                        avatar: parent.sender.avatar
                    } : parent.senderId
                } : null;

                return {
                    _id: id,
                    ...rest,
                    parent: formattedParent,
                    senderId: sendersMap[msg.senderId] || {
                        _id: msg.senderId,
                        username: 'Unknown User',
                        discriminator: '0000',
                        avatar: null
                    }
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

        // Check for banned words if it's a server message
        if (message.serverId) {
            const server = await db.server.findUnique({
                where: { id: message.serverId },
                select: { bannedWords: true }
            });

            if (server && server.bannedWords && server.bannedWords.length > 0) {
                const lowerContent = content.toLowerCase();
                for (const word of server.bannedWords) {
                    if (lowerContent.includes(word.toLowerCase())) {
                        return res.status(400).json({
                            success: false,
                            message: `Message contains a banned word: ${word}`,
                            bannedWord: word
                        });
                    }
                }
            }
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

        // Get sender info for response
        const sender = await db.user.findUnique({
            where: { id: updatedMessage.senderId },
            select: {
                id: true,
                username: true,
                discriminator: true,
                avatar: true
            }
        });

        if (!sender) {
            console.error('Edit message error: Sender not found for message:', id);
            return res.status(500).json({
                success: false,
                message: 'Sender information not found'
            });
        }

        const responseData = {
            _id: updatedMessage.id,
            channelId: updatedMessage.channelId,
            dmRoomId: updatedMessage.dmRoomId,
            serverId: updatedMessage.serverId,
            senderId: {
                _id: sender.id,
                username: sender.username,
                discriminator: sender.discriminator,
                avatar: sender.avatar
            },
            content: updatedMessage.content,
            type: updatedMessage.type,
            attachments: updatedMessage.attachments,
            mentions: updatedMessage.mentions,
            createdAt: updatedMessage.createdAt,
            editedAt: updatedMessage.editedAt,
            isDeleted: updatedMessage.isDeleted
        };

        // Emit socket event to the correct room (channel or DM)
        if (global.io) {
            const targetRoom = updatedMessage.channelId || updatedMessage.dmRoomId;
            if (targetRoom) {
                global.io.to(targetRoom).emit('message_updated', responseData);
            }
        }

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Edit message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while editing message',
            error: error.message
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

// Pin message
exports.pinMessage = async (req, res) => {
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

        if (!message.channelId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot pin messages in DMs'
            });
        }

        if (message.isPinned) {
            return res.status(400).json({
                success: false,
                message: 'Message is already pinned'
            });
        }

        // Check if user is server owner
        const isOwner = message.channel.server.ownerId === req.user.id;

        // TODO: Add role-based permission check here when role permissions are implemented
        // For now, only server owners can pin messages

        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to pin messages'
            });
        }

        // Pin the message
        const pinnedMessage = await db.message.update({
            where: { id },
            data: {
                isPinned: true,
                pinnedAt: new Date(),
                pinnedBy: req.user.id
            }
        });

        // Get sender info for response
        const sender = await db.user.findUnique({
            where: { id: pinnedMessage.senderId },
            select: {
                id: true,
                username: true,
                discriminator: true,
                avatar: true
            }
        });

        const responseData = {
            _id: pinnedMessage.id,
            channelId: pinnedMessage.channelId,
            dmRoomId: pinnedMessage.dmRoomId,
            serverId: pinnedMessage.serverId,
            senderId: {
                _id: sender.id,
                username: sender.username,
                discriminator: sender.discriminator,
                avatar: sender.avatar
            },
            content: pinnedMessage.content,
            type: pinnedMessage.type,
            attachments: pinnedMessage.attachments,
            mentions: pinnedMessage.mentions,
            createdAt: pinnedMessage.createdAt,
            editedAt: pinnedMessage.editedAt,
            isDeleted: pinnedMessage.isDeleted,
            isPinned: pinnedMessage.isPinned,
            pinnedAt: pinnedMessage.pinnedAt,
            pinnedBy: pinnedMessage.pinnedBy
        };

        // Emit socket event
        if (global.io) {
            global.io.to(message.channelId).emit('message_pinned', responseData);
        }

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Pin message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while pinning message'
        });
    }
};

// Unpin message
exports.unpinMessage = async (req, res) => {
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

        if (!message.channelId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot unpin messages in DMs'
            });
        }

        if (!message.isPinned) {
            return res.status(400).json({
                success: false,
                message: 'Message is not pinned'
            });
        }

        // Check if user is server owner
        const isOwner = message.channel.server.ownerId === req.user.id;

        // TODO: Add role-based permission check here when role permissions are implemented
        // For now, only server owners can unpin messages

        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to unpin messages'
            });
        }

        // Unpin the message
        const unpinnedMessage = await db.message.update({
            where: { id },
            data: {
                isPinned: false,
                pinnedAt: null,
                pinnedBy: null
            }
        });

        // Get sender info for response
        const sender = await db.user.findUnique({
            where: { id: unpinnedMessage.senderId },
            select: {
                id: true,
                username: true,
                discriminator: true,
                avatar: true
            }
        });

        const responseData = {
            _id: unpinnedMessage.id,
            channelId: unpinnedMessage.channelId,
            dmRoomId: unpinnedMessage.dmRoomId,
            serverId: unpinnedMessage.serverId,
            senderId: {
                _id: sender.id,
                username: sender.username,
                discriminator: sender.discriminator,
                avatar: sender.avatar
            },
            content: unpinnedMessage.content,
            type: unpinnedMessage.type,
            attachments: unpinnedMessage.attachments,
            mentions: unpinnedMessage.mentions,
            createdAt: unpinnedMessage.createdAt,
            editedAt: unpinnedMessage.editedAt,
            isDeleted: unpinnedMessage.isDeleted,
            isPinned: unpinnedMessage.isPinned,
            pinnedAt: unpinnedMessage.pinnedAt,
            pinnedBy: unpinnedMessage.pinnedBy
        };

        // Emit socket event
        if (global.io) {
            global.io.to(message.channelId).emit('message_unpinned', responseData);
        }

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Unpin message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while unpinning message'
        });
    }
};

// Get pinned messages for a channel
exports.getPinnedMessages = async (req, res) => {
    try {
        const { channelId } = req.params;

        if (!channelId) {
            return res.status(400).json({
                success: false,
                message: 'Channel ID is required'
            });
        }

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

        // Fetch pinned messages
        const pinnedMessages = await db.message.findMany({
            where: {
                channelId,
                isPinned: true,
                isDeleted: false
            },
            orderBy: { pinnedAt: 'desc' }
        });

        // Get unique sender IDs
        const senderIds = [...new Set(pinnedMessages.map(m => m.senderId))];

        // Fetch sender info
        const senders = await db.user.findMany({
            where: { id: { in: senderIds } },
            select: {
                id: true,
                username: true,
                discriminator: true,
                avatar: true
            }
        });

        const sendersMap = Object.fromEntries(senders.map(s => {
            const { id, ...rest } = s;
            return [s.id, { _id: id, ...rest }];
        }));

        // Format messages with sender info
        const messagesWithSenders = pinnedMessages.map(msg => {
            const { id, ...rest } = msg;
            return {
                _id: id,
                ...rest,
                senderId: sendersMap[msg.senderId] || msg.senderId
            };
        });

        res.status(200).json(messagesWithSenders);
    } catch (error) {
        console.error('Get pinned messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching pinned messages'
        });
    }
};

