'use client'

import { useState } from 'react'
import { Users, Activity, Link as LinkIcon, Settings, Hash, Calendar, Badge as BadgeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import OverviewTab from './tabs/OverviewTab'
import ActivityTab from './tabs/ActivityTab'
import ConnectionsTab from './tabs/ConnectionsTab'
import SettingsTab from './tabs/SettingsTab'

interface UserProfileViewProps {
  user: any
  isOwnProfile?: boolean
  onEdit?: () => void
  onUpdate?: (data: any) => void
}

export default function UserProfileView({ user, isOwnProfile, onEdit, onUpdate }: UserProfileViewProps) {
  const [activeTab, setActiveTab] = useState('overview')


  if (!user) return null

  const statusColors = {
    online: 'bg-[#23a559]',
    idle: 'bg-[#f0b232]',
    dnd: 'bg-[#f23f43]',
    offline: 'bg-[#80848e]'
  }

  const cardStyles = {
    rounded: 'rounded-2xl',
    sharp: 'rounded-none',
    glass: 'rounded-2xl backdrop-blur-lg bg-opacity-80'
  }

  const cardStyle = user.cardStyle || 'rounded'

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'connections', label: 'Connections', icon: LinkIcon },
    ...(isOwnProfile ? [{ id: 'settings', label: 'Settings', icon: Settings }] : [])
  ]

  return (
    <Card className={`bg-[#111214] border-none overflow-hidden shadow-xl ${cardStyles[cardStyle as keyof typeof cardStyles]}`}>
      {/* Banner */}
      {user.showBanner !== false && (
        <div
          className="h-36 relative overflow-hidden"
          style={{ backgroundColor: user.themeColor || '#5865F2' }}
        >
          {user.banner && (
            <img 
              src={user.banner} 
              alt="Profile Banner" 
              className="w-full h-full object-cover" 
            />
          )}
        </div>
      )}

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className={`relative ${user.showBanner !== false ? '-mt-16' : 'mt-6'} mb-5`}>
          <div className={`relative w-32 h-32 ${cardStyles[cardStyle as keyof typeof cardStyles]} border-[6px] border-[#111214] overflow-hidden bg-[#5865f2]`}>
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

        {/* Username Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">
            {user.displayName || user.username}
          </h2>
          <p className="text-[#b5bac1] text-sm">
            {user.username}
            {user.discriminator && `#${user.discriminator}`}
          </p>
          {user.pronouns && (
            <p className="text-sm text-[#949ba4] mt-1">{user.pronouns}</p>
          )}
          {user.location && (
            <p className="text-sm text-[#949ba4] mt-1">📍 {user.location}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="w-full">
          {/* Tab Headers */}
          <div className="w-full bg-[#1e1f22] border-b border-[#3f4147] rounded-t-lg h-12 flex">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 h-full transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'bg-[#2b2d31] text-white border-[#5865f2]'
                      : 'text-[#949ba4] border-transparent hover:text-white hover:bg-[#2b2d31]/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && <OverviewTab user={user} isOwnProfile={isOwnProfile} />}
            {activeTab === 'activity' && <ActivityTab user={user} />}
            {activeTab === 'connections' && <ConnectionsTab user={user} isOwnProfile={isOwnProfile} onUpdate={onUpdate} />}
            {activeTab === 'settings' && isOwnProfile && <SettingsTab user={user} onUpdate={onUpdate} />}
          </div>
        </div>
      </div>
    </Card>
  )
}
