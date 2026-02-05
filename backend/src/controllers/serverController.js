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
        const { name, icon, banner, description, isPublic, verificationLevel } = req.body;

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
