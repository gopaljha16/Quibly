const db = require("../config/db");

module.exports = (io, socket) => {
  const getSocketUserId = () => {
    const id = socket.user?.id;
    return typeof id === "string" ? id : String(id || "");
  };

  const ensureChannelAccess = async (channelId) => {
    const userId = getSocketUserId();

    if (!channelId || !userId) {
      throw new Error("Invalid channelId or userId");
    }

    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: { id: true, serverId: true }
    });
    
    if (!channel) {
      throw new Error("Channel not found");
    }

    const isMember = await db.serverMember.findFirst({
      where: {
        serverId: channel.serverId,
        userId: userId,
        isBanned: false,
      }
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
      console.log("📨 Received message data:", data);

      const channelId = data?.channelId;
      const content = typeof data?.content === "string" ? data.content : "";
      if (!content.trim()) {
        throw new Error("Message content is required");
      }

      const { userId, channel } = await ensureChannelAccess(channelId);

      const message = await db.message.create({
        data: {
          channelId: channelId,
          serverId: channel.serverId,
          senderId: userId,
          content: content.trim(),
          type: 'DEFAULT'
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              discriminator: true,
              avatar: true
            }
          }
        }
      });

      console.log("💾 Message saved:", message.id);

      io.to(channelId).emit("receive_message", {
        id: message.id,
        content: message.content,
        senderId: userId,
        sender: message.sender,
        createdAt: message.createdAt,
        channelId: message.channelId,
        serverId: message.serverId
      });
    } catch (err) {
      console.error("❌ Message save error:", err);
      socket.emit("error_message", "Message failed");
    }
  });
};