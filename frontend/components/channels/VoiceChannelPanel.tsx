'use client';

import { Volume2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  LiveKitRoom, 
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { useState } from 'react';
import { apiGet } from '@/lib/api';

interface VoiceChannelPanelProps {
  channelId: string;
  channelName: string;
  currentUser: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export function VoiceChannelPanel({
  channelId,
  channelName,
  currentUser,
}: VoiceChannelPanelProps) {
  const [token, setToken] = useState<string>('');
  const [wsUrl, setWsUrl] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleJoinVoice = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      console.log('🎤 Requesting voice token for channel:', channelId);
      
      const response = await apiGet<{
        token: string;
        wsUrl: string;
        roomName: string;
        identity: string;
      }>(`/voice/token/${channelId}`);

      console.log('✅ Received voice token');
      setToken(response.token);
      setWsUrl(response.wsUrl);
      setIsConnected(true);
    } catch (err: any) {
      console.error('❌ Failed to get voice token:', err);
      setError(err.message || 'Failed to connect to voice channel');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setToken('');
    setWsUrl('');
    setIsConnected(false);
  };

  // Show join button if not connected
  if (!isConnected || !token) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-900">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-zinc-800 flex items-center justify-center">
            <Volume2 className="h-10 w-10 text-zinc-400" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {channelName}
            </h2>
            <p className="text-zinc-400">
              Join the voice channel to start talking with others
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={handleJoinVoice}
            disabled={isConnecting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isConnecting ? 'Connecting...' : 'Join Voice Channel'}
          </Button>
        </div>
      </div>
    );
  }

  // Show LiveKit video conference when connected
  return (
    <div className="flex-1 flex flex-col bg-zinc-900">
      {/* Voice Channel Header */}
      <div className="border-b border-zinc-800 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
              <Volume2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{channelName}</h2>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Users className="h-3.5 w-3.5" />
                <span>Voice Connected</span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleDisconnect}
            variant="destructive"
            size="sm"
          >
            Disconnect
          </Button>
        </div>
      </div>

      {/* LiveKit Video Conference */}
      <div className="flex-1 relative overflow-hidden bg-zinc-950">
        <LiveKitRoom
          video={false}
          audio={true}
          token={token}
          serverUrl={wsUrl}
          connect={true}
          style={{ height: '100%' }}
          data-lk-theme="default"
          onConnected={() => console.log('🟢 LiveKit connected')}
          onDisconnected={() => {
            console.log('🔴 LiveKit disconnected');
            handleDisconnect();
          }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}
