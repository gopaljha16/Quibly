'use client';

import { useState, useEffect } from 'react';
import { Volume2, Mic, MicOff, Headphones, Video } from 'lucide-react';
import { useSocket } from '@/providers/SocketProvider';

interface VoiceParticipant {
  userId: string;
  username: string;
  avatar?: string;
  discriminator?: string;
  muted: boolean;
  deafened: boolean;
  video: boolean;
  streaming: boolean;
  activity?: {
    name: string;
    icon?: string;
  };
}

interface VoiceChannelItemProps {
  channel: {
    _id: string;
    name: string;
    type?: string;
    isPrivate?: boolean;
  };
  isSelected: boolean;
  onSelect: () => void;
  onSettings?: () => void;
  serverId: string;
}

export function VoiceChannelItem({
  channel,
  isSelected,
  onSelect,
  onSettings,
  serverId,
}: VoiceChannelItemProps) {
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const { socket } = useSocket();

  // Listen for voice channel updates
  useEffect(() => {
    if (!socket) return;

    const handleVoiceUpdate = (data: any) => {
      if (data.channelId === channel._id) {
        console.log('Voice participants update:', data.participants);
        setParticipants(data.participants || []);
      }
    };

    const handleUserJoined = (data: any) => {
      if (data.channelId === channel._id) {
        console.log('User joined voice channel:', data.participant);
        setParticipants((prev) => {
          // Check if user already exists
          if (prev.some((p) => p.userId === data.userId)) {
            return prev;
          }
          return [...prev, data.participant];
        });
      }
    };

    const handleUserLeft = (data: any) => {
      if (data.channelId === channel._id) {
        console.log('👋 User left voice channel:', data.userId);
        
        // Always use the participants array from the server if provided
        if (data.participants) {
          setParticipants(data.participants);
        } else {
          // Fallback: filter out the user who left
          setParticipants((prev) =>
            prev.filter((p) => p.userId !== data.userId)
          );
        }
      }
    };

    const handleStateChanged = (data: any) => {
      if (data.channelId === channel._id) {
        console.log('🔄 Voice state changed:', data.userId, data.state);
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === data.userId ? { ...p, ...data.state } : p
          )
        );
      }
    };

    // Request current participants when component mounts
    if (socket) {
      console.log('📡 Requesting participants for channel:', channel._id);
      socket.emit('voice:get-participants', { channelId: channel._id, serverId });
    }

    socket.on('voice:participants', handleVoiceUpdate);
    socket.on('voice:user-joined', handleUserJoined);
    socket.on('voice:user-left', handleUserLeft);
    socket.on('voice:state-changed', handleStateChanged);

    return () => {
      socket.off('voice:participants', handleVoiceUpdate);
      socket.off('voice:user-joined', handleUserJoined);
      socket.off('voice:user-left', handleUserLeft);
      socket.off('voice:state-changed', handleStateChanged);
    };
  }, [socket, channel._id, serverId]);

  const hasParticipants = participants.length > 0;

  return (
    <div className="mb-[2px]">
      {/* Voice Channel Header */}
      <div
        className={`group relative w-full text-left px-2 py-[6px] rounded-[4px] text-[15px] flex items-center gap-1.5 cursor-pointer ${
          isSelected
            ? 'bg-[#404249] text-white font-medium'
            : 'hover:bg-[#35373c] text-[#949ba4] hover:text-[#dbdee1]'
        }`}
        onClick={onSelect}
      >
        <div className="relative flex-shrink-0">
          <Volume2 className="w-5 h-5 opacity-60" />
          {channel.isPrivate && (
            <div className="absolute -right-1 -bottom-1 w-3.5 h-3.5 bg-[#2b2d31] rounded-full flex items-center justify-center p-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" className="fill-[#b5bac1]">
                <path d="M12 2C9.243 2 7 4.243 7 7V11C5.897 11 5 11.897 5 13V20C5 21.103 5.897 22 7 22H17C18.103 22 19 21.103 19 20V13C19 11.897 18.103 11 17 11ZM12 18C11.172 18 10.5 17.328 10.5 16.5C10.5 15.672 11.172 15 12 15C12.828 15 13.5 15.672 13.5 16.5C13.5 17.328 12.828 18 12 18ZM15 11H9V7C9 5.346 10.346 4 12 4C13.654 4 15 5.346 15 7V11Z" />
              </svg>
            </div>
          )}
        </div>
        <span className="truncate font-medium flex-1">{channel.name}</span>

        {/* Participant count badge */}
        {hasParticipants && (
          <div className="flex items-center gap-1 text-xs text-[#b5bac1]">
            <svg width="12" height="12" viewBox="0 0 24 24" className="fill-current">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            <span>{participants.length}</span>
          </div>
        )}

        {/* Settings Icon - Only visible on hover */}
        {onSettings && (
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onSettings();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current hover:text-white cursor-pointer">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
            </svg>
          </div>
        )}
      </div>

      {/* Participants List */}
      {hasParticipants && isExpanded && (
        <div className="ml-4 mt-1 space-y-[2px]">
          {participants.map((participant) => (
            <VoiceParticipantRow
              key={participant.userId}
              participant={participant}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VoiceParticipantRow({ participant }: { participant: VoiceParticipant }) {
  return (
    <div className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-[#35373c] transition-colors">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-6 h-6 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-semibold overflow-hidden">
          {participant.avatar ? (
            <img
              src={participant.avatar}
              alt={participant.username}
              className="w-full h-full object-cover"
            />
          ) : (
            participant.username.charAt(0).toUpperCase()
          )}
        </div>
        {/* Speaking indicator ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[#23a55a] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Username and Activity */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-[#dbdee1] truncate font-medium">
            {participant.username}
          </span>
          {participant.activity && (
            <div className="flex items-center gap-1 text-xs text-[#b5bac1]">
              {participant.activity.icon && (
                <span className="text-base">{participant.activity.icon}</span>
              )}
              <span className="truncate max-w-[80px]">{participant.activity.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Icons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* LIVE indicator for streaming */}
        {participant.streaming && (
          <div className="bg-[#ed4245] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            LIVE
          </div>
        )}

        {/* Video indicator */}
        {participant.video && (
          <Video className="w-3.5 h-3.5 text-[#23a55a]" />
        )}

        {/* Mute/Deafen indicator - Always show when muted/deafened */}
        {participant.deafened ? (
          <Headphones className="w-3.5 h-3.5 text-[#ed4245]" />
        ) : participant.muted ? (
          <MicOff className="w-3.5 h-3.5 text-[#ed4245]" />
        ) : (
          <Mic className="w-3.5 h-3.5 text-[#23a55a]" />
        )}
      </div>
    </div>
  );
}
