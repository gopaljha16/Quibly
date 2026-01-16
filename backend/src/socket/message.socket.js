 const Message = require("../models/message");
const Channel = require("../models/channel");
const { ServerMember } = require("../models/server");
const mongoose = require("mongoose");

module.exports = (io, socket) => {
  const getSocketUserId = () => {
    const id = socket.user?._id || socket.user?.id;
    return typeof id === "string" ? id : String(id || "");
  };

  const ensureChannelAccess = async (channelId) => {
    const userId = getSocketUserId();

    if (!mongoose.isValidObjectId(channelId)) {
      throw new Error("Invalid channelId");
    }
    if (!mongoose.isValidObjectId(userId)) {
      throw new Error("Invalid userId");
    }

    const channel = await Channel.findById(channelId).select("_id serverId");
    if (!channel) {
      throw new Error("Channel not found");
    }

    const isMember = await ServerMember.exists({
      serverId: channel.serverId,
      userId: new mongoose.Types.ObjectId(userId),
      isBanned: false,
    });
    if (!isMember) {
      throw new Error("Not a member of this server");
    }

    return { userId, channel };
  };

  socket.on("join_channel", async (channelId) => {
    try {
      await ensureChannelAccess(channelId);
      socket.join(channelId);
      console.log(`User joined channel ${channelId}`);
    } catch (err) {
      socket.emit("error_message", err.message || "Join channel failed");
    }
  });

  socket.on("leave_channel", (channelId) => {
    socket.leave(channelId);
  });

  socket.on("send_message", async (data) => {
    try {
      console.log(" Received message data:", data);

      const channelId = data?.channelId;
      const content = typeof data?.content === "string" ? data.content : "";
      if (!content.trim()) {
        throw new Error("Message content is required");
      }

      const { userId, channel } = await ensureChannelAccess(channelId);

      const message = await Message.create({
        channelId: new mongoose.Types.ObjectId(channelId),
        serverId: channel.serverId,
        senderId: new mongoose.Types.ObjectId(userId),
        content: content.trim(),
      });

      console.log(" Message saved:", message._id);

      io.to(channelId).emit("receive_message", {
        _id: message._id,
        content: message.content,
        senderId: userId,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error(" Message save error:", err);
      socket.emit("error_message", "Message failed");
    }
  });
};