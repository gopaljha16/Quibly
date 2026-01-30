'use client';

import { Mic, MicOff, Headphones, Video } from 'lucide-react';

interface VoiceParticipantProps {
  username: string;
  avatar?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isVideoEnabled: boolean;
  isSpeaking?: boolean;
}

export function VoiceParticipant({
  username,
  avatar,
  isMuted,
  isDeafened,
  isVideoEnabled,
  isSpeaking = false,
}: VoiceParticipantProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-800/50 rounded group">
      <div className="relative">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-all ${
            isSpeaking
              ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-zinc-900'
              : ''
          }`}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-zinc-200 truncate">
          {username}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {isVideoEnabled && (
          <div className="text-green-500">
            <Video className="h-3.5 w-3.5" />
          </div>
        )}
        {isDeafened ? (
          <div className="text-red-500">
            <Headphones className="h-3.5 w-3.5" />
          </div>
        ) : isMuted ? (
          <div className="text-red-500">
            <MicOff className="h-3.5 w-3.5" />
          </div>
        ) : (
          <div className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <Mic className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}
