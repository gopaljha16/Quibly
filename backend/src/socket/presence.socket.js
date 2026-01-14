module.exports = (io, socket) => {

  socket.broadcast.emit("presence_update", {
    userId: socket.user.id,
    status: "online",
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("presence_update", {
      userId: socket.user.id,
      status: "offline",
    });
  });

};
