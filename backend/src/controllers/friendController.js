const db = require('../config/db');

// Send a friend request
exports.sendFriendRequest = async (req, res) => {
    try {
        const { username, discriminator } = req.body;
        const senderId = req.user.id;

        if (!username || !discriminator) {
            return res.status(400).json({
                success: false,
                message: 'Username and discriminator are required'
            });
        }

        const receiver = await db.user.findFirst({
            where: {
                username: { equals: username, mode: 'insensitive' },
                discriminator
            }
        });

        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (receiver.id === senderId) {
            return res.status(400).json({
                success: false,
                message: "You cannot add yourself as a friend"
            });
        }

        // Check if friendship already exists
        const existingFriendship = await db.friendship.findFirst({
            where: {
                OR: [
                    { senderId, receiverId: receiver.id },
                    { senderId: receiver.id, receiverId: senderId }
                ]
            }
        });

        if (existingFriendship) {
            if (existingFriendship.status === 'ACCEPTED') {
                return res.status(400).json({ success: false, message: 'You are already friends' });
            }
            if (existingFriendship.status === 'PENDING') {
                return res.status(400).json({ success: false, message: 'Friend request already pending' });
            }
            if (existingFriendship.status === 'BLOCKED') {
                return res.status(400).json({ success: false, message: 'User is blocked' });
            }
        }

        const friendship = await db.friendship.create({
            data: {
                senderId,
                receiverId: receiver.id,
                status: 'PENDING'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Friend request sent',
            friendship
        });
    } catch (error) {
        console.error('Send friend request error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Accept a friend request
exports.acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;

        const friendship = await db.friendship.findUnique({
            where: { id: requestId }
        });

        if (!friendship || friendship.receiverId !== userId) {
            return res.status(404).json({ success: false, message: 'Friend request not found' });
        }

        if (friendship.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: 'Request already processed' });
        }

        const updatedFriendship = await db.friendship.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED' }
        });

        res.status(200).json({
            success: true,
            message: 'Friend request accepted',
            friendship: updatedFriendship
        });
    } catch (error) {
        console.error('Accept friend request error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Reject / Cancel a friend request
exports.rejectFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;

        const friendship = await db.friendship.findUnique({
            where: { id: requestId }
        });

        if (!friendship || (friendship.receiverId !== userId && friendship.senderId !== userId)) {
            return res.status(404).json({ success: false, message: 'Friend request not found' });
        }

        await db.friendship.delete({
            where: { id: requestId }
        });

        res.status(200).json({
            success: true,
            message: 'Friend request removed'
        });
    } catch (error) {
        console.error('Reject friend request error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get pending requests
exports.getPendingRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const requests = await db.friendship.findMany({
            where: {
                OR: [
                    { senderId: userId, status: 'PENDING' },
                    { receiverId: userId, status: 'PENDING' }
                ]
            },
            include: {
                sender: {
                    select: { id: true, username: true, discriminator: true, avatar: true, status: true }
                },
                receiver: {
                    select: { id: true, username: true, discriminator: true, avatar: true, status: true }
                }
            }
        });

        res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get friends list
exports.getFriends = async (req, res) => {
    try {
        const userId = req.user.id;

        const friendships = await db.friendship.findMany({
            where: {
                OR: [
                    { senderId: userId, status: 'ACCEPTED' },
                    { receiverId: userId, status: 'ACCEPTED' }
                ]
            },
            include: {
                sender: {
                    select: { id: true, username: true, discriminator: true, avatar: true, status: true, customStatus: true, customStatusEmoji: true }
                },
                receiver: {
                    select: { id: true, username: true, discriminator: true, avatar: true, status: true, customStatus: true, customStatusEmoji: true }
                }
            }
        });

        // Map to flat list of friends
        const friends = friendships.map(f => {
            const friend = f.senderId === userId ? f.receiver : f.sender;
            return {
                ...friend,
                friendshipId: f.id
            };
        });

        res.status(200).json({
            success: true,
            friends
        });
    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Remove friend
exports.removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user.id;

        const friendship = await db.friendship.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId: friendId },
                    { senderId: friendId, receiverId: userId }
                ]
            }
        });

        if (!friendship) {
            return res.status(404).json({ success: false, message: 'Friendship not found' });
        }

        await db.friendship.delete({
            where: { id: friendship.id }
        });

        res.status(200).json({
            success: true,
            message: 'Friend removed'
        });
    } catch (error) {
        console.error('Remove friend error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Block user
exports.blockUser = async (req, res) => {
    try {
        const { userId: targetId } = req.body;
        const myUserId = req.user.id;

        if (!targetId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        if (targetId === myUserId) {
            return res.status(400).json({ success: false, message: 'You cannot block yourself' });
        }

        // Find existing friendship
        const existingFriendship = await db.friendship.findFirst({
            where: {
                OR: [
                    { senderId: myUserId, receiverId: targetId },
                    { senderId: targetId, receiverId: myUserId }
                ]
            }
        });

        if (existingFriendship) {
            // Update existing record
            await db.friendship.update({
                where: { id: existingFriendship.id },
                data: {
                    status: 'BLOCKED',
                    senderId: myUserId, // The blocker is now the sender in this record
                    receiverId: targetId
                }
            });
        } else {
            // Create new blocked record
            await db.friendship.create({
                data: {
                    senderId: myUserId,
                    receiverId: targetId,
                    status: 'BLOCKED'
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'User blocked'
        });
    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
