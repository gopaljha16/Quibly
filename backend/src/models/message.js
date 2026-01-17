const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true,
    },

    serverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Server",
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      maxlength: 4000,
    },

    type: {
      type: String,
      enum: ["TEXT", "FILE", "SYSTEM"],
      default: "TEXT",
    },

    attachments: [
      {
        url: String,
        fileType: String,
        size: Number,
      },
    ],

    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for fast pagination
messageSchema.index({ channelId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
