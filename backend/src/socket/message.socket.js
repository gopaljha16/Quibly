 const Message = require("../models/message");
const mongoose = require("mongoose");

module.exports = (io, socket) => {
  socket.on("join_channel", (channelId) => {
    socket.join(channelId);
    console.log(`User joined channel ${channelId}`);
  });

  socket.on("leave_channel", (channelId) => {
    socket.leave(channelId);
  });

  socket.on("send_message", async (data) => {
    try {
      console.log(" Received message data:", data);
      console.log(" User ID:", socket.user.id);

      if (!mongoose.isValidObjectId(data.channelId)) {
        throw new Error("Invalid channelId");
      }
      if (!mongoose.isValidObjectId(socket.user.id)) {
        throw new Error("Invalid senderId");
      }

      const message = await Message.create({
        channelId: new mongoose.Types.ObjectId(data.channelId),
        senderId: new mongoose.Types.ObjectId(socket.user.id),
        content: data.content,
      });

      console.log(" Message saved:", message._id);

      io.to(data.channelId).emit("receive_message", {
        _id: message._id,
        content: message.content,
        senderId: socket.user.id,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error(" Message save error:", err);
      socket.emit("error_message", "Message failed");
    }
  });
};