const db = require('../config/db');

/**
 * Check if a user can access a specific channel
 * @param {string} userId - User ID
 * @param {string} channelId - Channel ID
 * @param {object} prismaClient - Prisma client instance (optional, uses default if not provided)
 * @returns {Promise<boolean>} - True if user has access, false otherwise
 */
async function canAccessChannel(userId, channelId, prismaClient = db) {
    try {
        // Get the channel with server info
        const channel = await prismaClient.channel.findUnique({
            where: { id: channelId },
            include: {
                server: {
                    select: {
                        id: true,
                        ownerId: true
                    }
                }
            }
        });

        if (!channel) {
            return false;
        }

        // Server owner always has access
        if (channel.server.ownerId === userId) {
            return true;
        }

        // If channel is public, check if user is a member of the server
        if (!channel.isPrivate) {
            const member = await prismaClient.serverMember.findFirst({
                where: {
                    serverId: channel.serverId,
                    userId: userId
                }
            });
            return !!member;
        }

        // For private channels, check if user has any of the allowed roles
        const member = await prismaClient.serverMember.findFirst({
            where: {
                serverId: channel.serverId,
                userId: userId
            }
        });

        if (!member) {
            return false;
        }

        // Check if user has any of the allowed roles
        const hasAllowedRole = member.roleIds.some(roleId =>
            channel.allowedRoleIds.includes(roleId)
        );

        return hasAllowedRole;
    } catch (error) {
        console.error('Error checking channel access:', error);
        return false;
    }
}

/**
 * Filter channels based on user's permissions
 * @param {string} userId - User ID
 * @param {Array} channels - Array of channel objects
 * @param {string} serverId - Server ID
 * @param {object} prismaClient - Prisma client instance (optional)
 * @returns {Promise<Array>} - Filtered array of accessible channels
 */
async function filterAccessibleChannels(userId, channels, serverId, prismaClient = db) {
    try {
        // Get server info
        const server = await prismaClient.server.findUnique({
            where: { id: serverId },
            select: { ownerId: true }
        });

        if (!server) {
            return [];
        }

        // Server owner sees all channels
        if (server.ownerId === userId) {
            return channels;
        }

        // Get user's member info with roles
        const member = await prismaClient.serverMember.findFirst({
            where: {
                serverId: serverId,
                userId: userId
            }
        });

        if (!member) {
            return [];
        }

        // Filter channels based on privacy and roles
        const accessibleChannels = channels.filter(channel => {
            // Public channels are accessible to all members
            if (!channel.isPrivate) {
                return true;
            }

            // Private channels require matching role
            return member.roleIds.some(roleId =>
                channel.allowedRoleIds.includes(roleId)
            );
        });

        return accessibleChannels;
    } catch (error) {
        console.error('Error filtering accessible channels:', error);
        return [];
    }
}

/**
 * Check if a member has permission to access a channel
 * @param {object} member - Server member object with roleIds
 * @param {object} channel - Channel object with isPrivate and allowedRoleIds
 * @param {object} server - Server object with ownerId
 * @returns {boolean} - True if member has access
 */
function hasChannelPermission(member, channel, server) {
    // Server owner always has access
    if (server.ownerId === member.userId) {
        return true;
    }

    // Public channels are accessible to all members
    if (!channel.isPrivate) {
        return true;
    }

    // Private channels require matching role
    return member.roleIds.some(roleId =>
        channel.allowedRoleIds.includes(roleId)
    );
}

module.exports = {
    canAccessChannel,
    filterAccessibleChannels,
    hasChannelPermission
};
