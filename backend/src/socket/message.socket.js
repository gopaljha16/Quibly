const db = require("../config/db");
const { publishMessage } = require("../services/messageProducer");
const { isKafkaConnected } = require("../config/kafka");

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

  const ensureDMRoomAccess = async (dmRoomId) => {
    const userId = getSocketUserId();

    if (!dmRoomId || !userId) {
      throw new Error("Invalid dmRoomId or userId");
    }

    const participant = await db.dMParticipant.findFirst({
      where: {
        dmRoomId,
        userId
      }
    });

    if (!participant) {
      throw new Error("Not a participant of this DM room");
    }

    return { userId };
  };

  socket.on("join_channel", async (channelId) => {
    try {
      await ensureChannelAccess(channelId);
      socket.join(channelId);
    } catch (err) {
      console.error(`Join channel failed:`, err.message);
      socket.emit("error_message", err.message || "Join channel failed");
    }
  });

  socket.on("join_dm", async (dmRoomId) => {
    try {
      await ensureDMRoomAccess(dmRoomId);
      socket.join(dmRoomId);
    } catch (err) {
      console.error(`Join DM failed:`, err.message);
      socket.emit("error_message", err.message || "Join DM failed");
    }
  });

  socket.on("leave_channel", (channelId) => {
    socket.leave(channelId);
  });

  socket.on("send_message", async (data) => {
    try {
      const channelId = data?.channelId;
      const content = typeof data?.content === "string" ? data.content : "";
      if (!content.trim()) {
        throw new Error("Message content is required");
      }

      const { userId, channel } = await ensureChannelAccess(channelId);

      // Get sender info for the message
      const sender = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          discriminator: true,
          avatar: true
        }
      });

      // Create message object
      const messageId = generateMessageId();
      const messageData = {
        id: messageId,
        channelId: channelId,
        serverId: channel.serverId,
        senderId: userId,
        content: content.trim(),
        type: 'TEXT',
        sender: sender,
        createdAt: new Date().toISOString(),
        attachments: [],
        mentions: []
      };

      // Try to publish to Kafka first
      if (isKafkaConnected()) {
        const published = await publishMessage(messageData);

        if (published) {
          // Send immediate acknowledgment to sender
          socket.emit("message_sent", {
            id: messageId,
            tempId: data.tempId,
            status: "queued"
          });
          return;
        } else {
          console.error('Kafka publish failed, falling back to direct DB');
        }
      } else {
        console.error('Kafka not connected, using direct DB write');
      }

      // Fallback: Direct DB write if Kafka is not available
      const message = await db.message.create({
        data: {
          id: messageId,
          channelId: channelId,
          serverId: channel.serverId,
          senderId: userId,
          content: content.trim(),
          type: 'TEXT'
        }
      });

      // Broadcast directly
      io.to(channelId).emit("receive_message", {
        _id: message.id,
        content: message.content,
        senderId: userId,
        sender: sender,
        createdAt: message.createdAt,
        channelId: message.channelId,
        serverId: message.serverId
      });

    } catch (err) {
      console.error("Message save error:", err);
      socket.emit("error_message", "Message failed");
    }
  });
};

// Helper function to generate unique message IDs
function generateMessageId() {
  // Using timestamp + random for uniqueness (similar to cuid)
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `msg_${timestamp}${randomStr}`;
}