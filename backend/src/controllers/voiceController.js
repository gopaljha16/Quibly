const prisma = require('../config/db');
const { generateToken, LIVEKIT_WS_URL } = require('../config/livekit');



//  generate LiveKit token for joining a voice channel

exports.getVoiceToken = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;

    console.log('🎤 Voice token requested:', { channelId, userId });

    // Verify channel exists and is a voice channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        server: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!channel) {
      console.log('❌ Channel not found:', channelId);
      return res.status(404).json({ error: 'Channel not found' });
    }

    console.log('✅ Channel found:', { name: channel.name, type: channel.type });

    if (channel.type !== 'VOICE') {
      console.log('❌ Channel is not a voice channel:', channel.type);
      return res.status(400).json({ error: 'Channel is not a voice channel' });
    }

    // Check if user is a member of the server
    if (channel.server.members.length === 0) {
      console.log('❌ User is not a member of the server');
      return res.status(403).json({ error: 'Not a member of this server' });
    }

    console.log('✅ User is a member of the server');

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, avatar: true, discriminator: true },
    });

    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User details retrieved:', { username: user.username });

    // Generate token
    console.log('🔑 Generating LiveKit token...');
    let token;
    try {
      token = await generateToken(
        channelId,
        userId,
        {
          username: user.username,
          discriminator: user.discriminator,
          avatar: user.avatar,
        }
      );
    } catch (tokenError) {
      console.error('❌ Token generation failed:', tokenError);
      return res.status(500).json({
        error: 'Failed to generate voice token',
        details: tokenError.message,
        hint: 'Check LiveKit credentials in .env file'
      });
    }

    const response = {
      token,
      wsUrl: LIVEKIT_WS_URL,
      roomName: channelId,
      identity: userId,
      user: {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
      },
    };

    console.log('✅ Sending voice token response:', {
      wsUrl: response.wsUrl,
      roomName: response.roomName,
      identity: response.identity,
      tokenLength: token.length
    });

    res.json(response);
  } catch (error) {
    console.error('❌ Error generating voice token:', error);
    res.status(500).json({ error: 'Failed to generate voice token', details: error.message });
  }
};


exports.getVoiceParticipants = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;

    // Verify channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        server: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    if (channel.server.members.length === 0) {
      return res.status(403).json({ error: 'Not a member of this server' });
    }

    // Get participants from Redis (stored by socket events)
    const redis = require('../config/redis');
    const participantsKey = `voice:${channelId}:participants`;
    const participants = await redis.smembers(participantsKey);

    // Get user details for participants
    const users = await prisma.user.findMany({
      where: {
        id: { in: participants },
      },
      select: {
        id: true,
        username: true,
        discriminator: true,
        avatar: true,
        status: true,
      },
    });

    res.json({ participants: users });
  } catch (error) {
    console.error('Error getting voice participants:', error);
    res.status(500).json({ error: 'Failed to get participants' });
  }
};

// Track voice join
exports.trackVoiceJoin = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;

    // Start a new session
    await prisma.userActivitySession.create({
      data: {
        userId,
        type: 'VOICE',
        metadata: { channelId }
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking voice join:', error);
    res.status(500).json({ success: false });
  }
};

// Track voice leave
exports.trackVoiceLeave = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find recent open session
    const session = await prisma.userActivitySession.findFirst({
      where: {
        userId,
        type: 'VOICE',
        endTime: null
      },
      orderBy: { startTime: 'desc' }
    });

    if (session) {
      const endTime = new Date();
      const durationMs = endTime.getTime() - session.startTime.getTime();
      const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60)));

      // Close session
      await prisma.userActivitySession.update({
        where: { id: session.id },
        data: { endTime }
      });

      // Update user total stats
      await prisma.user.update({
        where: { id: userId },
        data: { voiceTimeMinutes: { increment: durationMinutes } }
      });

      // Update daily heatmap (weighted activity)
      await prisma.userDailyActivity.upsert({
        where: {
          userId_date: {
            userId,
            date: today
          }
        },
        update: {
          count: { increment: Math.ceil(durationMinutes / 10) }, // 1 activity count per 10 mins
          voiceMinutes: { increment: durationMinutes }
        },
        create: {
          userId: req.user.id,
          date: today,
          count: Math.ceil(durationMinutes / 10),
          voiceMinutes: durationMinutes
        }
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking voice leave:', error);
    res.status(500).json({ success: false });
  }
};

// Move user to another voice channel (moderator/owner only)
exports.moveUserToVoiceChannel = async (req, res) => {
  try {
    const { targetUserId, targetChannelId } = req.body;
    const moderatorId = req.user.id;

    console.log('🔄 Voice move requested:', { targetUserId, targetChannelId, moderatorId });

    // Verify target channel exists and is a voice channel
    const targetChannel = await prisma.channel.findUnique({
      where: { id: targetChannelId },
      include: {
        server: {
          include: {
            members: {
              where: { userId: moderatorId }
            },
            roles: true
          }
        }
      }
    });

    if (!targetChannel) {
      console.log('❌ Target channel not found');
      return res.status(404).json({ error: 'Target channel not found' });
    }

    if (targetChannel.type !== 'VOICE') {
      console.log('❌ Target channel is not a voice channel');
      return res.status(400).json({ error: 'Target channel is not a voice channel' });
    }

    // Check if moderator has permission (owner or moderator role)
    const moderatorMember = targetChannel.server.members[0];
    if (!moderatorMember) {
      console.log('❌ Moderator is not a member of this server');
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    const isOwner = targetChannel.server.ownerId === moderatorId;
    const MOVE_MEMBERS = 1 << 23; // 8388608
    const ADMINISTRATOR = 1 << 24; // 16777216
    
    // Get moderator's highest role permissions
    let rolePermissions = 0;
    if (moderatorMember.roleIds && moderatorMember.roleIds.length > 0) {
      const memberRoles = targetChannel.server.roles.filter(r => 
        moderatorMember.roleIds.includes(r.id)
      );
      // Combine all role permissions with OR
      rolePermissions = memberRoles.reduce((acc, role) => acc | role.permissions, 0);
    }
    
    const hasPermission = isOwner || 
                         (rolePermissions & ADMINISTRATOR) === ADMINISTRATOR ||
                         (rolePermissions & MOVE_MEMBERS) === MOVE_MEMBERS;

    if (!hasPermission) {
      console.log('❌ Moderator does not have permission');
      return res.status(403).json({ error: 'You do not have permission to move members' });
    }

    console.log('✅ Permission check passed');

    // Verify target user is a member of the server
    const targetMember = await prisma.serverMember.findFirst({
      where: {
        userId: targetUserId,
        serverId: targetChannel.serverId
      },
      include: { user: true }
    });

    if (!targetMember) {
      console.log('❌ Target user is not a member of this server');
      return res.status(404).json({ error: 'Target user is not a member of this server' });
    }

    console.log('✅ Target user is a server member:', targetMember.user.username);

    // Get socket.io instance to emit the move event
    const io = global.io;
    if (!io) {
      console.error('❌ Socket.io instance not found');
      return res.status(500).json({ 
        error: 'Voice service unavailable',
        details: 'Socket.io not initialized'
      });
    }

    console.log('✅ Emitting voice:force-move event');
    
    // Find the target user's socket(s) and emit directly to them
    const sockets = await io.fetchSockets();
    let targetSocketFound = false;
    
    console.log(`🔍 Searching for target user ${targetUserId} among ${sockets.length} connected sockets`);
    
    for (const socket of sockets) {
      const socketUserId = socket.userId || socket.user?.id || socket.data?.userId;
      console.log(`  Checking socket: ${socket.id}, userId: ${socketUserId}`);
      
      // Check if this socket belongs to the target user
      if (socketUserId === targetUserId) {
        console.log('🎯 Found target user socket, emitting directly to socket:', socket.id);
        socket.emit('voice:force-move', {
          userId: targetUserId,
          targetChannelId,
          targetChannelName: targetChannel.name,
          serverId: targetChannel.serverId,
          movedBy: {
            id: moderatorId,
            username: req.user.username
          }
        });
        targetSocketFound = true;
      }
    }
    
    if (!targetSocketFound) {
      console.log('⚠️ Target user socket not found - user may be offline');
      console.log('💡 User will be moved when they next connect to voice');
      
      // Still broadcast globally in case they connect soon
      io.emit('voice:force-move', {
        userId: targetUserId,
        targetChannelId,
        targetChannelName: targetChannel.name,
        serverId: targetChannel.serverId,
        movedBy: {
          id: moderatorId,
          username: req.user.username
        }
      });
    }

    console.log('📡 Successfully emitted voice:force-move event', { targetSocketFound });

    res.json({ 
      success: true,
      message: `${targetSocketFound ? 'Moving' : 'Will move'} ${targetMember.user.username} to ${targetChannel.name}${targetSocketFound ? '' : ' when they connect'}`,
      toChannelId: targetChannelId,
      userOnline: targetSocketFound
    });
  } catch (error) {
    console.error('❌ Error moving user to voice channel:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to move user', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
