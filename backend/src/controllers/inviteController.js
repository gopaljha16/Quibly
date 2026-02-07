const db = require('../config/db');
const { createSystemMessage } = require('../utils/systemMessage');

// Generate a random code (7 characters)
const generateInviteCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 7; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Create a new invite
exports.createInvite = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { maxUses, expiresInDays } = req.body;
        const userId = req.user.id;

        // Check if server exists and user is a member
        const server = await db.server.findUnique({
            where: { id: serverId },
            include: {
                members: {
                    where: { userId }
                }
            }
        });

        if (!server) {
            return res.status(404).json({
                success: false,
                message: 'Server not found'
            });
        }

        if (server.members.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You must be a member of the server to create an invite'
            });
        }

        // Check if a valid invite already exists for this server created by this user
        // with the same or better constraints
        const existingInvite = await db.invite.findFirst({
            where: {
                serverId,
                inviterId: userId,
                expiresAt: expiresInDays ? { gte: new Date() } : null,
                maxUses: maxUses ? parseInt(maxUses) : null,
            },
            orderBy: { createdAt: 'desc' }
        });

        if (existingInvite && (!existingInvite.expiresAt || existingInvite.expiresAt > new Date())) {
            return res.status(200).json({
                success: true,
                invite: {
                    code: existingInvite.code,
                    expiresAt: existingInvite.expiresAt,
                    maxUses: existingInvite.maxUses
                }
            });
        }

        // Generate unique code
        let code;
        let isUnique = false;
        while (!isUnique) {
            code = generateInviteCode();
            const existing = await db.invite.findUnique({ where: { code } });
            if (!existing) isUnique = true;
        }

        // Calculate expiry
        let expiresAt = null;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
        }

        const invite = await db.invite.create({
            data: {
                code,
                serverId,
                inviterId: userId,
                maxUses: maxUses ? parseInt(maxUses) : null,
                expiresAt
            }
        });

        res.status(201).json({
            success: true,
            invite: {
                code: invite.code,
                expiresAt: invite.expiresAt,
                maxUses: invite.maxUses
            }
        });
    } catch (error) {
        console.error('Create invite error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating invite'
        });
    }
};

// Resolve invite info (for the join screen/preview)
exports.resolveInvite = async (req, res) => {
    try {
        const { code } = req.params;

        // First, try to find a regular invite code
        let invite = await db.invite.findUnique({
            where: { code },
            include: {
                server: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                        membersCount: true,
                        description: true
                    }
                },
                inviter: {
                    select: {
                        username: true,
                        avatar: true
                    }
                }
            }
        });

        // If no regular invite found, check if it's a vanity URL
        if (!invite) {
            const server = await db.server.findUnique({
                where: { vanityUrl: code },
                select: {
                    id: true,
                    name: true,
                    icon: true,
                    membersCount: true,
                    description: true,
                    owner: {
                        select: {
                            username: true,
                            avatar: true
                        }
                    }
                }
            });

            if (server) {
                // Return server info with owner as inviter for vanity URLs
                return res.status(200).json({
                    success: true,
                    invite: {
                        code: code,
                        isVanityUrl: true,
                        serverId: server.id,
                        server: {
                            id: server.id,
                            name: server.name,
                            icon: server.icon,
                            membersCount: server.membersCount,
                            description: server.description
                        },
                        inviter: server.owner
                    }
                });
            }

            // Neither invite code nor vanity URL found
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired invite code'
            });
        }

        // Check expiry for regular invites
        if (invite.expiresAt && invite.expiresAt < new Date()) {
            return res.status(410).json({
                success: false,
                message: 'This invite has expired'
            });
        }

        // Check uses for regular invites
        if (invite.maxUses && invite.uses >= invite.maxUses) {
            return res.status(410).json({
                success: false,
                message: 'This invite has reached its maximum usage limit'
            });
        }

        res.status(200).json({
            success: true,
            invite: {
                code: invite.code,
                isVanityUrl: false,
                serverId: invite.serverId,
                server: invite.server,
                inviter: invite.inviter
            }
        });
    } catch (error) {
        console.error('Resolve invite error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while resolving invite'
        });
    }
};

// Join server by invite code
exports.joinByInvite = async (req, res) => {
    try {
        const { code } = req.params;
        const userId = req.user.id;

        // First, try to find a regular invite code
        let invite = await db.invite.findUnique({
            where: { code },
            include: { server: true }
        });

        let serverId;
        let isVanityUrl = false;

        if (!invite) {
            // Check if it's a vanity URL
            const server = await db.server.findUnique({
                where: { vanityUrl: code },
                select: { id: true }
            });

            if (!server) {
                return res.status(404).json({
                    success: false,
                    message: 'Invalid invite code'
                });
            }

            serverId = server.id;
            isVanityUrl = true;
        } else {
            // Validation for regular invites
            if (invite.expiresAt && invite.expiresAt < new Date()) {
                return res.status(410).json({ success: false, message: 'Invite expired' });
            }
            if (invite.maxUses && invite.uses >= invite.maxUses) {
                return res.status(410).json({ success: false, message: 'Invite limit reached' });
            }

            serverId = invite.serverId;
        }

        // Check if already a member
        const existingMember = await db.serverMember.findFirst({
            where: {
                serverId,
                userId
            }
        });

        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of this server'
            });
        }

        // 1. Create membership
        await db.serverMember.create({
            data: {
                serverId,
                userId,
                roleIds: []
            }
        });

        // 2. Increment server member count
        await db.server.update({
            where: { id: serverId },
            data: { membersCount: { increment: 1 } }
        });

        // 3. Increment invite uses (only for regular invites)
        if (!isVanityUrl && invite) {
            await db.invite.update({
                where: { id: invite.id },
                data: { uses: { increment: 1 } }
            });
        }

        // 4. Send welcome message to general channel
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
            message: 'Joined server successfully',
            serverId: serverId
        });
    } catch (error) {
        console.error('Join by invite error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while joining via invite'
        });
    }
};
