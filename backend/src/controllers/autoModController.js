const db = require('../config/db');
const { createAuditLog } = require('./auditLogController');

// Get auto-mod rules for a server
exports.getAutoModRules = async (req, res) => {
    try {
        const { serverId } = req.params;

        // Check if user is owner or has permissions
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
                message: 'Only the server owner can view auto-mod rules'
            });
        }

        const rules = await db.autoModRule.findMany({
            where: { serverId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            rules
        });
    } catch (error) {
        console.error('Get auto-mod rules error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching auto-mod rules'
        });
    }
};

// Create auto-mod rule
exports.createAutoModRule = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { name, triggerType, triggerMetadata, actions, exemptRoles, exemptChannels } = req.body;

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
                message: 'Only the server owner can create auto-mod rules'
            });
        }

        const rule = await db.autoModRule.create({
            data: {
                serverId,
                name,
                triggerType,
                triggerMetadata: triggerMetadata || {},
                actions: actions || [],
                exemptRoles: exemptRoles || [],
                exemptChannels: exemptChannels || []
            }
        });

        // Enable auto-mod on server if not already enabled
        await db.server.update({
            where: { id: serverId },
            data: { autoModEnabled: true }
        });

        // Create audit log
        await createAuditLog({
            serverId,
            userId: req.user.id,
            action: 'AUTO_MOD_RULE_CREATE',
            targetType: 'AutoModRule',
            targetId: rule.id,
            changes: { name, triggerType }
        });

        res.status(201).json({
            success: true,
            rule
        });
    } catch (error) {
        console.error('Create auto-mod rule error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating auto-mod rule'
        });
    }
};

// Update auto-mod rule
exports.updateAutoModRule = async (req, res) => {
    try {
        const { serverId, ruleId } = req.params;
        const updates = req.body;

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
                message: 'Only the server owner can update auto-mod rules'
            });
        }

        const rule = await db.autoModRule.update({
            where: { id: ruleId },
            data: updates
        });

        // Create audit log
        await createAuditLog({
            serverId,
            userId: req.user.id,
            action: 'AUTO_MOD_RULE_UPDATE',
            targetType: 'AutoModRule',
            targetId: ruleId,
            changes: updates
        });

        res.status(200).json({
            success: true,
            rule
        });
    } catch (error) {
        console.error('Update auto-mod rule error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating auto-mod rule'
        });
    }
};

// Delete auto-mod rule
exports.deleteAutoModRule = async (req, res) => {
    try {
        const { serverId, ruleId } = req.params;

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
                message: 'Only the server owner can delete auto-mod rules'
            });
        }

        await db.autoModRule.delete({
            where: { id: ruleId }
        });

        // Create audit log
        await createAuditLog({
            serverId,
            userId: req.user.id,
            action: 'AUTO_MOD_RULE_DELETE',
            targetType: 'AutoModRule',
            targetId: ruleId
        });

        res.status(200).json({
            success: true,
            message: 'Auto-mod rule deleted successfully'
        });
    } catch (error) {
        console.error('Delete auto-mod rule error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting auto-mod rule'
        });
    }
};

// Check message against auto-mod rules
exports.checkMessageAutoMod = async (serverId, channelId, userId, content, memberRoleIds) => {
    try {
        const rules = await db.autoModRule.findMany({
            where: {
                serverId,
                enabled: true
            }
        });

        for (const rule of rules) {
            // Check if user/channel is exempt
            if (rule.exemptRoles.some(roleId => memberRoleIds.includes(roleId))) {
                continue;
            }
            if (rule.exemptChannels.includes(channelId)) {
                continue;
            }

            let triggered = false;
            const metadata = rule.triggerMetadata || {};

            switch (rule.triggerType) {
                case 'SPAM':
                    // Check for repeated characters or messages
                    if (/(.)\1{5,}/.test(content)) {
                        triggered = true;
                    }
                    break;

                case 'BANNED_WORDS':
                    const bannedWords = metadata.words || [];
                    const lowerContent = content.toLowerCase();
                    if (bannedWords.some(word => lowerContent.includes(word.toLowerCase()))) {
                        triggered = true;
                    }
                    break;

                case 'CAPS':
                    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
                    if (capsRatio > (metadata.threshold || 0.7) && content.length > 10) {
                        triggered = true;
                    }
                    break;

                case 'LINKS':
                    if (/(https?:\/\/[^\s]+)/g.test(content)) {
                        triggered = true;
                    }
                    break;

                case 'MENTIONS':
                    const mentions = (content.match(/@/g) || []).length;
                    if (mentions > (metadata.maxMentions || 5)) {
                        triggered = true;
                    }
                    break;
            }

            if (triggered) {
                return {
                    triggered: true,
                    rule,
                    actions: rule.actions
                };
            }
        }

        return { triggered: false };
    } catch (error) {
        console.error('Check message auto-mod error:', error);
        return { triggered: false };
    }
};
