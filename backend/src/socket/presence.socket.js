const db = require("../config/db");
const redis = require("../config/redis");

// Store active connections in memory for this server instance
const activeConnections = new Map(); // userId -> Set of socketIds
const socketToUser = new Map(); // socketId -> userId

module.exports = (io, socket) => {
  const getSocketUserId = () => {
    const id = socket.user?._id || socket.user?.id;
    return typeof id === "string" ? id : String(id || "");
  };

  // User comes online
  const handleUserOnline = async (userId) => {
    try {
      // Check if user exists first
      const userExists = await db.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });

      if (!userExists) {
        console.error(`User ${userId} not found in database`);
        socket.emit('auth_error', { message: 'User not found' });
        socket.disconnect(true);
        return;
      }

      // Update user status in database
      await db.user.update({
        where: { id: userId },
        data: {
          status: "online",
          lastSeen: new Date()
        }
      });

      // Store in Redis with expiration (for distributed systems)
      if (redis.client && redis.client.isReady) {
        await redis.client.setEx(`user:${userId}:status`, 300, "online"); // 5 min expiry
        await redis.client.setEx(`user:${userId}:lastSeen`, 300, new Date().toISOString());
      }

      // Track connection
      if (!activeConnections.has(userId)) {
        activeConnections.set(userId, new Set());
      }
      activeConnections.get(userId).add(socket.id);
      socketToUser.set(socket.id, userId);

      // Broadcast status to all connected clients
      socket.broadcast.emit("user_status_change", {
        userId,
        status: "online",
        lastSeen: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error handling user online:", error);
    }
  };

  // User goes offline
  const handleUserOffline = async (userId) => {
    try {
      // Remove this socket from user's connections
      if (activeConnections.has(userId)) {
        activeConnections.get(userId).delete(socket.id);

        // If no more connections for this user, mark as offline
        if (activeConnections.get(userId).size === 0) {
          activeConnections.delete(userId);

          // Check if user exists before updating
          const userExists = await db.user.findUnique({
            where: { id: userId },
            select: { id: true }
          });

          if (userExists) {
            // Update database
            await db.user.update({
              where: { id: userId },
              data: {
                status: "offline",
                lastSeen: new Date()
              }
            });

            // Update Redis
            if (redis.client && redis.client.isReady) {
              await redis.client.setEx(`user:${userId}:status`, 300, "offline");
              await redis.client.setEx(`user:${userId}:lastSeen`, 300, new Date().toISOString());
            }

            // Broadcast offline status
            socket.broadcast.emit("user_status_change", {
              userId,
              status: "offline",
              lastSeen: new Date().toISOString()
            });
          }
        }
      }

      socketToUser.delete(socket.id);
    } catch (error) {
      console.error("Error handling user offline:", error);
    }
  };

  // Handle status changes (online, idle, dnd, offline)
  const handleStatusChange = async (newStatus) => {
    try {
      const userId = getSocketUserId();
      if (!userId) return;

      const validStatuses = ["online", "idle", "dnd", "offline"];
      if (!validStatuses.includes(newStatus)) {
        socket.emit("error", "Invalid status");
        return;
      }

      // Check if user exists
      const userExists = await db.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });

      if (!userExists) {
        console.error(`User ${userId} not found in database`);
        socket.emit("auth_error", { message: "User not found" });
        socket.disconnect(true);
        return;
      }

      // Update database
      await db.user.update({
        where: { id: userId },
        data: {
          status: newStatus,
          lastSeen: new Date()
        }
      });

      // Update Redis
      if (redis.client && redis.client.isReady) {
        await redis.client.setEx(`user:${userId}:status`, 300, newStatus);
        await redis.client.setEx(`user:${userId}:lastSeen`, 300, new Date().toISOString());
      }

      // Broadcast to all clients
      io.emit("user_status_change", {
        userId,
        status: newStatus,
        lastSeen: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error changing user status:", error);
      socket.emit("error", "Failed to update status");
    }
  };

  // Handle activity updates
  const handleActivityUpdate = async (activityData) => {
    try {
      const userId = getSocketUserId();
      if (!userId) return;

      const { type, name, details, state, emoji, endsAt } = activityData;

      if (!name || name.trim().length === 0) {
        socket.emit("error", "Activity name is required");
        return;
      }

      const validTypes = ["CUSTOM", "LISTENING", "WATCHING", "COMPETING", "STREAMING"];
      if (type && !validTypes.includes(type)) {
        socket.emit("error", "Invalid activity type");
        return;
      }

      const activity = {
        type: type || "CUSTOM",
        name: name.trim(),
        details: details?.trim() || null,
        state: state?.trim() || null,
        emoji: emoji || null,
        startedAt: new Date(),
        endsAt: endsAt ? new Date(endsAt) : null
      };

      // Save to database
      await db.userActivity.create({
        data: {
          userId,
          ...activity
        }
      });

      // Update user's current activity
      await db.user.update({
        where: { id: userId },
        data: {
          currentActivity: activity
        }
      });

      // Store in Redis
      if (redis.client && redis.client.isReady) {
        await redis.client.setEx(
          `user:${userId}:activity`,
          3600,
          JSON.stringify(activity)
        );
      }

      // Broadcast to all clients
      io.emit("user_activity_change", {
        userId,
        activity
      });

      socket.emit("activity_updated", { activity });
    } catch (error) {
      console.error("Error updating activity:", error);
      socket.emit("error", "Failed to update activity");
    }
  };

  // Handle activity clear
  const handleActivityClear = async () => {
    try {
      const userId = getSocketUserId();
      if (!userId) return;

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

      // Broadcast to all clients
      io.emit("user_activity_change", {
        userId,
        activity: null
      });

      socket.emit("activity_cleared");
    } catch (error) {
      console.error("Error clearing activity:", error);
      socket.emit("error", "Failed to clear activity");
    }
  };

  // Handle custom status update
  const handleCustomStatusUpdate = async (statusData) => {
    try {
      const userId = getSocketUserId();
      if (!userId) return;

      const { status, emoji, expiresAt } = statusData;

      if (!status || status.trim().length === 0) {
        socket.emit("error", "Status text is required");
        return;
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

      // Broadcast to all clients
      io.emit("user_custom_status_change", {
        userId,
        ...updateData
      });

      socket.emit("custom_status_updated", updateData);
    } catch (error) {
      console.error("Error updating custom status:", error);
      socket.emit("error", "Failed to update custom status");
    }
  };

  // Handle custom status clear
  const handleCustomStatusClear = async () => {
    try {
      const userId = getSocketUserId();
      if (!userId) return;

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

      // Broadcast to all clients
      io.emit("user_custom_status_change", {
        userId,
        customStatus: null,
        customStatusEmoji: null,
        customStatusExpiresAt: null
      });

      socket.emit("custom_status_cleared");
    } catch (error) {
      console.error("Error clearing custom status:", error);
      socket.emit("error", "Failed to clear custom status");
    }
  };

  // Get online users for a server
  const getServerOnlineUsers = async (serverId) => {
    try {
      const userId = getSocketUserId();
      if (!userId) return;

      // Get all members of the server
      const members = await db.serverMember.findMany({
        where: {
          serverId: serverId,
          isBanned: false
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              discriminator: true,
              avatar: true,
              status: true,
              lastSeen: true,
              customStatus: true,
              customStatusEmoji: true,
              currentActivity: true
            }
          }
        }
      });

      const onlineUsers = [];

      for (const member of members) {
        const user = member.user;
        if (!user) continue;

        let status = user.status || "offline";
        let lastSeen = user.lastSeen;
        let activity = user.currentActivity;
        let customStatus = user.customStatus;
        let customStatusEmoji = user.customStatusEmoji;

        // Check Redis for more recent data
        if (redis.client && redis.client.isReady) {
          try {
            const redisStatus = await redis.client.get(`user:${user.id}:status`);
            const redisLastSeen = await redis.client.get(`user:${user.id}:lastSeen`);
            const redisActivity = await redis.client.get(`user:${user.id}:activity`);
            const redisCustomStatus = await redis.client.get(`user:${user.id}:customStatus`);

            if (redisStatus) status = redisStatus;
            if (redisLastSeen) lastSeen = new Date(redisLastSeen);
            if (redisActivity) activity = JSON.parse(redisActivity);
            if (redisCustomStatus) {
              const parsed = JSON.parse(redisCustomStatus);
              customStatus = parsed.customStatus;
              customStatusEmoji = parsed.customStatusEmoji;
            }
          } catch (redisError) {
            console.error("Redis error:", redisError);
          }
        }

        onlineUsers.push({
          userId: user.id,
          username: user.username,
          discriminator: user.discriminator,
          avatar: user.avatar,
          status,
          lastSeen,
          customStatus,
          customStatusEmoji,
          activity
        });
      }

      socket.emit("server_online_users", { serverId, users: onlineUsers });
    } catch (error) {
      console.error("Error getting server online users:", error);
      socket.emit("error", "Failed to get online users");
    }
  };

  // Socket event handlers
  socket.on("user_online", () => {
    const userId = getSocketUserId();
    if (userId) {
      handleUserOnline(userId);
    }
  });

  socket.on("change_status", handleStatusChange);
  socket.on("update_activity", handleActivityUpdate);
  socket.on("clear_activity", handleActivityClear);
  socket.on("update_custom_status", handleCustomStatusUpdate);
  socket.on("clear_custom_status", handleCustomStatusClear);
  socket.on("get_server_online_users", getServerOnlineUsers);

  // Handle disconnect
  socket.on("disconnect", () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      handleUserOffline(userId);
    }
  });

  // Auto-mark user as online when they connect (if authenticated)
  const userId = getSocketUserId();
  if (userId) {
    handleUserOnline(userId);
  }
};
