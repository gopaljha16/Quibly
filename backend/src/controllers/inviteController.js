const db = require('../config/db');

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

        const invite = await db.invite.findUnique({
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

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired invite code'
            });
        }

        // Check expiry
        if (invite.expiresAt && invite.expiresAt < new Date()) {
            return res.status(410).json({
                success: false,
                message: 'This invite has expired'
            });
        }

        // Check uses
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

        const invite = await db.invite.findUnique({
            where: { code },
            include: { server: true }
        });

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invalid invite code'
            });
        }

        // Validation
        if (invite.expiresAt && invite.expiresAt < new Date()) {
            return res.status(410).json({ success: false, message: 'Invite expired' });
        }
        if (invite.maxUses && invite.uses >= invite.maxUses) {
            return res.status(410).json({ success: false, message: 'Invite limit reached' });
        }

        // Check if already a member
        const existingMember = await db.serverMember.findFirst({
            where: {
                serverId: invite.serverId,
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
                serverId: invite.serverId,
                userId,
                roleIds: []
            }
        });

        // 2. Increment server member count
        await db.server.update({
            where: { id: invite.serverId },
            data: { membersCount: { increment: 1 } }
        });

        // 3. Increment invite uses
        await db.invite.update({
            where: { id: invite.id },
            data: { uses: { increment: 1 } }
        });

        res.status(200).json({
            success: true,
            message: 'Joined server successfully',
            serverId: invite.serverId
        });
    } catch (error) {
        console.error('Join by invite error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while joining via invite'
        });
    }
};
