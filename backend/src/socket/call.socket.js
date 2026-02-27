module.exports = (io, socket) => {
    const userId = socket.userId;
    if (!userId) {
        console.error(`[Call Socket] Error: No userId found on socket ${socket.id}`);
        return;
    }

    const normalizedUserId = String(userId);
    const userRoom = `user:${normalizedUserId}`;

    // Make the user join their own private room for targeted messages
    socket.join(userRoom);

    // Initiate a call
    socket.on('call:initiate', ({ toUserId, dmRoomId, hasVideo, fromUser }) => {
        const normalizedToUserId = String(toUserId);
        const targetRoom = `user:${normalizedToUserId}`;

        const callData = {
            fromUserId: normalizedUserId,
            fromUser: fromUser || { id: normalizedUserId, username: 'Someone' },
            dmRoomId,
            hasVideo
        };

        // Notify the target user
        io.to(targetRoom).emit('call:incoming', callData);
    });

    // Accept a call
    socket.on('call:accept', ({ fromUserId, dmRoomId }) => {
        const normalizedFromUserId = String(fromUserId);
        const targetRoom = `user:${normalizedFromUserId}`;

        // Notify the initiator
        io.to(targetRoom).emit('call:accepted', {
            toUserId: normalizedUserId,
            dmRoomId
        });
    });

    // Reject a call
    socket.on('call:reject', ({ fromUserId, dmRoomId }) => {
        const normalizedFromUserId = String(fromUserId);
        const targetRoom = `user:${normalizedFromUserId}`;

        // Notify the initiator
        io.to(targetRoom).emit('call:rejected', {
            toUserId: normalizedUserId,
            dmRoomId
        });
    });

    // End a call
    socket.on('call:end', ({ targetUserId, dmRoomId }) => {
        const normalizedTargetUserId = String(targetUserId);
        const targetRoom = `user:${normalizedTargetUserId}`;

        // Notify the other party
        io.to(targetRoom).emit('call:ended', {
            fromUserId: normalizedUserId,
            dmRoomId
        });
    });

    // Signaling for busy state
    socket.on('call:busy', ({ fromUserId, dmRoomId }) => {
        const normalizedFromUserId = String(fromUserId);
        const targetRoom = `user:${normalizedFromUserId}`;

        io.to(targetRoom).emit('call:busy', {
            toUserId: normalizedUserId,
            dmRoomId
        });
    });
};
