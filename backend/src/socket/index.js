const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

module.exports = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  // AUTH MIDDLEWARE
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
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
    console.log("🟢 Connected:", socket.user.id);

    require("./message.socket")(io, socket);
    require("./presence.socket")(io, socket);
  });
};