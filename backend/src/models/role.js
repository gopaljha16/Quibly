const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
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
      maxlength: 32,
    },

    color: {
      type: String, // hex: #5865F2
      default: "#99AAB5",
    },

    permissions: {
      type: Number, // BITMASK
      default: 0,
    },

    position: {
      type: Number, // role hierarchy
      default: 0,
    },

    isDefault: {
      type: Boolean, // @everyone role
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
