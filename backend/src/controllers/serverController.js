const db = require('../config/db');

// Create new server
exports.createServer = async (req, res) => {
    try {
        const { name, icon, description, isPublic } = req.body;

        if (!name || name.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Server name is required and must be 100 characters or less'
            });
        }

        if (description && description.length > 300) {
            return res.status(400).json({
                success: false,
                message: 'Description must be 300 characters or less'
            });
        }

        // Create server
        const server = await db.server.create({
            data: {
                name,
                ownerId: req.user.id,
                icon: icon || null,
                description: description || null,
                isPublic: isPublic || false,
                membersCount: 1
            }
        });

        // Create default @everyone role
        const defaultRole = await db.role.create({
            data: {
                name: '@everyone',
                serverId: server.id,
                isDefault: true,
                permissions: 0,
                position: 0,
                hoist: false
            }
        });

        // Create 'Owner' role (hoisted)
        const ownerRole = await db.role.create({
            data: {
                name: 'Owner',
                serverId: server.id,
                isDefault: false,
                permissions: 1073741823, // Full permissions
                position: 1,
                hoist: true,
                color: '#F0B232' // Gold color
            }
        });

        // Add creator as server member
        await db.serverMember.create({
            data: {
                serverId: server.id,
                userId: req.user.id,
                roleIds: [defaultRole.id, ownerRole.id]
            }
        });

        const { id, ...rest } = server;
        res.status(201).json({
            success: true,
            message: 'Server created successfully',
            server: { _id: id, ...rest }
        });
    } catch (error) {
        console.error('Create server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating server'
        });
    }
};

// Get user's servers
exports.getMyServers = async (req, res) => {
    try {
        const serverMembers = await db.serverMember.findMany({
            where: { userId: req.user.id },
            include: {
                server: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                        banner: true,
                        description: true,
                        ownerId: true,
                        membersCount: true,
                        isPublic: true,
                        createdAt: true
                    }
                }
            }
        });

        const servers = serverMembers.map(sm => {
            const { id, ...rest } = sm.server;
            return {
                _id: id,
                ...rest,
                isOwner: sm.server.ownerId === req.user.id
            };
        });

        res.status(200).json({
            success: true,
            data: servers
        });
    } catch (error) {
        console.error('Get my servers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching servers'
        });
    }
};

// Get server by ID
exports.getServerById = async (req, res) => {
    try {
        const { serverId } = req.params;

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

        const server = await db.server.findUnique({
            where: { id: serverId },
            include: {
                owner: {
                    select: {
                        id: true,
                        username: true,
                        discriminator: true,
                        avatar: true
                    }
                }
            }
        });

        if (!server) {
            return res.status(404).json({
                success: false,
                message: 'Server not found'
            });
        }

        res.status(200).json({
            success: true,
            server: {
                ...server,
                isOwner: server.ownerId === req.user.id
            }
        });
    } catch (error) {
        console.error('Get server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching server'
        });
    }
};

// Update server
exports.updateServer = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { name, icon, banner, description, isPublic, verificationLevel, bannedWords } = req.body;

        // Check if user is owner
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
                message: 'Only the server owner can update server settings'
            });
        }

        // Validate inputs
        if (name && name.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Server name must be 100 characters or less'
            });
        }

        if (description && description.length > 300) {
            return res.status(400).json({
                success: false,
                message: 'Description must be 300 characters or less'
            });
        }

        // Build update object
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (icon !== undefined) updateData.icon = icon;
        if (banner !== undefined) updateData.banner = banner;
        if (description !== undefined) updateData.description = description;
        if (isPublic !== undefined) updateData.isPublic = isPublic;
        if (verificationLevel !== undefined) {
            if (!['none', 'low', 'medium', 'high'].includes(verificationLevel)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid verification level'
                });
            }
            updateData.verificationLevel = verificationLevel;
        }

        if (bannedWords !== undefined) {
            if (!Array.isArray(bannedWords)) {
                return res.status(400).json({
                    success: false,
                    message: 'Banned words must be an array'
                });
            }
            updateData.bannedWords = bannedWords;
        }

        const updatedServer = await db.server.update({
            where: { id: serverId },
            data: updateData
        });

        res.status(200).json({
            success: true,
            message: 'Server updated successfully',
            server: updatedServer
        });
    } catch (error) {
        console.error('Update server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating server'
        });
    }
};

// Delete server
exports.deleteServer = async (req, res) => {
    try {
        const { serverId } = req.params;

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
                message: 'Only the server owner can delete the server'
            });
        }

        // Delete server (cascade will delete members, channels, etc.)
        await db.server.delete({
            where: { id: serverId }
        });

        res.status(200).json({
            success: true,
            message: 'Server deleted successfully'
        });
    } catch (error) {
        console.error('Delete server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting server'
        });
    }
};

// Join server
exports.joinServer = async (req, res) => {
    try {
        const { serverId } = req.params;

        const server = await db.server.findUnique({
            where: { id: serverId }
        });

        if (!server) {
            return res.status(404).json({
                success: false,
                message: 'Server not found'
            });
        }

        // Check if already a member
        const existingMember = await db.serverMember.findFirst({
            where: {
                serverId,
                userId: req.user.id
            }
        });

        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of this server'
            });
        }

        // Add as member
        await db.serverMember.create({
            data: {
                serverId,
                userId: req.user.id,
                roleIds: []
            }
        });

        // Increment member count
        await db.server.update({
            where: { id: serverId },
            data: { membersCount: { increment: 1 } }
        });

        res.status(200).json({
            success: true,
            message: 'Joined server successfully'
        });
    } catch (error) {
        console.error('Join server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while joining server'
        });
    }
};

// Leave server
exports.leaveServer = async (req, res) => {
    try {
        const { serverId } = req.params;

        const server = await db.server.findUnique({
            where: { id: serverId }
        });

        if (!server) {
            return res.status(404).json({
                success: false,
                message: 'Server not found'
            });
        }

        // Owner cannot leave their own server
        if (server.ownerId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Server owner cannot leave. Transfer ownership or delete the server instead.'
            });
        }

        const member = await db.serverMember.findFirst({
            where: {
                serverId,
                userId: req.user.id
            }
        });

        if (!member) {
            return res.status(400).json({
                success: false,
                message: 'You are not a member of this server'
            });
        }

        // Remove membership
        await db.serverMember.delete({
            where: { id: member.id }
        });

        // Decrement member count
        await db.server.update({
            where: { id: serverId },
            data: { membersCount: { decrement: 1 } }
        });

        res.status(200).json({
            success: true,
            message: 'Left server successfully'
        });
    } catch (error) {
        console.error('Leave server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while leaving server'
        });
    }
};

// Get server members
exports.getMembers = async (req, res) => {
    try {
        const { serverId } = req.params;

        // Check if user is a member
        const userMember = await db.serverMember.findFirst({
            where: {
                serverId,
                userId: req.user.id
            }
        });

        if (!userMember) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this server'
            });
        }

        const members = await db.serverMember.findMany({
            where: { serverId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        discriminator: true,
                        avatar: true,
                        banner: true,
                        bio: true,
                        status: true,
                        customStatus: true
                    }
                }
            },
            orderBy: { joinedAt: 'asc' }
        });

        const server = await db.server.findUnique({
            where: { id: serverId },
            select: { ownerId: true }
        });

        const formattedMembers = members.map(m => {
            const { id: userId, ...userData } = m.user;
            const { id: memberId, user, userId: userIdField, ...memberData } = m;
            return {
                _id: memberId,
                serverId: memberData.serverId,
                userId: {
                    _id: userId,
                    ...userData
                },
                roleIds: memberData.roleIds,
                isMuted: memberData.isMuted,
                isBanned: memberData.isBanned,
                banReason: memberData.banReason,
                timeoutUntil: memberData.timeoutUntil,
                timeoutReason: memberData.timeoutReason,
                joinedAt: memberData.joinedAt,
                isOwner: userId === server.ownerId // Add isOwner flag
            };
        });

        res.status(200).json({
            success: true,
            ownerId: server.ownerId,
            members: formattedMembers
        });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching members'
        });
    }
};

// Get banned words for a server
exports.getBannedWords = async (req, res) => {
    try {
        const { serverId } = req.params;

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

        const server = await db.server.findUnique({
            where: { id: serverId },
            select: { bannedWords: true }
        });

        if (!server) {
            return res.status(404).json({
                success: false,
                message: 'Server not found'
            });
        }

        res.status(200).json({
            success: true,
            bannedWords: server.bannedWords
        });
    } catch (error) {
        console.error('Get banned words error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching banned words'
        });
    }
};

// Update banned words for a server
exports.updateBannedWords = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { bannedWords } = req.body;

        if (!Array.isArray(bannedWords)) {
            return res.status(400).json({
                success: false,
                message: 'Banned words must be an array'
            });
        }

        // Check if user is owner
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
                message: 'Only the server owner can manage banned words'
            });
        }

        const updatedServer = await db.server.update({
            where: { id: serverId },
            data: { bannedWords }
        });

        res.status(200).json({
            success: true,
            message: 'Banned words updated successfully',
            bannedWords: updatedServer.bannedWords
        });
    } catch (error) {
        console.error('Update banned words error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating banned words'
        });
    }
};

// Timeout a server member
exports.timeoutMember = async (req, res) => {
    try {
        const { serverId, userId } = req.params;
        const { duration, reason } = req.body; // duration in minutes

        // Check if user has permission (Owner or higher)
        const server = await db.server.findUnique({
            where: { id: serverId },
            select: { ownerId: true }
        });

        if (!server) {
            return res.status(404).json({
                success: false,
                message: 'Server not found'
            });
        }

        if (server.ownerId !== req.user.id) {
            // Check if user has a role with MODERATE_MEMBERS permission (value: 1 << 30 or similar)
            // For now, simplify to just owner as requested or a specific check
            return res.status(403).json({
                success: false,
                message: 'Only the server owner or moderators can timeout members'
            });
        }

        // Calculate timeoutUntil
        let timeoutUntil = null;
        if (duration > 0) {
            timeoutUntil = new Date(Date.now() + duration * 60 * 1000);
        }

        const updatedMember = await db.serverMember.update({
            where: {
                serverId_userId: {
                    serverId,
                    userId
                }
            },
            data: {
                timeoutUntil,
                timeoutReason: reason || null
            }
        });

        // Emit socket event to notify the user and server
        if (global.io) {
            global.io.to(serverId).emit('member_updated', {
                serverId,
                userId,
                timeoutUntil,
                timeoutReason: reason
            });
        }

        res.status(200).json({
            success: true,
            message: duration > 0 ? 'Member timed out successfully' : 'Timeout removed successfully',
            data: updatedMember
        });
    } catch (error) {
        console.error('Timeout member error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while applying timeout'
        });
    }
};

// Ban a server member
exports.banMember = async (req, res) => {
    try {
        const { serverId, userId } = req.params;
        const { reason } = req.body;

        // Check if user has permission (Owner or users with ban permissions)
        const server = await db.server.findUnique({
            where: { id: serverId },
            select: { ownerId: true }
        });

        if (!server) {
            return res.status(404).json({
                success: false,
                message: 'Server not found'
            });
        }

        // Check if requester is the owner
        const isOwner = server.ownerId === req.user.id;

        if (!isOwner) {
            // Check if user has a role with BAN_MEMBERS permission
            const requesterMember = await db.serverMember.findFirst({
                where: {
                    serverId,
                    userId: req.user.id
                },
                include: {
                    server: {
                        include: {
                            roles: true
                        }
                    }
                }
            });

            if (!requesterMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this server'
                });
            }

            // Check if any of the user's roles have ban permissions (bit flag check)
            const BAN_MEMBERS_PERMISSION = 1 << 2; // Assuming bit 2 for ban permission
            const hasPermission = requesterMember.roleIds.some(roleId => {
                const role = requesterMember.server.roles.find(r => r.id === roleId);
                return role && (role.permissions & BAN_MEMBERS_PERMISSION) !== 0;
            });

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to ban members'
                });
            }
        }

        // Prevent banning the server owner
        if (userId === server.ownerId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot ban the server owner'
            });
        }

        // Check if member exists
        const targetMember = await db.serverMember.findFirst({
            where: {
                serverId,
                userId
            }
        });

        if (!targetMember) {
            return res.status(404).json({
                success: false,
                message: 'Member not found in this server'
            });
        }

        // Ban the member
        const updatedMember = await db.serverMember.update({
            where: {
                serverId_userId: {
                    serverId,
                    userId
                }
            },
            data: {
                isBanned: true,
                banReason: reason || null
            }
        });

        // Emit socket event to notify the server
        if (global.io) {
            global.io.to(serverId).emit('member_banned', {
                serverId,
                userId,
                reason: reason || 'No reason provided'
            });

            // Notify the banned user
            global.io.to(userId).emit('banned_from_server', {
                serverId,
                reason: reason || 'No reason provided'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Member banned successfully',
            data: updatedMember
        });
    } catch (error) {
        console.error('Ban member error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while banning member'
        });
    }
};

// Unban a server member
exports.unbanMember = async (req, res) => {
    try {
        const { serverId, userId } = req.params;

        // Check if user has permission (Owner or users with ban permissions)
        const server = await db.server.findUnique({
            where: { id: serverId },
            select: { ownerId: true }
        });

        if (!server) {
            return res.status(404).json({
                success: false,
                message: 'Server not found'
            });
        }

        // Check if requester is the owner
        const isOwner = server.ownerId === req.user.id;

        if (!isOwner) {
            // Check if user has a role with BAN_MEMBERS permission
            const requesterMember = await db.serverMember.findFirst({
                where: {
                    serverId,
                    userId: req.user.id
                },
                include: {
                    server: {
                        include: {
                            roles: true
                        }
                    }
                }
            });

            if (!requesterMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this server'
                });
            }

            // Check if any of the user's roles have ban permissions
            const BAN_MEMBERS_PERMISSION = 1 << 2;
            const hasPermission = requesterMember.roleIds.some(roleId => {
                const role = requesterMember.server.roles.find(r => r.id === roleId);
                return role && (role.permissions & BAN_MEMBERS_PERMISSION) !== 0;
            });

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to unban members'
                });
            }
        }

        // Check if member exists
        const targetMember = await db.serverMember.findFirst({
            where: {
                serverId,
                userId
            }
        });

        if (!targetMember) {
            return res.status(404).json({
                success: false,
                message: 'Member not found in this server'
            });
        }

        // Unban the member
        const updatedMember = await db.serverMember.update({
            where: {
                serverId_userId: {
                    serverId,
                    userId
                }
            },
            data: {
                isBanned: false,
                banReason: null
            }
        });

        // Emit socket event to notify the server
        if (global.io) {
            global.io.to(serverId).emit('member_unbanned', {
                serverId,
                userId
            });

            // Notify the unbanned user
            global.io.to(userId).emit('unbanned_from_server', {
                serverId
            });
        }

        res.status(200).json({
            success: true,
            message: 'Member unbanned successfully',
            data: updatedMember
        });
    } catch (error) {
        console.error('Unban member error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while unbanning member'
        });
    }
};
