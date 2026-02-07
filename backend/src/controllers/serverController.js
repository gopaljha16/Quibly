const db = require('../config/db');
const { createSystemMessage } = require('../utils/systemMessage');
const { createAuditLog } = require('./auditLogController');

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

        // Create default 'general' channel
        const generalChannel = await db.channel.create({
            data: {
                name: 'general',
                serverId: server.id,
                type: 'TEXT',
                isPrivate: false,
                position: 0
            }
        });

        // Send a system message about the server being created (optional but good)
        await createSystemMessage({
            channelId: generalChannel.id,
            serverId: server.id,
            content: `Welcome to ${name}! This is the start of your server.`
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

// Upload server icon
exports.uploadServerIcon = async (req, res) => {
    try {
        const { serverId } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Check if user is owner or has manage server permission
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
                message: 'Only the server owner can update server icon'
            });
        }

        // Update server with new icon URL
        const updatedServer = await db.server.update({
            where: { id: serverId },
            data: { icon: req.file.path }
        });

        // Emit socket event to notify all server members
        if (global.io) {
            global.io.to(serverId).emit('server_updated', {
                serverId,
                icon: req.file.path
            });
        }

        res.status(200).json({
            success: true,
            message: 'Server icon uploaded successfully',
            icon: req.file.path,
            server: updatedServer
        });
    } catch (error) {
        console.error('Upload server icon error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while uploading icon'
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

        // Send welcome message to the 'general' channel
        const general = await db.channel.findFirst({
            where: { serverId, name: 'general' }
        });

        if (general) {
            await createSystemMessage({
                channelId: general.id,
                serverId: serverId,
                content: `Welcome **${req.user.username}**. Say hi!`,
                metadata: {
                    type: 'WELCOME',
                    userId: req.user.id,
                    username: req.user.username
                }
            });
        }

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

        // Create audit log
        await createAuditLog({
            serverId,
            userId: req.user.id,
            action: 'MEMBER_BAN',
            targetType: 'User',
            targetId: userId,
            reason
        });

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

// Discover public servers (optionally filtered by interests)
exports.discoverServers = async (req, res) => {
    try {
        const { interests, search, limit = 20, offset = 0 } = req.query;
        
        // Parse interests if provided (comma-separated interest IDs)
        const interestIds = interests ? interests.split(',').filter(Boolean) : [];
        
        // Build where clause
        const whereClause = {
            isPublic: true
        };

        // Add search filter if provided
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        // If interests are provided, filter servers that have those interests
        if (interestIds.length > 0) {
            whereClause.serverInterests = {
                some: {
                    interestId: { in: interestIds }
                }
            };
        }

        // Get servers with their interests
        const servers = await db.server.findMany({
            where: whereClause,
            include: {
                owner: {
                    select: {
                        id: true,
                        username: true,
                        discriminator: true,
                        avatar: true
                    }
                },
                serverInterests: {
                    include: {
                        interest: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: [
                { membersCount: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        // Check if user is already a member of these servers
        const userMemberships = await db.serverMember.findMany({
            where: {
                userId: req.user.id,
                serverId: { in: servers.map(s => s.id) }
            },
            select: { serverId: true }
        });

        const memberServerIds = new Set(userMemberships.map(m => m.serverId));

        // Format response
        const formattedServers = servers.map(server => {
            const { id, serverInterests, ...rest } = server;
            return {
                _id: id,
                ...rest,
                interests: serverInterests.map(si => si.interest),
                isMember: memberServerIds.has(id),
                matchCount: interestIds.length > 0 
                    ? serverInterests.filter(si => interestIds.includes(si.interestId)).length 
                    : 0
            };
        });

        // Sort by match count if interests were provided
        if (interestIds.length > 0) {
            formattedServers.sort((a, b) => b.matchCount - a.matchCount);
        }

        res.status(200).json({
            success: true,
            servers: formattedServers,
            total: formattedServers.length,
            hasMore: formattedServers.length === parseInt(limit)
        });
    } catch (error) {
        console.error('Discover servers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while discovering servers'
        });
    }
};

// Get server interests
exports.getServerInterests = async (req, res) => {
    try {
        const { serverId } = req.params;

        const serverInterests = await db.serverInterest.findMany({
            where: { serverId },
            include: {
                interest: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            interests: serverInterests.map(si => si.interest)
        });
    } catch (error) {
        console.error('Get server interests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching server interests'
        });
    }
};

// Add interests to server (owner only)
exports.addServerInterests = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { interestIds } = req.body;

        if (!Array.isArray(interestIds) || interestIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Interest IDs must be a non-empty array'
            });
        }

        // Check if user is owner
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
            return res.status(403).json({
                success: false,
                message: 'Only the server owner can manage server interests'
            });
        }

        // Check current interest count
        const currentCount = await db.serverInterest.count({
            where: { serverId }
        });

        if (currentCount + interestIds.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Servers can have a maximum of 10 interests'
            });
        }

        // Verify all interests exist
        const interests = await db.interest.findMany({
            where: { id: { in: interestIds } }
        });

        if (interests.length !== interestIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more interest IDs are invalid'
            });
        }

        // Add interests (skip duplicates)
        const createData = interestIds.map(interestId => ({
            serverId,
            interestId
        }));

        await db.serverInterest.createMany({
            data: createData,
            skipDuplicates: true
        });

        // Fetch updated interests
        const updatedInterests = await db.serverInterest.findMany({
            where: { serverId },
            include: {
                interest: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: 'Interests added successfully',
            interests: updatedInterests.map(si => si.interest)
        });
    } catch (error) {
        console.error('Add server interests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding interests'
        });
    }
};

// Remove interest from server (owner only)
exports.removeServerInterest = async (req, res) => {
    try {
        const { serverId, interestId } = req.params;

        // Check if user is owner
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
            return res.status(403).json({
                success: false,
                message: 'Only the server owner can manage server interests'
            });
        }

        // Remove the interest
        await db.serverInterest.deleteMany({
            where: {
                serverId,
                interestId
            }
        });

        res.status(200).json({
            success: true,
            message: 'Interest removed successfully'
        });
    } catch (error) {
        console.error('Remove server interest error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while removing interest'
        });
    }
};

// Check vanity URL availability
exports.checkVanityUrl = async (req, res) => {
    try {
        const { vanityUrl } = req.params;

        // Validate vanity URL format (alphanumeric, hyphens, underscores, 3-32 chars)
        const vanityRegex = /^[a-zA-Z0-9_-]{3,32}$/;
        if (!vanityRegex.test(vanityUrl)) {
            return res.status(400).json({
                success: false,
                message: 'Vanity URL must be 3-32 characters and contain only letters, numbers, hyphens, and underscores'
            });
        }

        // Reserved vanity URLs
        const reserved = ['api', 'invite', 'channels', 'login', 'signup', 'admin', 'discover', 'me'];
        if (reserved.includes(vanityUrl.toLowerCase())) {
            return res.status(400).json({
                success: false,
                available: false,
                message: 'This vanity URL is reserved'
            });
        }

        const existing = await db.server.findUnique({
            where: { vanityUrl }
        });

        res.status(200).json({
            success: true,
            available: !existing
        });
    } catch (error) {
        console.error('Check vanity URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while checking vanity URL'
        });
    }
};

// Set vanity URL for server
exports.setVanityUrl = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { vanityUrl } = req.body;

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
                message: 'Only the server owner can set vanity URL'
            });
        }

        // Validate vanity URL
        const vanityRegex = /^[a-zA-Z0-9_-]{3,32}$/;
        if (!vanityRegex.test(vanityUrl)) {
            return res.status(400).json({
                success: false,
                message: 'Vanity URL must be 3-32 characters and contain only letters, numbers, hyphens, and underscores'
            });
        }

        // Check if already taken
        const existing = await db.server.findUnique({
            where: { vanityUrl }
        });

        if (existing && existing.id !== serverId) {
            return res.status(400).json({
                success: false,
                message: 'This vanity URL is already taken'
            });
        }

        // Update server
        const updatedServer = await db.server.update({
            where: { id: serverId },
            data: { vanityUrl }
        });

        // Create audit log
        await createAuditLog({
            serverId,
            userId: req.user.id,
            action: 'VANITY_URL_UPDATE',
            changes: {
                old: server.vanityUrl,
                new: vanityUrl
            }
        });

        res.status(200).json({
            success: true,
            message: 'Vanity URL set successfully',
            vanityUrl: updatedServer.vanityUrl
        });
    } catch (error) {
        console.error('Set vanity URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while setting vanity URL'
        });
    }
};

// Get server by vanity URL
exports.getServerByVanityUrl = async (req, res) => {
    try {
        const { vanityUrl } = req.params;

        const server = await db.server.findUnique({
            where: { vanityUrl },
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

        // Check if user is a member
        const member = await db.serverMember.findFirst({
            where: {
                serverId: server.id,
                userId: req.user.id
            }
        });

        res.status(200).json({
            success: true,
            server: {
                ...server,
                isMember: !!member,
                isOwner: server.ownerId === req.user.id
            }
        });
    } catch (error) {
        console.error('Get server by vanity URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching server'
        });
    }
};

// Get server rules
exports.getServerRules = async (req, res) => {
    try {
        const { serverId } = req.params;

        const server = await db.server.findUnique({
            where: { id: serverId },
            select: { rules: true }
        });

        if (!server) {
            return res.status(404).json({
                success: false,
                message: 'Server not found'
            });
        }

        res.status(200).json({
            success: true,
            rules: server.rules
        });
    } catch (error) {
        console.error('Get server rules error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching rules'
        });
    }
};

// Update server rules
exports.updateServerRules = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { rules } = req.body;

        if (!Array.isArray(rules)) {
            return res.status(400).json({
                success: false,
                message: 'Rules must be an array'
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
                message: 'Only the server owner can update rules'
            });
        }

        // Validate rules format
        for (const rule of rules) {
            if (!rule.title || !rule.description) {
                return res.status(400).json({
                    success: false,
                    message: 'Each rule must have a title and description'
                });
            }
        }

        const updatedServer = await db.server.update({
            where: { id: serverId },
            data: { rules }
        });

        // Create audit log
        await createAuditLog({
            serverId,
            userId: req.user.id,
            action: 'RULES_UPDATE',
            changes: {
                ruleCount: rules.length
            }
        });

        res.status(200).json({
            success: true,
            message: 'Rules updated successfully',
            rules: updatedServer.rules
        });
    } catch (error) {
        console.error('Update server rules error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating rules'
        });
    }
};

// Update server badges (admin only)
exports.updateServerBadges = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { badges, isVerified, isPartnered } = req.body;

        // This should be protected by admin middleware in production
        // For now, only allow owner
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
                message: 'Only the server owner can update badges'
            });
        }

        const updateData = {};
        if (badges !== undefined) updateData.badges = badges;
        if (isVerified !== undefined) updateData.isVerified = isVerified;
        if (isPartnered !== undefined) updateData.isPartnered = isPartnered;

        const updatedServer = await db.server.update({
            where: { id: serverId },
            data: updateData
        });

        res.status(200).json({
            success: true,
            message: 'Server badges updated successfully',
            server: updatedServer
        });
    } catch (error) {
        console.error('Update server badges error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating badges'
        });
    }
};
