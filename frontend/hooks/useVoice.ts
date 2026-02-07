import { useState, useEffect, useCallback } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { useSocket } from '@/providers/SocketProvider';
import { apiGet } from '@/lib/api';

interface VoiceState {
  muted: boolean;
  deafened: boolean;
  video: boolean;
  screenshare: boolean;
}

interface VoiceParticipant {
  userId: string;
  username: string;
  avatar?: string;
  muted: boolean;
  deafened: boolean;
  video: boolean;
  screenshare: boolean;
}

export function useVoice(channelId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    muted: false,
    deafened: false,
    video: false,
    screenshare: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<{ token: string; wsUrl: string } | null>(null);
  const { socket } = useSocket();

  // Listen to socket events for participant updates
  useEffect(() => {
    if (!socket || !channelId) return;

    const handleUserJoined = (data: any) => {
      if (data.channelId === channelId) {
        setParticipants(data.participants || []);
      }
    };

    const handleUserLeft = (data: any) => {
      if (data.channelId === channelId) {
        setParticipants((prev) =>
          prev.filter((p) => p.userId !== data.userId)
        );
      }
    };

    const handleStateChanged = (data: any) => {
      if (data.channelId === channelId) {
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === data.userId ? { ...p, ...data.state } : p
          )
        );
      }
    };

    socket.on('voice:user-joined', handleUserJoined);
    socket.on('voice:user-left', handleUserLeft);
    socket.on('voice:state-changed', handleStateChanged);

    return () => {
      socket.off('voice:user-joined', handleUserJoined);
      socket.off('voice:user-left', handleUserLeft);
      socket.off('voice:state-changed', handleStateChanged);
    };
  }, [socket, channelId]);

  const connectToVoice = useCallback(async () => {
    if (!channelId || isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      console.log('Requesting voice token for channel:', channelId);

      // Get LiveKit token from backend
      const response = await apiGet<{
        token: string;
        wsUrl: string;
        roomName: string;
        identity: string;
        user: {
          id: string;
          username: string;
          discriminator: string;
          avatar?: string;
        };
      }>(`/voice/token/${channelId}`);
      const { token, wsUrl, identity, user } = response;

      console.log('Received voice token:', {
        wsUrl,
        roomName: response.roomName,
        identity,
        tokenLength: token.length
      });

      // Create and connect to LiveKit room
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: {
            width: 1280,
            height: 720,
            frameRate: 30,
          },
        },
      });

      // Set up room event listeners
      newRoom.on(RoomEvent.Connected, async () => {
        console.log('Connected to voice channel');
        setIsConnected(true);
        setIsConnecting(false);

        // Notify server via socket
        if (socket) {
          socket.emit('voice:join', {
            channelId,
            userId: user.id,
            username: user.username,
            avatar: user.avatar,
          });
        }

        // Track activity (Async)
        try {
          const { apiPost } = await import('@/lib/api');
          apiPost(`/voice/track-join/${channelId}`);
        } catch (e) {
          console.error('Failed to track voice join activity');
        }
      });

      newRoom.on(RoomEvent.Disconnected, async () => {
        console.log('Disconnected from voice channel');
        setIsConnected(false);

        // Notify server via socket
        if (socket) {
          socket.emit('voice:leave', {
            channelId,
            userId: newRoom.localParticipant.identity,
          });
        }

        // Track activity (Async)
        try {
          const { apiPost } = await import('@/lib/api');
          apiPost('/voice/track-leave');
        } catch (e) {
          console.error('Failed to track voice leave activity');
        }
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participant connected:', participant.identity);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('Participant disconnected:', participant.identity);
      });

      newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
          console.log('Audio track subscribed from:', participant.identity);
        }
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((element) => element.remove());
        console.log('Track unsubscribed');
      });

      newRoom.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        console.log('Connection quality changed:', quality, participant?.identity);
      });

      // Connect to the room
      console.log('Connecting to LiveKit room...');
      await newRoom.connect(wsUrl, token);
      setRoom(newRoom);
      setConnectionInfo({ token, wsUrl });
      console.log('Successfully connected to LiveKit room');
    } catch (err: any) {
      console.error('❌ Failed to connect to voice:', err);

      // Provide more helpful error messages
      let errorMessage = 'Failed to connect to voice channel';

      if (err.message?.includes('invalid authorization token')) {
        errorMessage = 'Voice service authentication failed. Please contact support.';
      } else if (err.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsConnecting(false);
    }
  }, [channelId, isConnecting, isConnected, socket]);

  const disconnectFromVoice = useCallback(async () => {
    if (!room) return;

    try {
      await room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setParticipants([]);
    } catch (err) {
      console.error('Failed to disconnect from voice:', err);
    }
  }, [room]);

  const toggleMute = useCallback(async () => {
    if (!room) return;

    const newMuted = !voiceState.muted;
    await room.localParticipant.setMicrophoneEnabled(!newMuted);

    const newState = { ...voiceState, muted: newMuted };
    setVoiceState(newState);

    // Notify server
    if (socket && channelId) {
      socket.emit('voice:state-update', {
        channelId,
        userId: room.localParticipant.identity,
        state: { muted: newMuted },
      });
    }
  }, [room, voiceState, socket, channelId]);

  const toggleDeafen = useCallback(async () => {
    if (!room) return;

    const newDeafened = !voiceState.deafened;

    // When deafening, also mute
    if (newDeafened) {
      await room.localParticipant.setMicrophoneEnabled(false);
    }

    const newState = {
      ...voiceState,
      deafened: newDeafened,
      muted: newDeafened ? true : voiceState.muted,
    };
    setVoiceState(newState);

    // Notify server
    if (socket && channelId) {
      socket.emit('voice:state-update', {
        channelId,
        userId: room.localParticipant.identity,
        state: { deafened: newDeafened, muted: newState.muted },
      });
    }
  }, [room, voiceState, socket, channelId]);

  const toggleVideo = useCallback(async () => {
    if (!room) return;

    const newVideo = !voiceState.video;
    await room.localParticipant.setCameraEnabled(newVideo);

    const newState = { ...voiceState, video: newVideo };
    setVoiceState(newState);

    // Notify server
    if (socket && channelId) {
      socket.emit('voice:state-update', {
        channelId,
        userId: room.localParticipant.identity,
        state: { video: newVideo },
      });
    }
  }, [room, voiceState, socket, channelId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  return {
    room,
    isConnected,
    isConnecting,
    participants,
    voiceState,
    error,
    connectionInfo,
    connectToVoice,
    disconnectFromVoice,
    toggleMute,
    toggleDeafen,
    toggleVideo,
  };
}
