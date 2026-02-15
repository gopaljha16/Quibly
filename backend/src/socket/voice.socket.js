const redis = require('../config/redis');

module.exports = (io, socket) => {
  // User joins voice channel
  socket.on('voice:join', async ({ channelId, userId, username, avatar }) => {
    try {
      console.log(`📥 voice:join event received:`, { channelId, userId, username });
      
      const participantsKey = `voice:${channelId}:participants`;
      const userDataKey = `voice:${channelId}:user:${userId}`;

      // Check if user is already in this channel
      const alreadyInChannel = await redis.sismember(participantsKey, userId);
      if (alreadyInChannel) {
        console.log(`⚠️ User ${username} already in channel ${channelId}, skipping duplicate join`);
        
        // Still send current participants to the socket
        const participants = await redis.smembers(participantsKey);
        const participantData = await Promise.all(
          participants.map(async (id) => {
            const data = await redis.hgetall(`voice:${channelId}:user:${id}`);
            if (!data || !data.userId) return null;
            return {
              userId: data.userId,
              username: data.username,
              avatar: data.avatar,
              muted: data.muted === 'true',
              deafened: data.deafened === 'true',
              video: data.video === 'true',
              streaming: data.streaming === 'true',
            };
          })
        );
        const validParticipants = participantData.filter(p => p !== null);
        
        socket.emit('voice:participants', {
          channelId,
          participants: validParticipants,
        });
        
        return;
      }

      // Add user to participants set
      await redis.sadd(participantsKey, userId);

      // Store user data - Redis HSET requires string values
      await redis.hset(userDataKey, {
        userId: String(userId),
        username: String(username),
        avatar: String(avatar || ''),
        joinedAt: String(Date.now()),
        muted: 'false',
        deafened: 'false',
        video: 'false',
        streaming: 'false',
      });

      // Store socket.userId for cleanup on disconnect
      socket.userId = userId;

      // Join socket room
      socket.join(`voice:${channelId}`);
      console.log(`✅ User ${username} joined socket room: voice:${channelId}`);

      // Get all participants
      const participants = await redis.smembers(participantsKey);
      const participantData = await Promise.all(
        participants.map(async (id) => {
          const data = await redis.hgetall(`voice:${channelId}:user:${id}`);
          if (!data || !data.userId) return null;
          return {
            userId: data.userId,
            username: data.username,
            avatar: data.avatar,
            muted: data.muted === 'true',
            deafened: data.deafened === 'true',
            video: data.video === 'true',
            streaming: data.streaming === 'true',
          };
        })
      );

      // Filter out null values
      const validParticipants = participantData.filter(p => p !== null);

      console.log(`📡 Emitting voice:user-joined to room voice:${channelId}`, {
        participantCount: validParticipants.length,
        newUser: username
      });

      // Notify all users in the channel (using both room and global broadcast)
      io.to(`voice:${channelId}`).emit('voice:user-joined', {
        channelId,
        userId,
        participant: {
          userId,
          username,
          avatar,
          muted: false,
          deafened: false,
          video: false,
          streaming: false,
        },
        participants: validParticipants,
      });
      
      // Also emit globally to ensure all clients get the update
      io.emit('voice:participants-update', {
        channelId,
        participants: validParticipants,
      });

      console.log(`✅ User ${username} joined voice channel ${channelId} (${validParticipants.length} total participants)`);
    } catch (error) {
      console.error('❌ Error joining voice channel:', error);
      socket.emit('voice:error', { message: 'Failed to join voice channel' });
    }
  });

  // Get current participants in a voice channel
  socket.on('voice:get-participants', async ({ channelId, serverId }) => {
    try {
      const participantsKey = `voice:${channelId}:participants`;
      const participants = await redis.smembers(participantsKey);
      
      const participantData = await Promise.all(
        participants.map(async (id) => {
          const data = await redis.hgetall(`voice:${channelId}:user:${id}`);
          if (!data || !data.userId) return null;
          return {
            userId: data.userId,
            username: data.username,
            avatar: data.avatar,
            muted: data.muted === 'true',
            deafened: data.deafened === 'true',
            video: data.video === 'true',
            streaming: data.streaming === 'true',
          };
        })
      );

      // Filter out null values
      const validParticipants = participantData.filter(p => p !== null);

      socket.emit('voice:participants', {
        channelId,
        participants: validParticipants,
      });

      console.log(`Sent ${validParticipants.length} participants for channel ${channelId}`);
    } catch (error) {
      console.error('Error getting voice participants:', error);
      socket.emit('voice:error', { message: 'Failed to get participants' });
    }
  });

  // User leaves voice channel
  socket.on('voice:leave', async ({ channelId, userId }) => {
    try {
      const participantsKey = `voice:${channelId}:participants`;
      const userDataKey = `voice:${channelId}:user:${userId}`;

      // Get user data before removing
      const userData = await redis.hgetall(userDataKey);
      const username = userData?.username || 'Unknown';

      // Remove user from participants
      await redis.srem(participantsKey, userId);
      await redis.del(userDataKey);

      // Leave socket room
      socket.leave(`voice:${channelId}`);

      // Clear socket.userId if this is the user leaving
      if (socket.userId === userId) {
        socket.userId = null;
      }

      // Get remaining participants
      const participants = await redis.smembers(participantsKey);
      const participantData = await Promise.all(
        participants.map(async (id) => {
          const data = await redis.hgetall(`voice:${channelId}:user:${id}`);
          if (!data || !data.userId) return null;
          return {
            userId: data.userId,
            username: data.username,
            avatar: data.avatar,
            muted: data.muted === 'true',
            deafened: data.deafened === 'true',
            video: data.video === 'true',
            streaming: data.streaming === 'true',
          };
        })
      );

      const validParticipants = participantData.filter(p => p !== null);

      // Notify all users in the channel AND the user who left
      io.to(`voice:${channelId}`).emit('voice:user-left', {
        channelId,
        userId,
        participants: validParticipants,
      });

      // Also emit to the socket that's leaving to ensure they get the update
      socket.emit('voice:user-left', {
        channelId,
        userId,
        participants: validParticipants,
      });
      
      // Global broadcast to ensure all clients get the update
      io.emit('voice:participants-update', {
        channelId,
        participants: validParticipants,
      });

      console.log(`✅ User ${username} (${userId}) left voice channel ${channelId}`);
    } catch (error) {
      console.error('❌ Error leaving voice channel:', error);
    }
  });

  // Update voice state (mute, video, etc.)
  socket.on('voice:state-update', async ({ channelId, userId, state }) => {
    try {
      const userDataKey = `voice:${channelId}:user:${userId}`;

      // Check if user exists in this channel
      const exists = await redis.exists(userDataKey);
      if (!exists) {
        console.warn(`⚠️ User ${userId} not found in channel ${channelId}`);
        return;
      }

      // Update user state - Convert booleans to strings for Redis
      if (state.muted !== undefined) {
        await redis.hset(userDataKey, 'muted', String(state.muted));
      }
      if (state.deafened !== undefined) {
        await redis.hset(userDataKey, 'deafened', String(state.deafened));
      }
      if (state.video !== undefined) {
        await redis.hset(userDataKey, 'video', String(state.video));
      }
      if (state.streaming !== undefined) {
        await redis.hset(userDataKey, 'streaming', String(state.streaming));
      }

      // Notify all users in the channel
      io.to(`voice:${channelId}`).emit('voice:state-changed', {
        channelId,
        userId,
        state,
      });

      console.log(`✅ Voice state updated for user ${userId} in channel ${channelId}:`, state);
    } catch (error) {
      console.error('❌ Error updating voice state:', error);
    }
  });

  // Handle disconnect - cleanup voice channels
  socket.on('disconnect', async () => {
    try {
      if (!socket.userId) return;

      console.log(`🔌 Socket disconnected for user ${socket.userId}`);

      // Find all voice channels this user was in and remove them
      const keys = await redis.keys('voice:*:participants');
      for (const key of keys) {
        const channelId = key.split(':')[1];
        const participants = await redis.smembers(key);
        
        // Check if socket's user was in this channel
        if (participants.includes(socket.userId)) {
          const userDataKey = `voice:${channelId}:user:${socket.userId}`;
          const userData = await redis.hgetall(userDataKey);
          
          await redis.srem(key, socket.userId);
          await redis.del(userDataKey);
          
          // Get remaining participants
          const remainingParticipants = await redis.smembers(key);
          const participantData = await Promise.all(
            remainingParticipants.map(async (id) => {
              const data = await redis.hgetall(`voice:${channelId}:user:${id}`);
              if (!data || !data.userId) return null;
              return {
                userId: data.userId,
                username: data.username,
                avatar: data.avatar,
                muted: data.muted === 'true',
                deafened: data.deafened === 'true',
                video: data.video === 'true',
                streaming: data.streaming === 'true',
              };
            })
          );

          const validParticipants = participantData.filter(p => p !== null);
          
          io.to(`voice:${channelId}`).emit('voice:user-left', {
            channelId,
            userId: socket.userId,
            participants: validParticipants,
          });

          console.log(`✅ Cleaned up user ${userData?.username || socket.userId} from voice channel ${channelId} on disconnect`);
        }
      }
    } catch (error) {
      console.error('❌ Error handling voice disconnect:', error);
    }
  });

  // Handle force move to another voice channel
  socket.on('voice:accept-move', async ({ fromChannelId, toChannelId, userId }) => {
    try {
      console.log(`🔄 voice:accept-move received:`, { fromChannelId, toChannelId, userId });

      // Leave current channel if specified
      if (fromChannelId) {
        const participantsKey = `voice:${fromChannelId}:participants`;
        const userDataKey = `voice:${fromChannelId}:user:${userId}`;

        // Get user data before removing
        const userData = await redis.hgetall(userDataKey);
        const username = userData?.username || 'Unknown';

        console.log(`Removing ${username} from channel ${fromChannelId}`);

        await redis.srem(participantsKey, userId);
        await redis.del(userDataKey);

        socket.leave(`voice:${fromChannelId}`);

        // Get remaining participants in old channel
        const remainingParticipants = await redis.smembers(participantsKey);
        const participantData = await Promise.all(
          remainingParticipants.map(async (id) => {
            const data = await redis.hgetall(`voice:${fromChannelId}:user:${id}`);
            if (!data || !data.userId) return null;
            return {
              userId: data.userId,
              username: data.username,
              avatar: data.avatar,
              muted: data.muted === 'true',
              deafened: data.deafened === 'true',
              video: data.video === 'true',
              streaming: data.streaming === 'true',
            };
          })
        );

        const validParticipants = participantData.filter(p => p !== null);

        console.log(`📡 Emitting voice:user-left to room voice:${fromChannelId}`, {
          remainingCount: validParticipants.length,
          leftUser: username
        });

        // Notify everyone in the OLD channel that user left
        io.to(`voice:${fromChannelId}`).emit('voice:user-left', {
          channelId: fromChannelId,
          userId,
          participants: validParticipants,
        });

        console.log(`✅ User ${username} (${userId}) left voice channel ${fromChannelId} (${validParticipants.length} remaining)`);
      }

      console.log(`✅ User ${userId} move accepted, ready to join ${toChannelId}`);
    } catch (error) {
      console.error('❌ Error handling voice move:', error);
    }
  });
};
