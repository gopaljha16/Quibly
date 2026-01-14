const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    icon: {
      type: String,
      default: null,
    },

    banner: {
      type: String,
      default: null,
    },

    description: {
      type: String,
      maxlength: 300,
      default: "",
    },

    membersCount: {
      type: Number,
      default: 1,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    verificationLevel: {
      type: String,
      enum: ["none", "low", "medium", "high"],
      default: "none",
    },
  },
  { timestamps: true }
);

const serverMemberSchema = new mongoose.Schema(
  {
    serverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Server",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    roleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    isMuted: {
      type: Boolean,
      default: false,
    },

    isBanned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent duplicate joins
serverMemberSchema.index({ serverId: 1, userId: 1 }, { unique: true });

const ServerMember = mongoose.model("ServerMember", serverMemberSchema);
const Server = mongoose.model("Server", serverSchema);

module.exports = Server;
module.exports.ServerMember = ServerMember;
