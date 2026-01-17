const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

module.exports = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  // expose io so REST controllers can broadcast events
  global.io = io;

  // AUTH MIDDLEWARE
  io.use((socket, next) => {
    try {
      const cookie = socket.handshake.headers?.cookie || "";
      const cookieTokenMatch = cookie.match(/(?:^|;\s*)token=([^;]+)/);
      const token = socket.handshake.auth?.token || cookieTokenMatch?.[1];
      if (!token) return next(new Error("Unauthorized"));

      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }

    // // temp test
    // socket.user = { id: "507f1f77bcf86cd799439011" };
    // next();
  });

  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.user?._id || socket.user?.id);

    require("./message.socket")(io, socket);
    require("./presence.socket")(io, socket);

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected:", socket.user?._id || socket.user?.id);
    });
  });
};