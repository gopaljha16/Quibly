const db = require("../config/db");
const redis = require("../config/redis");

// Set custom activity
exports.setActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, name, details, state, emoji, endsAt } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Activity name is required" });
    }

    const validTypes = ["CUSTOM", "LISTENING", "WATCHING", "COMPETING", "STREAMING"];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid activity type" });
    }

    const activityData = {
      type: type || "CUSTOM",
      name: name.trim(),
      details: details?.trim() || null,
      state: state?.trim() || null,
      emoji: emoji || null,
      startedAt: new Date(),
      endsAt: endsAt ? new Date(endsAt) : null
    };

    // Save to database
    const activity = await db.userActivity.create({
      data: {
        userId,
        ...activityData
      }
    });

    // Update user's current activity
    await db.user.update({
      where: { id: userId },
      data: {
        currentActivity: activityData
      }
    });

    // Store in Redis for real-time access
    if (redis.client && redis.client.isReady) {
      await redis.client.setEx(
        `user:${userId}:activity`,
        3600, // 1 hour expiry
        JSON.stringify(activityData)
      );
    }

    // Broadcast to all connected clients via socket
    const io = req.app.get("io");
    if (io) {
      io.emit("user_activity_change", {
        userId,
        activity: activityData
      });
    }

    res.json({ activity: activityData });
  } catch (error) {
    console.error("Error setting activity:", error);
    res.status(500).json({ error: "Failed to set activity" });
  }
};

// Clear activity
exports.clearActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    // Update user's current activity to null
    await db.user.update({
      where: { id: userId },
      data: {
        currentActivity: null
      }
    });

    // Remove from Redis
    if (redis.client && redis.client.isReady) {
      await redis.client.del(`user:${userId}:activity`);
    }

    // Broadcast to all connected clients
    const io = req.app.get("io");
    if (io) {
      io.emit("user_activity_change", {
        userId,
        activity: null
      });
    }

    res.json({ message: "Activity cleared" });
  } catch (error) {
    console.error("Error clearing activity:", error);
    res.status(500).json({ error: "Failed to clear activity" });
  }
};

// Get user's current activity
exports.getActivity = async (req, res) => {
  try {
    const { userId } = req.params;

    // Try Redis first
    if (redis.client && redis.client.isReady) {
      const cachedActivity = await redis.client.get(`user:${userId}:activity`);
      if (cachedActivity) {
        return res.json({ activity: JSON.parse(cachedActivity) });
      }
    }

    // Fallback to database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { currentActivity: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ activity: user.currentActivity });
  } catch (error) {
    console.error("Error getting activity:", error);
    res.status(500).json({ error: "Failed to get activity" });
  }
};

// Get user's activity history
exports.getActivityHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const activities = await db.userActivity.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json({ activities });
  } catch (error) {
    console.error("Error getting activity history:", error);
    res.status(500).json({ error: "Failed to get activity history" });
  }
};

// Set custom status (with optional expiry)
exports.setCustomStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, emoji, expiresAt } = req.body;

    if (!status || status.trim().length === 0) {
      return res.status(400).json({ error: "Status text is required" });
    }

    const updateData = {
      customStatus: status.trim(),
      customStatusEmoji: emoji || null,
      customStatusExpiresAt: expiresAt ? new Date(expiresAt) : null
    };

    await db.user.update({
      where: { id: userId },
      data: updateData
    });

    // Store in Redis
    if (redis.client && redis.client.isReady) {
      await redis.client.setEx(
        `user:${userId}:customStatus`,
        3600,
        JSON.stringify(updateData)
      );
    }

    // Broadcast to all connected clients
    const io = req.app.get("io");
    if (io) {
      io.emit("user_custom_status_change", {
        userId,
        customStatus: updateData.customStatus,
        customStatusEmoji: updateData.customStatusEmoji,
        customStatusExpiresAt: updateData.customStatusExpiresAt
      });
    }

    res.json({ customStatus: updateData });
  } catch (error) {
    console.error("Error setting custom status:", error);
    res.status(500).json({ error: "Failed to set custom status" });
  }
};

// Clear custom status
exports.clearCustomStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.user.update({
      where: { id: userId },
      data: {
        customStatus: null,
        customStatusEmoji: null,
        customStatusExpiresAt: null
      }
    });

    // Remove from Redis
    if (redis.client && redis.client.isReady) {
      await redis.client.del(`user:${userId}:customStatus`);
    }

    // Broadcast to all connected clients
    const io = req.app.get("io");
    if (io) {
      io.emit("user_custom_status_change", {
        userId,
        customStatus: null,
        customStatusEmoji: null,
        customStatusExpiresAt: null
      });
    }

    res.json({ message: "Custom status cleared" });
  } catch (error) {
    console.error("Error clearing custom status:", error);
    res.status(500).json({ error: "Failed to clear custom status" });
  }
};
