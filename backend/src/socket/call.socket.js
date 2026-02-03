module.exports = (io, socket) => {
    const userId = socket.userId;
    if (!userId) {
        console.error(`[Socket] Error: No userId found on socket ${socket.id}`);
        return;
    }

    const normalizedUserId = String(userId);
    // Make the user join their own private room for targeted messages
    socket.join(`user:${normalizedUserId}`);

    // Initiate a call
    socket.on('call:initiate', ({ toUserId, dmRoomId, hasVideo, fromUser }) => {
        const normalizedToUserId = String(toUserId);

        // Notify the target user
        const targetRoom = `user:${normalizedToUserId}`;
        io.to(targetRoom).emit('call:incoming', {
            fromUserId: normalizedUserId,
            fromUser: fromUser || { id: normalizedUserId, username: 'Someone' },
            dmRoomId,
            hasVideo
        });
    });

    // Accept a call
    socket.on('call:accept', ({ fromUserId, dmRoomId }) => {
        const normalizedFromUserId = String(fromUserId);

        // Notify the initiator
        io.to(`user:${normalizedFromUserId}`).emit('call:accepted', {
            toUserId: normalizedUserId,
            dmRoomId
        });
    });

    // Reject a call
    socket.on('call:reject', ({ fromUserId, dmRoomId }) => {
        const normalizedFromUserId = String(fromUserId);

        // Notify the initiator
        io.to(`user:${normalizedFromUserId}`).emit('call:rejected', {
            toUserId: normalizedUserId,
            dmRoomId
        });
    });

    // End a call
    socket.on('call:end', ({ targetUserId, dmRoomId }) => {
        const normalizedTargetUserId = String(targetUserId);

        // Notify the other party
        io.to(`user:${normalizedTargetUserId}`).emit('call:ended', {
            fromUserId: normalizedUserId,
            dmRoomId
        });
    });

    // Signaling for busy state (optional but good)
    socket.on('call:busy', ({ fromUserId, dmRoomId }) => {
        const normalizedFromUserId = String(fromUserId);
        io.to(`user:${normalizedFromUserId}`).emit('call:busy', {
            toUserId: normalizedUserId,
            dmRoomId
        });
    });
};
