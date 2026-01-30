const redis = require('../config/redis');

module.exports = (io, socket) => {
  // User joins voice channel
  socket.on('voice:join', async ({ channelId, userId, username, avatar }) => {
    try {
      const participantsKey = `voice:${channelId}:participants`;
      const userDataKey = `voice:${channelId}:user:${userId}`;

      // Add user to participants set
      await redis.sadd(participantsKey, userId);

      // Store user data
      await redis.hset(userDataKey, {
        userId,
        username,
        avatar: avatar || '',
        joinedAt: Date.now(),
        muted: false,
        deafened: false,
        video: false,
        screenshare: false,
      });

      // Join socket room
      socket.join(`voice:${channelId}`);

      // Get all participants
      const participants = await redis.smembers(participantsKey);
      const participantData = await Promise.all(
        participants.map(async (id) => {
          const data = await redis.hgetall(`voice:${channelId}:user:${id}`);
          return {
            userId: data.userId,
            username: data.username,
            avatar: data.avatar,
            muted: data.muted === 'true',
            deafened: data.deafened === 'true',
            video: data.video === 'true',
            screenshare: data.screenshare === 'true',
          };
        })
      );

      // Notify all users in the channel
      io.to(`voice:${channelId}`).emit('voice:user-joined', {
        channelId,
        userId,
        username,
        avatar,
        participants: participantData,
      });

      console.log(`User ${username} joined voice channel ${channelId}`);
    } catch (error) {
      console.error('Error joining voice channel:', error);
      socket.emit('voice:error', { message: 'Failed to join voice channel' });
    }
  });

  // User leaves voice channel
  socket.on('voice:leave', async ({ channelId, userId }) => {
    try {
      const participantsKey = `voice:${channelId}:participants`;
      const userDataKey = `voice:${channelId}:user:${userId}`;

      // Remove user from participants
      await redis.srem(participantsKey, userId);
      await redis.del(userDataKey);

      // Leave socket room
      socket.leave(`voice:${channelId}`);

      // Get remaining participants
      const participants = await redis.smembers(participantsKey);

      // Notify all users in the channel
      io.to(`voice:${channelId}`).emit('voice:user-left', {
        channelId,
        userId,
        participants,
      });

      console.log(`User ${userId} left voice channel ${channelId}`);
    } catch (error) {
      console.error('Error leaving voice channel:', error);
    }
  });

  // Update voice state (mute, video, etc.)
  socket.on('voice:state-update', async ({ channelId, userId, state }) => {
    try {
      const userDataKey = `voice:${channelId}:user:${userId}`;

      // Update user state
      if (state.muted !== undefined) {
        await redis.hset(userDataKey, 'muted', state.muted);
      }
      if (state.deafened !== undefined) {
        await redis.hset(userDataKey, 'deafened', state.deafened);
      }
      if (state.video !== undefined) {
        await redis.hset(userDataKey, 'video', state.video);
      }
      if (state.screenshare !== undefined) {
        await redis.hset(userDataKey, 'screenshare', state.screenshare);
      }

      // Notify all users in the channel
      io.to(`voice:${channelId}`).emit('voice:state-changed', {
        channelId,
        userId,
        state,
      });

      console.log(`Voice state updated for user ${userId} in channel ${channelId}:`, state);
    } catch (error) {
      console.error('Error updating voice state:', error);
    }
  });

  // Handle disconnect - cleanup voice channels
  socket.on('disconnect', async () => {
    try {
      // Find all voice channels this user was in and remove them
      const keys = await redis.keys('voice:*:participants');
      for (const key of keys) {
        const channelId = key.split(':')[1];
        const participants = await redis.smembers(key);
        
        // Check if socket's user was in this channel
        if (socket.userId && participants.includes(socket.userId)) {
          await redis.srem(key, socket.userId);
          await redis.del(`voice:${channelId}:user:${socket.userId}`);
          
          io.to(`voice:${channelId}`).emit('voice:user-left', {
            channelId,
            userId: socket.userId,
            participants: await redis.smembers(key),
          });
        }
      }
    } catch (error) {
      console.error('Error handling voice disconnect:', error);
    }
  });
};
