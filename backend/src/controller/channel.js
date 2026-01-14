const Channel = require("../models/channel")
const Server = require("../models/server")
const { ServerMember } = require("../models/server")
const Message = require("../models/message")
const mongoose = require("mongoose")

// create channel
const createChannel = async (req, res) => {
    try {
        const { serverId } = req.params
        const { name, type, topic, position } = req.body

        const userId = req.user?._id
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }

        if (!mongoose.isValidObjectId(serverId)) {
            return res.status(400).json({ success: false, message: "Invalid serverId" })
        }

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ success: false, message: "Channel name is required" })
        }

        const server = await Server.findById(serverId)
        if (!server) {
            return res.status(404).json({ success: false, message: "Server not found" })
        }

        const isMember = await ServerMember.exists({ serverId, userId, isBanned: false })
        if (!isMember) {
            return res.status(403).json({ success: false, message: "Not a member of this server" })
        }

        if (server.ownerId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only server owner can create channels" })
        }

        let resolvedPosition = typeof position === "number" ? position : undefined
        if (typeof resolvedPosition !== "number") {
            const last = await Channel.findOne({ serverId }).sort({ position: -1 }).select("position")
            resolvedPosition = typeof last?.position === "number" ? last.position + 1 : 0
        }

        const normalizedType = typeof type === "string" ? type.toUpperCase() : undefined

        const channel = await Channel.create({
            serverId,
            name: name.trim(),
            type: normalizedType,
            topic: typeof topic === "string" ? topic : undefined,
            position: resolvedPosition,
        })

        return res.status(201).json({ success: true, channel })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

// get channels
const getChannels = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const serverId = req.params.serverId;

        if (!serverId) {
            return res.status(400).json({ success: false, message: "Server ID is required" });
        }

        const server = await Server.findById(serverId)
        if (!server) {
            return res.status(404).json({ success: false, message: "Server not found" })
        }

        const isMember = await ServerMember.exists({ serverId, userId, isBanned: false })
        if (!isMember) {
            return res.status(403).json({ success: false, message: "Not a member of this server" })
        }

        const channels = await Channel.find({ serverId }).sort({ position: 1, createdAt: 1 })
        return res.status(200).json({
            success: true,
            channels,
        })

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

// get channel by id
const getChannelById = async (req, res) => {
    try {
        const { channelId } = req.params;

        const userId = req.user?._id
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }

        if (!channelId || !mongoose.isValidObjectId(channelId)) {
            return res.status(400).json({ success: false, message: "Channel ID is required" });
        }

        const channel = await Channel.findById(channelId)
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }

        const isMember = await ServerMember.exists({ serverId: channel.serverId, userId, isBanned: false })
        if (!isMember) {
            return res.status(403).json({ success: false, message: "Not a member of this server" })
        }

        return res.status(200).json({
            success: true,
            channel
        })

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

// update channel
const updateChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { name, type, topic, position } = req.body;

        const userId = req.user?._id
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }

        if (!channelId || !mongoose.isValidObjectId(channelId)) {
            return res.status(400).json({ success: false, message: "Channel ID is required" });
        }

        const channel = await Channel.findById(channelId)
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }

        const server = await Server.findById(channel.serverId)
        if (!server) {
            return res.status(404).json({ success: false, message: "Server not found" })
        }

        const isMember = await ServerMember.exists({ serverId: channel.serverId, userId, isBanned: false })
        if (!isMember) {
            return res.status(403).json({ success: false, message: "Not a member of this server" })
        }

        if (server.ownerId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only server owner can update channels" })
        }

        const update = {}
        if (typeof name === "string" && name.trim()) update.name = name.trim()
        if (typeof type === "string") update.type = type.toUpperCase()
        if (typeof topic === "string") update.topic = topic
        if (typeof position === "number") update.position = position

        const updatedChannel = await Channel.findByIdAndUpdate(channelId, update, { new: true })

        return res.status(200).json({
            success: true,
            updatedChannel
        })

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

// delete channel
const deleteChannel = async (req, res) => {
    try {
        const { channelId } = req.params;

        const userId = req.user?._id
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }

        if (!channelId || !mongoose.isValidObjectId(channelId)) {
            return res.status(400).json({ success: false, message: "Channel ID is required" });
        }

        const channel = await Channel.findById(channelId)
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }

        const server = await Server.findById(channel.serverId)
        if (!server) {
            return res.status(404).json({ success: false, message: "Server not found" })
        }

        const isMember = await ServerMember.exists({ serverId: channel.serverId, userId, isBanned: false })
        if (!isMember) {
            return res.status(403).json({ success: false, message: "Not a member of this server" });
        }

        if (server.ownerId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only server owner can delete channels" });
        }

        await Message.deleteMany({ channelId })
        await Channel.deleteOne({ _id: channelId })

        return res.status(200).json({
            success: true,
            message: "Channel deleted successfully"
        })

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

// reorder channels
const reorderChannels = async (req, res) => {
    try {
        const { serverId } = req.params;
        const { channelIds } = req.body;

        const userId = req.user?._id
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }

        if (!serverId || !mongoose.isValidObjectId(serverId)) {
            return res.status(400).json({ success: false, message: "Invalid serverId" })
        }

        if (!Array.isArray(channelIds) || channelIds.length === 0) {
            return res.status(400).json({ success: false, message: "channelIds is required" })
        }

        const server = await Server.findById(serverId)
        if (!server) {
            return res.status(404).json({ success: false, message: "Server not found" })
        }

        const isMember = await ServerMember.exists({ serverId, userId, isBanned: false })
        if (!isMember) {
            return res.status(403).json({ success: false, message: "Not a member of this server" })
        }

        if (server.ownerId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only server owner can reorder channels" })
        }

        const channels = await Channel.find({ _id: { $in: channelIds }, serverId }).select("_id")
        if (channels.length !== channelIds.length) {
            return res.status(400).json({ success: false, message: "Invalid channelIds for this server" })
        }

        await Channel.bulkWrite(
            channelIds.map((id, index) => ({
                updateOne: {
                    filter: { _id: id, serverId },
                    update: { $set: { position: index } },
                },
            }))
        )

        return res.status(200).json({ success: true })

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

module.exports = { createChannel, getChannels, getChannelById, updateChannel, deleteChannel, reorderChannels }