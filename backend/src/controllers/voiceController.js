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
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking voice leave:', error);
    res.status(500).json({ success: false });
  }
};
