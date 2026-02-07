const db = require('../config/db');

// Create audit log entry
exports.createAuditLog = async ({ serverId, userId, action, targetType, targetId, changes, reason, metadata }) => {
    try {
        return await db.auditLog.create({
            data: {
                serverId,
                userId,
                action,
                targetType,
                targetId,
                changes: changes || {},
                reason,
                metadata: metadata || {}
            }
        });
    } catch (error) {
        console.error('Create audit log error:', error);
        return null;
    }
};

// Get audit logs for a server
exports.getAuditLogs = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { limit = 50, offset = 0, action, userId } = req.query;

        // Check if user is a member with permissions
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

        const where = { serverId };
        if (action) where.action = action;
        if (userId) where.userId = userId;

        const [logs, total] = await Promise.all([
            db.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset),
                include: {
                    server: {
                        select: { name: true }
                    }
                }
            }),
            db.auditLog.count({ where })
        ]);

        res.status(200).json({
            success: true,
            logs,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching audit logs'
        });
    }
};

// Get audit log statistics
exports.getAuditLogStats = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { days = 7 } = req.query;

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

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const logs = await db.auditLog.findMany({
            where: {
                serverId,
                createdAt: { gte: startDate }
            },
            select: {
                action: true,
                createdAt: true
            }
        });

        // Group by action
        const actionCounts = logs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            stats: {
                total: logs.length,
                byAction: actionCounts,
                period: `${days} days`
            }
        });
    } catch (error) {
        console.error('Get audit log stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching audit log statistics'
        });
    }
};
