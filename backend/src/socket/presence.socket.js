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

      console.log(`User ${userId} is now online`);
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

          console.log(`User ${userId} is now offline`);
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

      console.log(`User ${userId} status changed to ${newStatus}`);
    } catch (error) {
      console.error("Error changing user status:", error);
      socket.emit("error", "Failed to update status");
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
              lastSeen: true
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

        // Check Redis for more recent status
        if (redis.client && redis.client.isReady) {
          try {
            const redisStatus = await redis.client.get(`user:${user.id}:status`);
            const redisLastSeen = await redis.client.get(`user:${user.id}:lastSeen`);
            
            if (redisStatus) status = redisStatus;
            if (redisLastSeen) lastSeen = new Date(redisLastSeen);
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
          lastSeen
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