const { AccessToken } = require('livekit-server-sdk');

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL;

// Log on module load to verify env vars are available
console.log('LiveKit module loaded:', {
  hasApiKey: !!LIVEKIT_API_KEY,
  hasApiSecret: !!LIVEKIT_API_SECRET,
  hasWsUrl: !!LIVEKIT_WS_URL,
  apiKeyPrefix: LIVEKIT_API_KEY ? LIVEKIT_API_KEY.substring(0, 10) + '...' : 'NOT SET'
});

/**
 * Generate LiveKit access token for a user to join a room
 * @param {string} roomName - The room name (channel ID)
 * @param {string} participantName - The participant name (user ID)
 * @param {object} metadata - Additional metadata (username, avatar, etc.)
 * @returns {Promise<string>} - JWT token
 */
async function generateToken(roomName, participantName, metadata = {}) {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_WS_URL) {
    const error = new Error('LiveKit credentials not configured. Please check your .env file.');
    console.error('❌ LiveKit credentials missing:', {
      hasApiKey: !!LIVEKIT_API_KEY,
      hasApiSecret: !!LIVEKIT_API_SECRET,
      hasWsUrl: !!LIVEKIT_WS_URL,
    });
    throw error;
  }

  console.log('Generating LiveKit token:', {
    roomName,
    participantName,
    participantUsername: metadata.username,
    apiKeyPrefix: LIVEKIT_API_KEY.substring(0, 10) + '...',
    apiKeyLength: LIVEKIT_API_KEY.length,
    secretLength: LIVEKIT_API_SECRET.length,
    wsUrl: LIVEKIT_WS_URL
  });

  try {
    // Verify AccessToken is available
    if (!AccessToken) {
      throw new Error('AccessToken class not found in livekit-server-sdk');
    }

    // Create access token with proper options
    const at = new AccessToken(
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
      {
        identity: participantName,
        name: metadata.username || participantName,
      }
    );

    // Add video grant with proper permissions
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
    });

    // toJwt() returns a Promise in newer versions
    const token = await at.toJwt();
    
    console.log('Token generated successfully:', {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + '...',
    });
    
    return token;
  } catch (error) {
    console.error('❌ Error generating LiveKit token:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to generate LiveKit token: ${error.message}`);
  }
}

module.exports = {
  generateToken,
  LIVEKIT_WS_URL,
};
