'use client';

import { Mic, MicOff, Headphones, HeadphoneOff, Video, VideoOff, PhoneOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceControlsProps {
  isMuted: boolean;
  isDeafened: boolean;
  isVideoEnabled: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleVideo: () => void;
  onDisconnect: () => void;
  username: string;
  avatar?: string;
}

export function VoiceControls({
  isMuted,
  isDeafened,
  isVideoEnabled,
  onToggleMute,
  onToggleDeafen,
  onToggleVideo,
  onDisconnect,
  username,
  avatar,
}: VoiceControlsProps) {
  return (
    <div className="bg-zinc-900 border-t border-zinc-800 p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
            {avatar ? (
              <img src={avatar} alt={username} className="w-full h-full rounded-full object-cover" />
            ) : (
              username.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{username}</span>
            <span className="text-xs text-zinc-400">
              {isMuted ? 'Muted' : isDeafened ? 'Deafened' : 'Connected'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMute}
            disabled={isDeafened}
            className={`h-8 w-8 ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'hover:bg-zinc-800 text-zinc-400'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDeafen}
            className={`h-8 w-8 ${
              isDeafened
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'hover:bg-zinc-800 text-zinc-400'
            }`}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            {isDeafened ? (
              <HeadphoneOff className="h-4 w-4" />
            ) : (
              <Headphones className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleVideo}
            className={`h-8 w-8 ${
              isVideoEnabled
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'hover:bg-zinc-800 text-zinc-400'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onDisconnect}
            className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white"
            title="Disconnect"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-zinc-800 text-zinc-400"
            title="Voice Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
