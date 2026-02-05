const db = require('../config/db');

// Get all roles for a server
exports.getRoles = async (req, res) => {
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

        const roles = await db.role.findMany({
            where: { serverId },
            orderBy: { position: 'desc' }
        });

        res.status(200).json({
            success: true,
            roles
        });
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching roles'
        });
    }
};

// Create a new role
exports.createRole = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { name, color, permissions, hoist } = req.body;

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
                message: 'Only the server owner can create roles'
            });
        }

        // Get highest position
        const roles = await db.role.findMany({
            where: { serverId },
            orderBy: { position: 'desc' },
            take: 1
        });

        const nextPosition = roles.length > 0 ? roles[0].position + 1 : 1;

        const role = await db.role.create({
            data: {
                name: name || 'new role',
                color: color || '#99AAB5',
                permissions: permissions || 0,
                position: nextPosition,
                hoist: hoist !== undefined ? hoist : true,
                serverId
            }
        });

        res.status(201).json({
            success: true,
            role
        });
    } catch (error) {
        console.error('Create role error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating role'
        });
    }
};

// Update a role
exports.updateRole = async (req, res) => {
    try {
        const { serverId, roleId } = req.params;
        const { name, color, permissions, position, hoist } = req.body;

        // Check if user is owner
        const server = await db.server.findUnique({
            where: { id: serverId }
        });

        if (!server || server.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the server owner can update roles'
            });
        }

        const role = await db.role.findUnique({
            where: { id: roleId }
        });

        if (!role || role.serverId !== serverId) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        // Cannot rename or delete default role usually, but depends on discord behavior
        // Discord's @everyone role is special.

        const updatedRole = await db.role.update({
            where: { id: roleId },
            data: {
                name,
                color,
                permissions,
                position,
                hoist
            }
        });

        res.status(200).json({
            success: true,
            role: updatedRole
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating role'
        });
    }
};

// Delete a role
exports.deleteRole = async (req, res) => {
    try {
        const { serverId, roleId } = req.params;

        // Check if user is owner
        const server = await db.server.findUnique({
            where: { id: serverId }
        });

        if (!server || server.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the server owner can delete roles'
            });
        }

        const role = await db.role.findUnique({
            where: { id: roleId }
        });

        if (!role || role.serverId !== serverId) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        if (role.isDefault) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete the default role'
            });
        }

        // Delete role
        await db.role.delete({
            where: { id: roleId }
        });

        // Optimization: Clean up member roleIds? 
        // Prisma doesn't have a direct "remove from array" for all records easily without raw sql or iterating
        // But we can do it in a transaction if needed. 
        // For now, let's just delete it. Frontend will handle filtering out invalid IDs or backend will filter them on fetch.

        res.status(200).json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error) {
        console.error('Delete role error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting role'
        });
    }
};

// Update member roles
exports.updateMemberRoles = async (req, res) => {
    try {
        const { serverId, userId } = req.params;
        const { roleIds } = req.body;

        // Check if user is owner/has permission
        const server = await db.server.findUnique({
            where: { id: serverId }
        });

        if (!server || server.ownerId !== req.user.id) {
            // In a full implementation, we'd check if req.user has "MANAGE_ROLES" permission
            return res.status(403).json({
                success: false,
                message: 'Only the server owner can manage member roles'
            });
        }

        const member = await db.serverMember.findUnique({
            where: { serverId_userId: { serverId, userId } }
        });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        const updatedMember = await db.serverMember.update({
            where: { id: member.id },
            data: { roleIds }
        });

        res.status(200).json({
            success: true,
            member: updatedMember
        });
    } catch (error) {
        console.error('Update member roles error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating member roles'
        });
    }
};
