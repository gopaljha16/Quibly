const db = require('../config/db');
const { createAuditLog } = require('./auditLogController');

// Get member screening config
exports.getMemberScreening = async (req, res) => {
    try {
        const { serverId } = req.params;

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
                message: 'Only the server owner can view member screening'
            });
        }

        const screening = await db.memberScreening.findUnique({
            where: { serverId }
        });

        res.status(200).json({
            success: true,
            screening: screening || { enabled: false, questions: [], requiresApproval: false }
        });
    } catch (error) {
        console.error('Get member screening error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching member screening'
        });
    }
};

// Update member screening config
exports.updateMemberScreening = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { enabled, questions, requiresApproval } = req.body;

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
                message: 'Only the server owner can update member screening'
            });
        }

        const screening = await db.memberScreening.upsert({
            where: { serverId },
            update: {
                enabled,
                questions: questions || [],
                requiresApproval
            },
            create: {
                serverId,
                enabled,
                questions: questions || [],
                requiresApproval
            }
        });

        // Update server flag
        await db.server.update({
            where: { id: serverId },
            data: { memberScreeningEnabled: enabled }
        });

        // Create audit log
        await createAuditLog({
            serverId,
            userId: req.user.id,
            action: 'MEMBER_SCREENING_UPDATE',
            changes: { enabled, requiresApproval }
        });

        res.status(200).json({
            success: true,
            screening
        });
    } catch (error) {
        console.error('Update member screening error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating member screening'
        });
    }
};

// Submit screening response
exports.submitScreeningResponse = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { responses } = req.body;

        const screening = await db.memberScreening.findUnique({
            where: { serverId }
        });

        if (!screening || !screening.enabled) {
            return res.status(400).json({
                success: false,
                message: 'Member screening is not enabled for this server'
            });
        }

        const response = await db.memberScreeningResponse.upsert({
            where: {
                serverId_userId: {
                    serverId,
                    userId: req.user.id
                }
            },
            update: {
                responses,
                status: screening.requiresApproval ? 'pending' : 'approved'
            },
            create: {
                serverId,
                userId: req.user.id,
                responses,
                status: screening.requiresApproval ? 'pending' : 'approved'
            }
        });

        // If auto-approved, update member status
        if (!screening.requiresApproval) {
            await db.serverMember.updateMany({
                where: {
                    serverId,
                    userId: req.user.id
                },
                data: {
                    screeningPassed: true,
                    verificationStatus: 'verified',
                    verifiedAt: new Date()
                }
            });
        }

        res.status(200).json({
            success: true,
            response
        });
    } catch (error) {
        console.error('Submit screening response error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while submitting screening response'
        });
    }
};

// Get pending screening responses
exports.getPendingScreeningResponses = async (req, res) => {
    try {
        const { serverId } = req.params;

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
                message: 'Only the server owner can view pending responses'
            });
        }

        const responses = await db.memberScreeningResponse.findMany({
            where: {
                serverId,
                status: 'pending'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        discriminator: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            responses
        });
    } catch (error) {
        console.error('Get pending screening responses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching pending responses'
        });
    }
};

// Review screening response
exports.reviewScreeningResponse = async (req, res) => {
    try {
        const { serverId, responseId } = req.params;
        const { approved } = req.body;

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
                message: 'Only the server owner can review responses'
            });
        }

        const response = await db.memberScreeningResponse.update({
            where: { id: responseId },
            data: {
                status: approved ? 'approved' : 'rejected',
                reviewedBy: req.user.id,
                reviewedAt: new Date()
            }
        });

        // Update member status if approved
        if (approved) {
            await db.serverMember.updateMany({
                where: {
                    serverId,
                    userId: response.userId
                },
                data: {
                    screeningPassed: true,
                    verificationStatus: 'verified',
                    verifiedAt: new Date()
                }
            });
        } else {
            // Optionally kick the member if rejected
            await db.serverMember.deleteMany({
                where: {
                    serverId,
                    userId: response.userId
                }
            });
        }

        // Create audit log
        await createAuditLog({
            serverId,
            userId: req.user.id,
            action: approved ? 'SCREENING_APPROVED' : 'SCREENING_REJECTED',
            targetType: 'User',
            targetId: response.userId
        });

        res.status(200).json({
            success: true,
            response
        });
    } catch (error) {
        console.error('Review screening response error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while reviewing response'
        });
    }
};
