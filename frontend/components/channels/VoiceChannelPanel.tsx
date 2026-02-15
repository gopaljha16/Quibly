'use client';

import { Volume2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  LiveKitRoom, 
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import { useSocket } from '@/providers/SocketProvider';
import { useRouter } from 'next/navigation';

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
  const { socket } = useSocket();
  const [currentChannelId, setCurrentChannelId] = useState(channelId);
  const router = useRouter();
  
  // Check for pending voice move on mount
  useEffect(() => {
    const voiceMoveData = sessionStorage.getItem('voiceMove');
    if (voiceMoveData) {
      try {
        const moveData = JSON.parse(voiceMoveData);
        console.log('🔍 Found pending voice move in sessionStorage:', moveData);
        
        // Check if this move is for the current user
        if (moveData.userId === currentUser.id) {
          // Check if move is recent (within last 60 seconds - increased from 10)
          const age = Date.now() - moveData.timestamp;
          if (age < 60000) {
            console.log('✅ Processing pending voice move (age:', age, 'ms)');
            
            // Clear the stored move
            sessionStorage.removeItem('voiceMove');
            
            // Show alert
            alert(`You are being moved to ${moveData.targetChannelName} by ${moveData.movedBy.username}`);
            
            // Store auto-join flag
            sessionStorage.setItem('autoJoinVoiceChannel', moveData.targetChannelId);
            
            // Navigate to target channel
            const currentPath = window.location.pathname;
            const serverIdMatch = currentPath.match(/\/channels\/([^\/]+)/);
            const serverId = serverIdMatch ? serverIdMatch[1] : moveData.serverId;
            
            const targetUrl = serverId && serverId !== '@me' 
              ? `/channels/${serverId}/${moveData.targetChannelId}`
              : `/channels/${moveData.targetChannelId}`;
            
            console.log('🔀 Navigating to:', targetUrl);
            router.push(targetUrl);
          } else {
            console.log('⏰ Voice move too old, ignoring (age:', age, 'ms)');
            sessionStorage.removeItem('voiceMove');
          }
        }
      } catch (e) {
        console.error('Error parsing voice move data:', e);
        sessionStorage.removeItem('voiceMove');
      }
    }
  }, [currentUser.id, router]);
  
  // Debug: Log socket connection status
  useEffect(() => {
    console.log('🔌 VoiceChannelPanel socket status:', {
      socketConnected: socket?.connected,
      socketId: socket?.id,
      currentUserId: currentUser.id,
      channelId
    });
  }, [socket, currentUser.id, channelId]);

  const handleJoinVoice = useCallback(async () => {
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
  }, [channelId]);

  const handleDisconnect = useCallback(async () => {
    console.log('🔴 Disconnecting from voice channel:', channelId);
    
    // Emit leave event
    if (socket) {
      console.log('📡 Emitting voice:leave event');
      socket.emit('voice:leave', {
        channelId,
        userId: currentUser.id,
      });
    }
    
    // Track leave activity
    try {
      const { apiPost } = await import('@/lib/api');
      await apiPost('/voice/track-leave', {});
    } catch (e) {
      console.error('Failed to track voice leave activity');
    }
    
    setToken('');
    setWsUrl('');
    setIsConnected(false);
  }, [socket, channelId, currentUser.id]);

  // Listen for force move events
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ Socket not available in VoiceChannelPanel');
      return;
    }
    
    console.log('✅ Setting up voice:force-move listener for user:', currentUser.id);

    const handleForceMove = async (data: any) => {
      console.log('📨 Received voice:force-move event:', data);
      
      if (data.userId === currentUser.id) {
        console.log('🔄 Received force move event:', {
          from: channelId,
          to: data.targetChannelId,
          targetName: data.targetChannelName,
          currentlyConnected: isConnected
        });
        
        // FIRST: Store the auto-join flag IMMEDIATELY
        sessionStorage.setItem('autoJoinVoiceChannel', data.targetChannelId);
        console.log('💾 Stored auto-join flag for channel:', data.targetChannelId);
        
        // SECOND: Clean up current connection if exists
        if (isConnected && token && channelId) {
          console.log('📤 Disconnecting from current voice channel:', channelId);
          
          // Emit accept move to clean up old channel in Redis
          if (socket) {
            socket.emit('voice:accept-move', {
              fromChannelId: channelId,
              toChannelId: data.targetChannelId,
              userId: currentUser.id,
            });
          }
          
          // Disconnect from LiveKit
          setToken('');
          setWsUrl('');
          setIsConnected(false);
        }
        
        // THIRD: Show notification
        alert(`You are being moved to ${data.targetChannelName} by ${data.movedBy.username}`);
        
        // FOURTH: Navigate or auto-join
        if (data.targetChannelId === channelId) {
          console.log('🎯 Already on target channel page, will auto-join after cleanup');
          // The auto-join useEffect will handle this
        } else {
          // Navigate using Next.js router for client-side navigation (no page reload)
          const currentPath = window.location.pathname;
          const serverIdMatch = currentPath.match(/\/channels\/([^\/]+)/);
          const serverId = serverIdMatch ? serverIdMatch[1] : data.serverId;
          
          const targetUrl = serverId && serverId !== '@me' 
            ? `/channels/${serverId}/${data.targetChannelId}`
            : `/channels/${data.targetChannelId}`;
          
          console.log('🔀 Navigating to:', targetUrl, '(using Next.js router)');
          
          // Use Next.js router for client-side navigation (no page reload!)
          router.push(targetUrl);
        }
      } else {
        console.log('📨 Received voice:force-move but not for me:', {
          eventUserId: data.userId,
          myUserId: currentUser.id
        });
      }
    };

    socket.on('voice:force-move', handleForceMove);
    
    console.log('✅ voice:force-move listener registered');

    return () => {
      console.log('🧹 Cleaning up voice:force-move listener');
      socket.off('voice:force-move', handleForceMove);
    };
  }, [socket, currentUser.id, isConnected, channelId, token, handleJoinVoice]);

  // Auto-join voice channel if moved here or returning to a channel
  useEffect(() => {
    // Check if we should auto-join this channel
    const autoJoinChannelId = sessionStorage.getItem('autoJoinVoiceChannel');
    
    // Get the actual current channel from the URL
    const urlChannelId = window.location.pathname.split('/').pop();
    
    console.log('🔍 Auto-join check:', {
      autoJoinChannelId,
      propChannelId: channelId,
      urlChannelId,
      isConnected,
      isConnecting,
      hasToken: !!token
    });
    
    // Check against BOTH the prop channelId AND the URL channelId
    if (autoJoinChannelId && (autoJoinChannelId === channelId || autoJoinChannelId === urlChannelId)) {
      console.log('✅ Auto-join condition met for channel:', autoJoinChannelId);
      
      // Only auto-join if not already connected
      if (!isConnected && !isConnecting && !token) {
        console.log('🚀 Starting auto-join...');
        
        // Clear the flag first
        sessionStorage.removeItem('autoJoinVoiceChannel');
        
        // Trigger join immediately
        console.log('⏰ Calling handleJoinVoice NOW');
        handleJoinVoice();
      } else {
        console.log('⚠️ Auto-join skipped - already connected or connecting', {
          isConnected,
          isConnecting,
          hasToken: !!token
        });
        // Clear the flag anyway
        sessionStorage.removeItem('autoJoinVoiceChannel');
      }
    }
  }, [channelId, isConnected, isConnecting, token, handleJoinVoice]);

  // Cleanup on unmount or when channelId changes
  useEffect(() => {
    return () => {
      if (isConnected && socket) {
        socket.emit('voice:leave', {
          channelId,
          userId: currentUser.id,
        });
      }
    };
  }, [isConnected, socket, channelId, currentUser.id]);

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
              <p className="text-red-400 text-sm mb-3">{error}</p>
              <Button
                onClick={handleJoinVoice}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Retry Connection
              </Button>
            </div>
          )}

          <Button
            onClick={handleJoinVoice}
            disabled={isConnecting}
            className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          >
            {isConnecting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connecting...
              </div>
            ) : (
              'Join Voice Channel'
            )}
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
          onConnected={() => {
            console.log('🟢 LiveKit connected to channel:', channelId);
            // Emit join event with a small delay to ensure socket is ready
            setTimeout(() => {
              if (socket) {
                console.log('📡 Emitting voice:join event:', {
                  channelId,
                  userId: currentUser.id,
                  username: currentUser.username,
                });
                socket.emit('voice:join', {
                  channelId,
                  userId: currentUser.id,
                  username: currentUser.username,
                  avatar: currentUser.avatar,
                });
              } else {
                console.error('❌ Socket not available when trying to emit voice:join');
              }
            }, 100);
          }}
          onDisconnected={() => {
            console.log('🔴 LiveKit disconnected');
            // Emit leave event when LiveKit disconnects
            if (socket) {
              socket.emit('voice:leave', {
                channelId,
                userId: currentUser.id,
              });
            }
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
