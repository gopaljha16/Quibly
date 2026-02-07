const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const jwt = require("jsonwebtoken");
const redis = require("../config/redis");

module.exports = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
    // Connection settings for better reliability
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Setup Redis adapter for cross-server broadcasting
  if (redis.isConnected()) {
    const pubClient = redis.getPubClient();
    const subClient = redis.getSubClient();

    if (pubClient && subClient) {
      io.adapter(createAdapter(pubClient, subClient));
      console.log(`✅ Socket.IO Redis adapter enabled (Server: ${redis.getServerId()})`);
    } else {
      console.warn('⚠️  Redis Pub/Sub clients not available - running in single-server mode');
    }
  } else {
    console.warn('⚠️  Redis not connected - Socket.IO running in single-server mode');
  }

  // expose io so REST controllers can broadcast events
  global.io = io;

  // AUTH MIDDLEWARE
  io.use((socket, next) => {
    try {
      const cookie = socket.handshake.headers?.cookie || "";
      const cookieTokenMatch = cookie.match(/(?:^|;\s*)token=([^;]+)/);
      const token = socket.handshake.auth?.token || cookieTokenMatch?.[1];
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // The JWT payload has { userId: '...' }
      socket.user = { id: decoded.userId };
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }

    // // temp test
    // socket.user = { id: "507f1f77bcf86cd799439011" };
    // next();
  });

  io.on("connection", (socket) => {
    // Store userId on socket for voice disconnect handling
    socket.userId = socket.user.id;

    require("./message.socket")(io, socket);
    require("./presence.socket")(io, socket);
    require("./voice.socket")(io, socket);
    require("./call.socket")(io, socket);
    require("./typing.socket")(io, socket);

    socket.on("disconnect", () => {
      // Silent disconnect
    });
  });

  return io;
};