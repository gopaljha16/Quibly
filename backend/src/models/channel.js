const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema(
  {
    serverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Server",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      maxlength: 100,
    },

    type: {
      type: String,
      enum: ["TEXT", "VOICE"],
      default: "TEXT",
    },

    topic: {
      type: String,
      maxlength: 200,
      default: "",
    },

    position: {
      type: Number,
      default: 0,
    },

    permissionOverwrites: [
      {
        roleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Role",
        },
        allow: Number, // bitmask
        deny: Number,  // bitmask
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Channel", channelSchema);
