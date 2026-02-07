'use client'

import { Badge, Calendar, Hash } from 'lucide-react'
import { StatusMenu } from '../StatusMenu'

interface OverviewTabProps {
  user: any
  isOwnProfile?: boolean
}

export default function OverviewTab({ user, isOwnProfile }: OverviewTabProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-5">
      {/* Activity & Status Controls - Only show for own profile */}
      {isOwnProfile && (
        <div className="bg-[#1e1f22] rounded-lg p-4">
          <h3 className="text-xs font-semibold text-[#949ba4] uppercase mb-3 tracking-wide">
            Activity & Status
          </h3>
          <StatusMenu />
        </div>
      )}

      {/* Custom Status - Show for viewing other profiles */}
      {!isOwnProfile && user.customStatus && (
        <div className="bg-[#1e1f22] rounded-lg p-4">
          <div className="flex items-center gap-2">
            {user.customStatusEmoji && <span className="text-xl">{user.customStatusEmoji}</span>}
            <span className="text-[#dbdee1]">{user.customStatus}</span>
          </div>
        </div>
      )}

      {/* Badges */}
      {user.badges && user.badges.length > 0 && (
        <div className="bg-[#1e1f22] rounded-lg p-4">
          <h3 className="text-xs font-semibold text-[#949ba4] uppercase mb-3">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {user.badges.map((badge: string, index: number) => (
              <div
                key={index}
                className="px-3 py-1.5 bg-[#5865f2]/20 text-[#5865f2] rounded-md text-xs font-semibold flex items-center gap-1.5"
              >
                <Badge className="w-3.5 h-3.5" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {user.achievements && user.achievements.length > 0 && (
        <div className="bg-[#1e1f22] rounded-lg p-4">
          <h3 className="text-xs font-semibold text-[#949ba4] uppercase mb-3">Achievements</h3>
          <div className="flex flex-wrap gap-2">
            {user.achievements.map((achievement: string, index: number) => (
              <div
                key={index}
                className="px-3 py-1.5 bg-[#f0b232]/20 text-[#f0b232] rounded-md text-xs font-semibold"
              >
                🏆 {achievement}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {user.bio && (
        <div className="bg-[#1e1f22] rounded-lg p-4">
          <h3 className="text-xs font-semibold text-[#949ba4] uppercase mb-3">About Me</h3>
          <p className="text-sm text-[#dbdee1] whitespace-pre-wrap leading-relaxed">{user.bio}</p>
        </div>
      )}

      {/* Interests */}
      {user.userInterests && user.userInterests.length > 0 && (
        <div className="bg-[#1e1f22] rounded-lg p-4">
          <h3 className="text-xs font-semibold text-[#949ba4] uppercase mb-3 flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.userInterests.map((ui: any) => (
              <span
                key={ui.id}
                className="px-3 py-1.5 bg-[#2b2d31] text-[#dbdee1] rounded-md text-xs font-medium hover:bg-[#35373c] transition-colors"
              >
                {ui.interest.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        {user._count && (
          <div className="bg-[#1e1f22] rounded-lg p-4">
            <div className="flex items-center gap-2 text-[#949ba4] mb-2">
              <Hash className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Servers</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {user._count.serverMembers + user._count.ownedServers}
            </p>
          </div>
        )}
        <div className="bg-[#1e1f22] rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#949ba4] mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Joined</span>
          </div>
          <p className="text-sm font-semibold text-white">{formatDate(user.createdAt)}</p>
        </div>
      </div>
    </div>
  )
}
