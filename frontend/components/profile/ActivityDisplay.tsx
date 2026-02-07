"use client";

import { Activity } from "@/services/api/activityService";

interface ActivityDisplayProps {
  activity: Activity | null;
  customStatus?: string;
  customStatusEmoji?: string;
  className?: string;
  compact?: boolean;
}

const activityIcons: Record<string, string> = {
  CUSTOM: "✨",
  LISTENING: "🎵",
  WATCHING: "📺",
  COMPETING: "🏆",
  STREAMING: "📡"
};

const activityLabels: Record<string, string> = {
  CUSTOM: "",
  LISTENING: "Listening to",
  WATCHING: "Watching",
  COMPETING: "Competing in",
  STREAMING: "Streaming"
};

const activityColors: Record<string, string> = {
  CUSTOM: "text-[#b5bac1]",
  LISTENING: "text-[#1db954]",
  WATCHING: "text-[#ff0000]",
  COMPETING: "text-[#faa61a]",
  STREAMING: "text-[#9146ff]"
};

export function ActivityDisplay({ 
  activity, 
  customStatus, 
  customStatusEmoji,
  className = "",
  compact = false
}: ActivityDisplayProps) {
  if (!activity && !customStatus) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Custom Status */}
      {customStatus && (
        <div className="flex items-center gap-2">
          {customStatusEmoji && (
            <span className="text-lg flex-shrink-0">{customStatusEmoji}</span>
          )}
          <span className="text-sm text-[#dbdee1] truncate">{customStatus}</span>
        </div>
      )}
      
      {/* Activity */}
      {activity && (
        <div className="flex items-start gap-2.5">
          <span className={`text-xl flex-shrink-0 mt-0.5 ${activityColors[activity.type]}`}>
            {activity.emoji || activityIcons[activity.type]}
          </span>
          <div className="flex-1 min-w-0">
            {/* Activity Type Label */}
            {activityLabels[activity.type] && (
              <div className="text-xs font-semibold text-[#b5bac1] uppercase mb-0.5">
                {activityLabels[activity.type]}
              </div>
            )}
            
            {/* Activity Name */}
            <div className={`font-semibold text-white ${compact ? 'text-sm' : 'text-sm'} truncate`}>
              {activity.name}
            </div>
            
            {/* Details */}
            {activity.details && (
              <div className="text-xs text-[#b5bac1] truncate mt-0.5">
                {activity.details}
              </div>
            )}
            
            {/* State */}
            {activity.state && (
              <div className="text-xs text-[#949ba4] truncate">
                {activity.state}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
