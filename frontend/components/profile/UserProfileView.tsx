'use client'

import { Badge, Calendar, Hash, Users, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface UserProfileViewProps {
  user: any
  isOwnProfile?: boolean
  onEdit?: () => void
}

export default function UserProfileView({ user, isOwnProfile, onEdit }: UserProfileViewProps) {
  if (!user) return null

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const statusColors = {
    online: 'bg-[#23a559]',
    idle: 'bg-[#f0b232]',
    dnd: 'bg-[#f23f43]',
    offline: 'bg-[#80848e]'
  }

  return (
    <Card className="bg-[#111214] border-none overflow-hidden shadow-xl">
      {/* Banner */}
      <div
        className="h-36 relative"
        style={{
          backgroundColor: user.themeColor || '#5865F2',
          backgroundImage: user.banner ? `url(${user.banner})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {isOwnProfile && onEdit && (
          <Button
            onClick={onEdit}
            size="sm"
            className="absolute top-4 right-4 bg-[#111214] hover:bg-[#1e1f22] text-white border border-[#3f4147]"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-16 mb-5">
          <div className="relative w-32 h-32 rounded-full border-[6px] border-[#111214] overflow-hidden bg-[#5865f2]">
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                {user.username?.[0]?.toUpperCase()}
              </div>
            )}
            {/* Status Indicator */}
            <div
              className={`absolute bottom-1 right-1 w-8 h-8 rounded-full border-[6px] border-[#111214] ${
                statusColors[user.status as keyof typeof statusColors] || statusColors.offline
              }`}
            />
          </div>
        </div>

        {/* User Info */}
        <div className="space-y-5">
          {/* Username and Display Name */}
          <div className="bg-[#1e1f22] rounded-lg p-4">
            <h2 className="text-2xl font-bold text-white mb-1">
              {user.displayName || user.username}
            </h2>
            <p className="text-[#b5bac1] text-sm">
              {user.username}
              {user.discriminator && `#${user.discriminator}`}
            </p>
            {user.pronouns && (
              <p className="text-sm text-[#949ba4] mt-2">{user.pronouns}</p>
            )}
          </div>

          {/* Custom Status */}
          {user.customStatus && (
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

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {user._count && (
              <div className="bg-[#1e1f22] rounded-lg p-4">
                <div className="flex items-center gap-2 text-[#949ba4] mb-2">
                  <Users className="w-4 h-4" />
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
      </div>
    </Card>
  )
}
