const db = require('../config/db');
const { createAuditLog } = require('./auditLogController');

// Get welcome screen config
exports.getWelcomeScreen = async (req, res) => {
    try {
        const { serverId } = req.params;

        const welcomeScreen = await db.welcomeScreen.findUnique({
            where: { serverId }
        });

        res.status(200).json({
            success: true,
            welcomeScreen: welcomeScreen || {
                enabled: false,
                title: null,
                description: null,
                welcomeChannels: []
            }
        });
    } catch (error) {
        console.error('Get welcome screen error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching welcome screen'
        });
    }
};

// Update welcome screen config
exports.updateWelcomeScreen = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { enabled, title, description, welcomeChannels } = req.body;

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
                message: 'Only the server owner can update welcome screen'
            });
        }

        const welcomeScreen = await db.welcomeScreen.upsert({
            where: { serverId },
            update: {
                enabled,
                title,
                description,
                welcomeChannels: welcomeChannels || []
            },
            create: {
                serverId,
                enabled,
                title,
                description,
                welcomeChannels: welcomeChannels || []
            }
        });

        // Update server flag
        await db.server.update({
            where: { id: serverId },
            data: { welcomeScreenEnabled: enabled }
        });

        // Create audit log
        await createAuditLog({
            serverId,
            userId: req.user.id,
            action: 'WELCOME_SCREEN_UPDATE',
            changes: { enabled, title }
        });

        res.status(200).json({
            success: true,
            welcomeScreen
        });
    } catch (error) {
        console.error('Update welcome screen error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating welcome screen'
        });
    }
};
