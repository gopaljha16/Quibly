const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
    },

    discriminator: {
      type: String,
      required: true,
      length: 4, // Discord-style #1234
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // security: not returned by default
    },

    // Profile
    avatar: {
      type: String, // image URL
      default: null,
    },

    banner: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      maxlength: 190,
      default: "",
    },

    // Status & Presence
    status: {
      type: String,
      enum: ["online", "idle", "dnd", "offline"],
      default: "offline",
    },

    customStatus: {
      type: String,
      maxlength: 128,
      default: "",
    },

    // Relationships
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    friendRequests: {
      incoming: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      outgoing: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },

    // Servers (Guilds)
    servers: [
      {
        serverId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Server",
        },
        roleIds: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Role",
          },
        ],
      },
    ],

    // Settings
    settings: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "dark",
      },
      allowDMsFromNonFriends: {
        type: Boolean,
        default: true,
      },
    },

    // Moderation & System
    isVerified: {
      type: Boolean,
      default: false,
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

module.exports = mongoose.model("User", userSchema);
