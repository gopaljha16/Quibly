const { AccessToken } = require('livekit-server-sdk');

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL;

/**
 * Generate LiveKit access token for a user to join a room
 * @param {string} roomName - The room name (channel ID)
 * @param {string} participantName - The participant name (user ID)
 * @param {object} metadata - Additional metadata (username, avatar, etc.)
 * @returns {string} - JWT token
 */
function generateToken(roomName, participantName, metadata = {}) {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.error('LiveKit credentials missing:', {
      hasApiKey: !!LIVEKIT_API_KEY,
      hasApiSecret: !!LIVEKIT_API_SECRET,
      hasWsUrl: !!LIVEKIT_WS_URL
    });
    throw new Error('LiveKit credentials not configured');
  }

  console.log('Generating LiveKit token:', {
    roomName,
    participantName,
    apiKeyPrefix: LIVEKIT_API_KEY.substring(0, 6) + '...',
    wsUrl: LIVEKIT_WS_URL
  });

  try {
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      metadata: JSON.stringify(metadata),
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = at.toJwt();
    console.log('Token generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    throw error;
  }
}

module.exports = {
  generateToken,
  LIVEKIT_WS_URL,
};
