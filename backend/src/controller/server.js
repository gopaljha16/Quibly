const Server = require("../models/server")
const Channel = require("../models/channel")
const { ServerMember } = require("../models/server")
const Message = require("../models/message")

//create server
const createServer = async (req, res) => {
    try {
        const userId = req.user._id
        const { name, description, icon, banner, isPublic, verificationLevel } = req.body

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ success: false, message: "Server name is required" })
        }

        const server = await Server.create({
            name: name.trim(),
            ownerId: userId,
            description: typeof description === "string" ? description : undefined,
            icon: typeof icon === "string" ? icon : undefined,
            banner: typeof banner === "string" ? banner : undefined,
            isPublic: typeof isPublic === "boolean" ? isPublic : undefined,
            verificationLevel: typeof verificationLevel === "string" ? verificationLevel : undefined,
        })

        await ServerMember.create({ serverId: server._id, userId })

        if (Array.isArray(req.user.servers)) {
            req.user.servers.push({ serverId: server._id, roleIds: [] })
            await req.user.save()
        }

        return res.status(201).json({ success: true, server })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

const getMyServers = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(403).json({ success: false, message: "User not authenticated" });
        }

        const memberships = await ServerMember.find({ userId }).select("serverId");
        const serverIds = memberships
            .map((m) => m.serverId)
            .filter(Boolean);

        const servers = await Server.find({ _id: { $in: serverIds } });

        return res.status(200).json({
            success: true,
            data: servers,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

//get single server
const getServerById = async (req, res) => {
    try {
        const { serverId } = req.params;

        if (!serverId) {
            return res.status(400).json({
                success: false,
                message: "Server Doesn't exisits"
            })
        }

        const getServer = await Server.findById(serverId)

        if (!getServer) {
            return res.status(404).json({
                success: false,
                message: "Server not found",
            });
        }

        return res.status(200).json({
            success: true,
            getServer
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

// get memebers of a server 
const getMembers = async (req, res) => {
    try {
        const { serverId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!serverId) {
            return res.status(400).json({
                success: false,
                message: "Server Doesn't exisits"
            })
        }

        const server = await Server.findById(serverId).select("ownerId");
        if (!server) {
            return res.status(404).json({ success: false, message: "Server not found" });
        }

        const isMember = await ServerMember.exists({ serverId, userId, isBanned: false });
        if (!isMember) {
            return res.status(403).json({ success: false, message: "Not a member of this server" });
        }

        const members = await ServerMember.find({ serverId, isBanned: false })
            .populate("userId", "username discriminator avatar status customStatus bio")
            .sort({ createdAt: 1 });
        return res.status(200).json({
            success: true,
            ownerId: server.ownerId,
            members,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

//join server
const joinServer = async (req, res) => {
    try {
        const { serverId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            })
        }

        if (!serverId) {
            return res.status(400).json({
                success: false,
                message: "Server Doesn't exisits"
            })
        }

        const server = await Server.findById(serverId)
        if (!server) {
            return res.status(404).json({
                success: false,
                message: "Server not found"
            })
        }

        if (!server.isPublic && server.ownerId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "This server is private"
            })
        }

        const existing = await ServerMember.findOne({ serverId, userId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "You are already a member of this server"
            })
        }

        const membership = await ServerMember.create({ serverId, userId })
        await Server.findByIdAndUpdate(serverId, { $inc: { membersCount: 1 } })

        if (Array.isArray(req.user?.servers)) {
            const alreadyInUser = req.user.servers?.some(
                (s) => s?.serverId?.toString?.() === serverId.toString()
            );
            if (!alreadyInUser) {
                req.user.servers.push({ serverId, roleIds: [] })
                await req.user.save()
            }
        }

        return res.status(200).json({
            success: true,
            membership,
        })

    } catch (err) {
        if (err?.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "You are already a member of this server",
            })
        }
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

//leave server
const leaveServer = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { serverId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const server = await Server.findById(serverId)

        if (!server) {
            return res.status(404).json({
                success: false,
                message: "Server not found"
            });
        }

        // qwner cannot leave
        if (server.ownerId.toString() === userId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Owner cannot leave the server. Transfer ownership or delete server."
            });
        }

        // check membership
        const membership = await ServerMember.findOne({ serverId, userId });
        if (!membership) {
            return res.status(400).json({
                success: false,
                message: "You are not a member of this server"
            });
        }

        const deleted = await ServerMember.deleteOne({ serverId, userId });
        if (deleted?.deletedCount) {
            await Server.findByIdAndUpdate(serverId, { $inc: { membersCount: -1 } });

            if (Array.isArray(req.user?.servers)) {
                req.user.servers = req.user.servers.filter(
                    (s) => s?.serverId?.toString?.() !== serverId.toString()
                );
                await req.user.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: "Successfully left the server"
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

//delete server
const deleteServer = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { serverId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const server = await Server.findById(serverId);
        if (!server) {
            return res.status(404).json({ success: false, message: "Server not found" });
        }

        // only owner can delete
        if (server.ownerId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only server owner can delete this server",
            });
        }

        // delete channels
        await Channel.deleteMany({ serverId });

        // delete messages 
        await Message.deleteMany({ serverId });

        // delete server itself
        await Server.findByIdAndDelete(serverId);

        await ServerMember.deleteMany({ serverId });

        return res.status(200).json({
            success: true,
            message: "Server deleted successfully",
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

module.exports = { createServer, getMyServers, getServerById, deleteServer, leaveServer, getMembers, joinServer }