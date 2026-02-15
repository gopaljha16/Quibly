const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const jwt = require("jsonwebtoken");
const redis = require("../config/redis");

module.exports = (httpServer) => {
  // Parse FRONTEND_URL to support multiple origins
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:3000'];

  const io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          // In development, allow all origins
          if (process.env.NODE_ENV === 'development') {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      },
      credentials: true,
      methods: ['GET', 'POST']
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
      const adapter = createAdapter(pubClient, subClient);
      io.adapter(adapter);
      console.log(`✅ Socket.IO Redis adapter enabled (Server: ${redis.getServerId()})`);
      console.log(`   This enables cross-server communication for calls and messages`);
      
      // Log adapter events for debugging
      io.of("/").adapter.on("create-room", (room) => {
        console.log(`[Redis Adapter] Room created: ${room}`);
      });
      
      io.of("/").adapter.on("join-room", (room, id) => {
        console.log(`[Redis Adapter] Socket ${id} joined room: ${room}`);
      });
      
      io.of("/").adapter.on("leave-room", (room, id) => {
        console.log(`[Redis Adapter] Socket ${id} left room: ${room}`);
      });
    } else {
      console.warn('⚠️  Redis Pub/Sub clients not available - running in single-server mode');
      console.warn('   Calls between users on different servers will NOT work!');
    }
  } else {
    console.warn('⚠️  Redis not connected - Socket.IO running in single-server mode');
    console.warn('   Calls between users on different servers will NOT work!');
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
    
    console.log(`[Socket.IO] User ${socket.userId} connected to server ${redis.getServerId()} (socket: ${socket.id})`);

    require("./message.socket")(io, socket);
    require("./presence.socket")(io, socket);
    require("./voice.socket")(io, socket);
    require("./call.socket")(io, socket);
    require("./typing.socket")(io, socket);

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] User ${socket.userId} disconnected from server ${redis.getServerId()}`);
    });
  });

  return io;
};