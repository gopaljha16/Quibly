const db = require('../config/db');

// Update social links
exports.updateSocialLinks = async (req, res) => {
    try {
        const { github, twitter, linkedin, portfolio, website } = req.body;
        const userId = req.user.id;

        const socialLinks = {};
        if (github !== undefined) socialLinks.github = github;
        if (twitter !== undefined) socialLinks.twitter = twitter;
        if (linkedin !== undefined) socialLinks.linkedin = linkedin;
        if (portfolio !== undefined) socialLinks.portfolio = portfolio;
        if (website !== undefined) socialLinks.website = website;

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: { socialLinks },
            select: { id: true, socialLinks: true }
        });

        res.status(200).json({
            success: true,
            message: 'Social links updated successfully',
            socialLinks: updatedUser.socialLinks
        });
    } catch (error) {
        console.error('Update social links error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating social links'
        });
    }
};

// Update profile personalization
exports.updatePersonalization = async (req, res) => {
    try {
        const { location, cardStyle, fontStyle, showBanner, themeColor } = req.body;
        const userId = req.user.id;

        const updateData = {};
        if (location !== undefined) updateData.location = location;
        if (cardStyle !== undefined) {
            if (!['rounded', 'sharp', 'glass'].includes(cardStyle)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid card style'
                });
            }
            updateData.cardStyle = cardStyle;
        }
        if (fontStyle !== undefined) {
            if (!['default', 'modern', 'classic'].includes(fontStyle)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid font style'
                });
            }
            updateData.fontStyle = fontStyle;
        }
        if (showBanner !== undefined) updateData.showBanner = showBanner;
        if (themeColor !== undefined) updateData.themeColor = themeColor;

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                location: true,
                cardStyle: true,
                fontStyle: true,
                showBanner: true,
                themeColor: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Personalization updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update personalization error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating personalization'
        });
    }
};

// Update privacy settings
exports.updatePrivacySettings = async (req, res) => {
    try {
        const {
            emailVisible,
            mutualServersVisible,
            friendRequestsFrom,
            dmsFrom,
            showActivityStatus,
            showCurrentServer
        } = req.body;
        const userId = req.user.id;

        const privacySettings = {};
        if (emailVisible !== undefined) privacySettings.emailVisible = emailVisible;
        if (mutualServersVisible !== undefined) privacySettings.mutualServersVisible = mutualServersVisible;
        if (friendRequestsFrom !== undefined) privacySettings.friendRequestsFrom = friendRequestsFrom;
        if (dmsFrom !== undefined) privacySettings.dmsFrom = dmsFrom;
        if (showActivityStatus !== undefined) privacySettings.showActivityStatus = showActivityStatus;
        if (showCurrentServer !== undefined) privacySettings.showCurrentServer = showCurrentServer;

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: { privacySettings },
            select: { id: true, privacySettings: true }
        });

        res.status(200).json({
            success: true,
            message: 'Privacy settings updated successfully',
            privacySettings: updatedUser.privacySettings
        });
    } catch (error) {
        console.error('Update privacy settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating privacy settings'
        });
    }
};

// Get user stats
exports.getUserStats = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                messagesSent: true,
                voiceTimeMinutes: true,
                achievements: true,
                createdAt: true,
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

        // Get friends count (accepted friendships)
        const friendsCount = await db.friendship.count({
            where: {
                OR: [
                    { senderId: userId, status: 'ACCEPTED' },
                    { receiverId: userId, status: 'ACCEPTED' }
                ]
            }
        });

        const stats = {
            messagesSent: user.messagesSent || 0,
            voiceTimeMinutes: user.voiceTimeMinutes || 0,
            achievements: user.achievements || [],
            serversJoined: user._count.serverMembers + user._count.ownedServers,
            friendsCount: friendsCount,
            accountAge: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) // days
        };

        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user stats'
        });
    }
};

// Block user
exports.blockUser = async (req, res) => {
    try {
        const { userId: targetUserId } = req.params;
        const currentUserId = req.user.id;

        if (currentUserId === targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot block yourself'
            });
        }

        const currentUser = await db.user.findUnique({
            where: { id: currentUserId },
            select: { blockedUsers: true }
        });

        if (currentUser.blockedUsers.includes(targetUserId)) {
            return res.status(400).json({
                success: false,
                message: 'User is already blocked'
            });
        }

        // Remove from friends if they are friends
        const updatedFriends = currentUser.friends.filter(id => id !== targetUserId);
        const updatedBlockedUsers = [...currentUser.blockedUsers, targetUserId];

        await db.user.update({
            where: { id: currentUserId },
            data: {
                blockedUsers: updatedBlockedUsers,
                friends: updatedFriends
            }
        });

        res.status(200).json({
            success: true,
            message: 'User blocked successfully'
        });
    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while blocking user'
        });
    }
};

// Unblock user
exports.unblockUser = async (req, res) => {
    try {
        const { userId: targetUserId } = req.params;
        const currentUserId = req.user.id;

        const currentUser = await db.user.findUnique({
            where: { id: currentUserId },
            select: { blockedUsers: true }
        });

        if (!currentUser.blockedUsers.includes(targetUserId)) {
            return res.status(400).json({
                success: false,
                message: 'User is not blocked'
            });
        }

        const updatedBlockedUsers = currentUser.blockedUsers.filter(id => id !== targetUserId);

        await db.user.update({
            where: { id: currentUserId },
            data: { blockedUsers: updatedBlockedUsers }
        });

        res.status(200).json({
            success: true,
            message: 'User unblocked successfully'
        });
    } catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while unblocking user'
        });
    }
};
