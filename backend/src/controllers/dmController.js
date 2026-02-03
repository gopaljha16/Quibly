const db = require('../config/db');

// Get all DM conversations for the current user
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        const participantRecords = await db.dMParticipant.findMany({
            where: { userId },
            include: {
                dmRoom: {
                    include: {
                        participants: {
                            where: { userId: { not: userId } },
                            include: {
                                user: {
                                    select: {
                                        id: true, username: true, discriminator: true,
                                        avatar: true, status: true, customStatus: true,
                                        customStatusEmoji: true
                                    }
                                }
                            }
                        },
                        messages: {
                            take: 1,
                            orderBy: { createdAt: 'desc' },
                            select: { content: true, createdAt: true, senderId: true }
                        }
                    }
                }
            },
            orderBy: { dmRoom: { updatedAt: 'desc' } }
        });

        const conversations = participantRecords.map(record => {
            const otherParticipant = record.dmRoom.participants[0];
            return {
                id: record.dmRoom.id,
                otherUser: otherParticipant ? otherParticipant.user : null,
                lastMessage: record.dmRoom.messages[0] || null,
                updatedAt: record.dmRoom.updatedAt
            };
        });

        res.status(200).json({ success: true, conversations });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get or create a DM room with another user
exports.getOrCreateDM = async (req, res) => {
    try {
        const { userId: otherUserId } = req.body;
        const myUserId = req.user.id;

        if (!otherUserId) return res.status(400).json({ success: false, message: 'User ID is required' });
        if (otherUserId === myUserId) return res.status(400).json({ success: false, message: 'Cannot create DM with yourself' });

        const existingRoom = await db.dMRoom.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: myUserId } } },
                    { participants: { some: { userId: otherUserId } } }
                ]
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, username: true, discriminator: true, avatar: true, status: true }
                        }
                    }
                }
            }
        });

        if (existingRoom) return res.status(200).json({ success: true, room: existingRoom });

        const newRoom = await db.$transaction(async (tx) => {
            const room = await tx.dMRoom.create({ data: {} });
            await tx.dMParticipant.createMany({
                data: [
                    { dmRoomId: room.id, userId: myUserId },
                    { dmRoomId: room.id, userId: otherUserId }
                ]
            });
            return await tx.dMRoom.findUnique({
                where: { id: room.id },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: { id: true, username: true, discriminator: true, avatar: true, status: true }
                            }
                        }
                    }
                }
            });
        });

        res.status(201).json({ success: true, room: newRoom });
    } catch (error) {
        console.error('Get/Create DM error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get room by ID
exports.getDMByRoomId = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        const participant = await db.dMParticipant.findFirst({
            where: { dmRoomId: roomId, userId }
        });

        if (!participant) return res.status(403).json({ success: false, message: 'Access denied' });

        const room = await db.dMRoom.findUnique({
            where: { id: roomId },
            include: {
                participants: {
                    where: { userId: { not: userId } },
                    include: {
                        user: {
                            select: {
                                id: true, username: true, discriminator: true,
                                avatar: true, status: true, customStatus: true,
                                customStatusEmoji: true
                            }
                        }
                    }
                }
            }
        });

        const allParticipants = await db.dMParticipant.findMany({
            where: { dmRoomId: roomId },
            include: {
                user: {
                    select: {
                        id: true, username: true, discriminator: true,
                        avatar: true, status: true, customStatus: true,
                        customStatusEmoji: true
                    }
                }
            }
        });

        const otherParticipant = allParticipants.find(p => String(p.userId) !== String(userId));
        const otherUser = otherParticipant?.user || null;
        const otherUserId = otherUser?.id || otherParticipant?.userId;

        let mutualServers = [];
        let friendshipStatus = null;

        if (otherUserId) {
            try {
                // Get friendship status
                const friendship = await db.friendship.findFirst({
                    where: {
                        OR: [
                            { senderId: userId, receiverId: otherUserId },
                            { senderId: otherUserId, receiverId: userId }
                        ]
                    }
                });
                friendshipStatus = friendship ? friendship.status : null;

                const myMemberships = await db.serverMember.findMany({
                    where: { userId: userId },
                    select: { serverId: true }
                });
                const myServerIds = myMemberships.map(m => m.serverId);

                if (myServerIds.length > 0) {
                    const mutualMemberships = await db.serverMember.findMany({
                        where: {
                            userId: otherUserId,
                            serverId: { in: myServerIds }
                        },
                        include: {
                            server: {
                                select: { id: true, name: true, icon: true }
                            }
                        }
                    });
                    mutualServers = mutualMemberships.map(m => m.server);
                }
            } catch (err) {
                console.error('Mutual server/friendship lookup failed:', err);
            }
        }

        res.status(200).json({
            success: true,
            room: {
                id: room.id,
                createdAt: room.createdAt,
                updatedAt: room.updatedAt,
                otherUser,
                participants: allParticipants,
                mutualServers,
                friendshipStatus
            }
        });
    } catch (error) {
        console.error('Get DM by ID error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
