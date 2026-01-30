const { PrismaClient } = require('@prisma/client');
const { generateToken, LIVEKIT_WS_URL } = require('../config/livekit');

const prisma = new PrismaClient();


//  generate LiveKit token for joining a voice channel

exports.getVoiceToken = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;

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
      return res.status(404).json({ error: 'Channel not found' });
    }

    if (channel.type !== 'VOICE') {
      return res.status(400).json({ error: 'Channel is not a voice channel' });
    }

    // Check if user is a member of the server
    if (channel.server.members.length === 0) {
      return res.status(403).json({ error: 'Not a member of this server' });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, avatar: true, discriminator: true },
    });

    // Generate token
    const token = generateToken(
      channelId,
      userId,
      {
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
      }
    );

    res.json({
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
    });
  } catch (error) {
    console.error('Error generating voice token:', error);
    res.status(500).json({ error: 'Failed to generate voice token' });
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
