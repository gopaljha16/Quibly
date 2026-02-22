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
    console.log(`[Call Socket] User ${normalizedUserId} joined room: ${userRoom}`);

    // Initiate a call
    socket.on('call:initiate', ({ toUserId, dmRoomId, hasVideo, fromUser }) => {
        console.log('📞 [Call Socket] call:initiate received:', {
            from: normalizedUserId,
            to: toUserId,
            dmRoomId,
            hasVideo,
            fromUser
        });
        
        const normalizedToUserId = String(toUserId);
        const targetRoom = `user:${normalizedToUserId}`;
        
        const callData = {
            fromUserId: normalizedUserId,
            fromUser: fromUser || { id: normalizedUserId, username: 'Someone' },
            dmRoomId,
            hasVideo
        };
        
        console.log(`📤 [Call Socket] Emitting call:incoming to room: ${targetRoom}`, callData);
        
        // Notify the target user
        io.to(targetRoom).emit('call:incoming', callData);
    });

    // Accept a call
    socket.on('call:accept', ({ fromUserId, dmRoomId }) => {
        console.log('✅ [Call Socket] call:accept received:', {
            from: normalizedUserId,
            originalCaller: fromUserId,
            dmRoomId
        });
        
        const normalizedFromUserId = String(fromUserId);
        const targetRoom = `user:${normalizedFromUserId}`;
        
        console.log(`📤 [Call Socket] Emitting call:accepted to room: ${targetRoom}`);
        
        // Notify the initiator
        io.to(targetRoom).emit('call:accepted', {
            toUserId: normalizedUserId,
            dmRoomId
        });
    });

    // Reject a call
    socket.on('call:reject', ({ fromUserId, dmRoomId }) => {
        console.log('❌ [Call Socket] call:reject received:', {
            from: normalizedUserId,
            originalCaller: fromUserId,
            dmRoomId
        });
        
        const normalizedFromUserId = String(fromUserId);
        const targetRoom = `user:${normalizedFromUserId}`;
        
        console.log(`📤 [Call Socket] Emitting call:rejected to room: ${targetRoom}`);
        
        // Notify the initiator
        io.to(targetRoom).emit('call:rejected', {
            toUserId: normalizedUserId,
            dmRoomId
        });
    });

    // End a call
    socket.on('call:end', ({ targetUserId, dmRoomId }) => {
        console.log('🔴 [Call Socket] call:end received:', {
            from: normalizedUserId,
            target: targetUserId,
            dmRoomId
        });
        
        const normalizedTargetUserId = String(targetUserId);
        const targetRoom = `user:${normalizedTargetUserId}`;
        
        console.log(`📤 [Call Socket] Emitting call:ended to room: ${targetRoom}`);
        
        // Notify the other party
        io.to(targetRoom).emit('call:ended', {
            fromUserId: normalizedUserId,
            dmRoomId
        });
    });

    // Signaling for busy state (optional but good)
    socket.on('call:busy', ({ fromUserId, dmRoomId }) => {
        console.log('⚠️ [Call Socket] call:busy received:', {
            from: normalizedUserId,
            originalCaller: fromUserId,
            dmRoomId
        });
        
        const normalizedFromUserId = String(fromUserId);
        const targetRoom = `user:${normalizedFromUserId}`;
        
        console.log(`📤 [Call Socket] Emitting call:busy to room: ${targetRoom}`);
        
        io.to(targetRoom).emit('call:busy', {
            toUserId: normalizedUserId,
            dmRoomId
        });
    });
};
