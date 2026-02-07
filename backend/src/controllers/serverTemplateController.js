const db = require('../config/db');

// Get all server templates
exports.getTemplates = async (req, res) => {
    try {
        const { category } = req.query;

        const whereClause = {};
        if (category) {
            whereClause.category = category;
        }

        const templates = await db.serverTemplate.findMany({
            where: whereClause,
            orderBy: [
                { isOfficial: 'desc' },
                { usageCount: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        res.status(200).json({
            success: true,
            templates
        });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching templates'
        });
    }
};

// Get template by ID
exports.getTemplateById = async (req, res) => {
    try {
        const { templateId } = req.params;

        const template = await db.serverTemplate.findUnique({
            where: { id: templateId }
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        res.status(200).json({
            success: true,
            template
        });
    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching template'
        });
    }
};

// Create server from template
exports.createServerFromTemplate = async (req, res) => {
    try {
        const { templateId, name, icon } = req.body;

        if (!name || name.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Server name is required and must be 100 characters or less'
            });
        }

        // Get template
        const template = await db.serverTemplate.findUnique({
            where: { id: templateId }
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        // Create server with template settings
        const server = await db.server.create({
            data: {
                name,
                ownerId: req.user.id,
                icon: icon || template.icon || null,
                description: template.settings.description || null,
                isPublic: template.settings.isPublic || false,
                verificationLevel: template.settings.verificationLevel || 'none',
                membersCount: 1
            }
        });

        // Create roles from template
        const roleMap = {};
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
        roleMap['@everyone'] = defaultRole.id;

        for (const roleTemplate of template.roles) {
            const role = await db.role.create({
                data: {
                    name: roleTemplate.name,
                    serverId: server.id,
                    isDefault: false,
                    permissions: roleTemplate.permissions || 0,
                    position: roleTemplate.position || 0,
                    hoist: roleTemplate.hoist || false,
                    color: roleTemplate.color || null
                }
            });
            roleMap[roleTemplate.name] = role.id;
        }

        // Add creator as server member with owner role
        const ownerRole = Object.values(roleMap).find(id => id !== defaultRole.id);
        await db.serverMember.create({
            data: {
                serverId: server.id,
                userId: req.user.id,
                roleIds: ownerRole ? [defaultRole.id, ownerRole] : [defaultRole.id]
            }
        });

        // Create channels from template
        for (const channelTemplate of template.channels) {
            await db.channel.create({
                data: {
                    name: channelTemplate.name,
                    serverId: server.id,
                    type: channelTemplate.type || 'TEXT',
                    topic: channelTemplate.topic || null,
                    position: channelTemplate.position || 0,
                    isPrivate: channelTemplate.isPrivate || false
                }
            });
        }

        // Increment template usage count
        await db.serverTemplate.update({
            where: { id: templateId },
            data: { usageCount: { increment: 1 } }
        });

        res.status(201).json({
            success: true,
            message: 'Server created from template successfully',
            server: { _id: server.id, ...server }
        });
    } catch (error) {
        console.error('Create server from template error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating server from template'
        });
    }
};

// Seed default templates (admin only - call this once)
exports.seedTemplates = async (req, res) => {
    try {
        const templates = [
            {
                name: 'Gaming Community',
                description: 'Perfect for gaming communities with voice channels and game-specific text channels',
                category: 'Gaming',
                icon: '🎮',
                isOfficial: true,
                channels: [
                    { name: 'welcome', type: 'TEXT', position: 0, topic: 'Welcome to the server!' },
                    { name: 'rules', type: 'RULES', position: 1, topic: 'Server rules and guidelines' },
                    { name: 'announcements', type: 'ANNOUNCEMENT', position: 2, topic: 'Important announcements' },
                    { name: 'general', type: 'TEXT', position: 3 },
                    { name: 'gaming', type: 'TEXT', position: 4 },
                    { name: 'memes', type: 'TEXT', position: 5 },
                    { name: 'General Voice', type: 'VOICE', position: 6 },
                    { name: 'Gaming Voice', type: 'VOICE', position: 7 }
                ],
                roles: [
                    { name: 'Admin', permissions: 1073741823, position: 3, hoist: true, color: '#E74C3C' },
                    { name: 'Moderator', permissions: 268435463, position: 2, hoist: true, color: '#3498DB' },
                    { name: 'Member', permissions: 104324161, position: 1, hoist: false, color: '#95A5A6' }
                ],
                settings: {
                    verificationLevel: 'low',
                    isPublic: true
                }
            },
            {
                name: 'Study Group',
                description: 'Organized space for study groups with subject-specific channels',
                category: 'Education',
                icon: '📚',
                isOfficial: true,
                channels: [
                    { name: 'welcome', type: 'TEXT', position: 0 },
                    { name: 'rules', type: 'RULES', position: 1 },
                    { name: 'announcements', type: 'ANNOUNCEMENT', position: 2 },
                    { name: 'general', type: 'TEXT', position: 3 },
                    { name: 'homework-help', type: 'TEXT', position: 4 },
                    { name: 'resources', type: 'TEXT', position: 5 },
                    { name: 'Study Room 1', type: 'VOICE', position: 6 },
                    { name: 'Study Room 2', type: 'VOICE', position: 7 }
                ],
                roles: [
                    { name: 'Teacher', permissions: 805314622, position: 2, hoist: true, color: '#9B59B6' },
                    { name: 'Student', permissions: 104324161, position: 1, hoist: false, color: '#2ECC71' }
                ],
                settings: {
                    verificationLevel: 'medium',
                    isPublic: false
                }
            },
            {
                name: 'Creative Community',
                description: 'For artists, designers, and creators to share and collaborate',
                category: 'Creative',
                icon: '🎨',
                isOfficial: true,
                channels: [
                    { name: 'welcome', type: 'TEXT', position: 0 },
                    { name: 'rules', type: 'RULES', position: 1 },
                    { name: 'announcements', type: 'ANNOUNCEMENT', position: 2 },
                    { name: 'general', type: 'TEXT', position: 3 },
                    { name: 'showcase', type: 'TEXT', position: 4 },
                    { name: 'feedback', type: 'TEXT', position: 5 },
                    { name: 'resources', type: 'TEXT', position: 6 },
                    { name: 'Creative Lounge', type: 'VOICE', position: 7 }
                ],
                roles: [
                    { name: 'Admin', permissions: 1073741823, position: 3, hoist: true, color: '#E91E63' },
                    { name: 'Artist', permissions: 104324161, position: 1, hoist: false, color: '#FF9800' }
                ],
                settings: {
                    verificationLevel: 'low',
                    isPublic: true
                }
            },
            {
                name: 'Friends & Hangout',
                description: 'Simple server for hanging out with friends',
                category: 'Social',
                icon: '💬',
                isOfficial: true,
                channels: [
                    { name: 'general', type: 'TEXT', position: 0 },
                    { name: 'memes', type: 'TEXT', position: 1 },
                    { name: 'music', type: 'TEXT', position: 2 },
                    { name: 'Lounge', type: 'VOICE', position: 3 },
                    { name: 'Chill Zone', type: 'VOICE', position: 4 }
                ],
                roles: [
                    { name: 'Friend', permissions: 104324161, position: 1, hoist: false, color: '#00BCD4' }
                ],
                settings: {
                    verificationLevel: 'none',
                    isPublic: false
                }
            },
            {
                name: 'Business & Professional',
                description: 'Professional workspace for teams and businesses',
                category: 'Professional',
                icon: '💼',
                isOfficial: true,
                channels: [
                    { name: 'announcements', type: 'ANNOUNCEMENT', position: 0 },
                    { name: 'general', type: 'TEXT', position: 1 },
                    { name: 'projects', type: 'TEXT', position: 2 },
                    { name: 'resources', type: 'TEXT', position: 3 },
                    { name: 'Meeting Room', type: 'VOICE', position: 4 },
                    { name: 'Breakout Room', type: 'VOICE', position: 5 }
                ],
                roles: [
                    { name: 'Manager', permissions: 805314622, position: 3, hoist: true, color: '#607D8B' },
                    { name: 'Team Lead', permissions: 268435463, position: 2, hoist: true, color: '#009688' },
                    { name: 'Member', permissions: 104324161, position: 1, hoist: false, color: '#4CAF50' }
                ],
                settings: {
                    verificationLevel: 'high',
                    isPublic: false
                }
            }
        ];

        await db.serverTemplate.createMany({
            data: templates,
            skipDuplicates: true
        });

        res.status(200).json({
            success: true,
            message: 'Templates seeded successfully',
            count: templates.length
        });
    } catch (error) {
        console.error('Seed templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while seeding templates'
        });
    }
};

module.exports = exports;
