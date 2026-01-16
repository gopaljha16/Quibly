const Message = require("../models/message")
const Channel = require("../models/channel")
const { ServerMember } = require("../models/server")

const createMessage = async (req, res) => {
    try {
        const userId = req.user?._id
        const { channelId, content } = req.body
         
        if (!userId) {
            return res.status(403).json({ success: false, message: "User not authenticated" });
        }

        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }

        const isMember = await ServerMember.exists({ serverId: channel.serverId, userId, isBanned: false });
        if (!isMember) {
            return res.status(403).json({ success: false, message: "Not a member of this server" });
        }

        if (!content || typeof content !== "string" || !content.trim()) {
            return res.status(400).json({ success: false, message: "Message content is required" });
        }

        const message = await Message.create({
            channelId,
            serverId: channel.serverId,
            senderId: userId,
            content: content.trim(),
        });

        const populated = await Message.findById(message._id).populate("senderId", "username avatar")

        if (global.io) {
            global.io.to(channelId.toString()).emit("receive_message", populated)
        }

        res.status(201).json(populated);
    } catch (err) {
        res.status(401).json({
            message:err.message
        })
    }
}

const getMessages = async (req, res) => {
  try {
    const userId = req.user?._id
    if (!userId) {
      return res.status(403).json({ success: false, message: "User not authenticated" });
    }

    const { channelId } = req.params;
    const { cursor } = req.query;

    const channel = await Channel.findById(channelId).select("_id serverId")
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    const isMember = await ServerMember.exists({ serverId: channel.serverId, userId, isBanned: false });
    if (!isMember) {
      return res.status(403).json({ success: false, message: "Not a member of this server" });
    }

    const query = { channelId };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("senderId", "username avatar");

    res.json(messages);
  } catch (err) {
    res.status(401).json({
      message: err.message
    })
  }
};

const editMessage = async (req, res) => {
  try {
    const userId = req.user?._id
    if (!userId) {
      return res.status(403).json({ success: false, message: "User not authenticated" });
    }
    const { id } = req.params;
    const { content } = req.body;

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ success: false, message: "Message content is required" });
    }

    const message = await Message.findOneAndUpdate(
    { _id: id, senderId: userId },
    { content: content.trim(), editedAt: new Date() },
    { new: true }
  ).populate("senderId", "username avatar");

  res.json(message);
} catch (err) {
  res.status(401).json({
    message:err.message
  })
}
};

const deleteMessage = async (req, res) => {
  try {
    const userId = req.user?._id
    if (!userId) {
      return res.status(403).json({ success: false, message: "User not authenticated" });
    }

    const { id } = req.params;

    const updated = await Message.findOneAndUpdate(
      { _id: id, senderId: userId },
      { isDeleted: true, content: "This message was deleted" },
      { new: true }
    ).populate("senderId", "username avatar")

    if (!updated) {
      return res.status(404).json({ success: false, message: "Message not found (or not owned by you)" })
    }

    return res.status(200).json({ success: true, message: "Message deleted", data: updated })
  } catch (err) {
    return res.status(401).json({ message: err.message })
  }
};


module.exports = {createMessage , getMessages , editMessage , deleteMessage  }

