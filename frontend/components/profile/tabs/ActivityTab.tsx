'use client'

import { MessageSquare, Clock, TrendingUp, Hash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'

interface ActivityTabProps {
  user: any
}

interface UserStats {
  messagesSent: number
  voiceTimeMinutes: number
  serversJoined: number
  friendsCount: number
  accountAge: number
  achievements: string[]
  heatmap?: Array<{
    date: string
    count: number
    messages: number
    voice: number
  }>
}

function DailyHeatmap({ data }: { data: UserStats['heatmap'] }) {
  const days = 365
  const today = new Date()
  
  // Create a map for easy lookup
  const activityMap = new Map(data?.map(d => [new Date(d.date).toDateString(), d]))

  // Generate last 365 days
  const grid = Array.from({ length: days }).map((_, i) => {
    const date = new Date()
    date.setDate(today.getDate() - (days - 1 - i))
    return {
      date,
      activity: activityMap.get(date.toDateString())
    }
  })

  const getColor = (count: number) => {
    if (!count) return 'bg-[#2b2d31]'
    if (count < 3) return 'bg-[#23a559]/30'
    if (count < 7) return 'bg-[#23a559]/60'
    return 'bg-[#23a559]'
  }

  return (
    <div className="bg-[#1e1f22] rounded-lg p-6">
      <h3 className="text-xs font-semibold text-[#949ba4] uppercase mb-4 text-center">Activity Heatmap (Past Year)</h3>
      <div className="flex flex-wrap gap-1 justify-center">
        {grid.map((day, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${getColor(day.activity?.count || 0)} transition-colors cursor-help`}
            title={`${day.date.toDateString()}: ${day.activity?.messages || 0} messages, ${day.activity?.voice || 0}m voice`}
          />
        ))}
      </div>
      <div className="mt-4 flex justify-center items-center gap-4 text-[10px] text-[#949ba4]">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-[#2b2d31]" />
          <div className="w-3 h-3 rounded-sm bg-[#23a559]/30" />
          <div className="w-3 h-3 rounded-sm bg-[#23a559]/60" />
          <div className="w-3 h-3 rounded-sm bg-[#23a559]" />
        </div>
        <span>More</span>
      </div>
    </div>
  )
}

export default function ActivityTab({ user }: ActivityTabProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiGet<{ success: boolean; stats: UserStats }>(`/profile/stats/${user._id || user.id}`)
        setStats(response.stats)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user._id, user.id])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-[#1e1f22] rounded-lg p-6 animate-pulse h-32" />
        <div className="bg-[#1e1f22] rounded-lg p-6 animate-pulse h-32" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-[#1e1f22] rounded-lg p-6 text-center text-[#949ba4]">
        Failed to load activity stats
      </div>
    )
  }

  const formatVoiceTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-5">
      {/* Activity Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Messages Sent */}
        <div className="bg-[#1e1f22] rounded-lg p-6 hover:bg-[#2b2d31] transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#5865f2]/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#5865f2]" />
            </div>
            <span className="text-xs font-semibold text-[#949ba4] uppercase">Messages Sent</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.messagesSent.toLocaleString()}</p>
        </div>

        {/* Voice Time */}
        <div className="bg-[#1e1f22] rounded-lg p-6 hover:bg-[#2b2d31] transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#23a559]/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#23a559]" />
            </div>
            <span className="text-xs font-semibold text-[#949ba4] uppercase">Voice Time</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatVoiceTime(stats.voiceTimeMinutes)}</p>
        </div>

        {/* Friends */}
        <div className="bg-[#1e1f22] rounded-lg p-6 hover:bg-[#2b2d31] transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#f23f43]/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#f23f43]" />
            </div>
            <span className="text-xs font-semibold text-[#949ba4] uppercase">Friends</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.friendsCount}</p>
        </div>

        {/* Account Age */}
        <div className="bg-[#1e1f22] rounded-lg p-6 hover:bg-[#2b2d31] transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-xs font-semibold text-[#949ba4] uppercase">Account Age</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.accountAge} <span className="text-sm font-normal text-[#949ba4]">days</span></p>
        </div>
      </div>

      {/* Activity Heatmap */}
      <DailyHeatmap data={stats.heatmap} />

      {/* Account Info (Secondary) */}
      <div className="bg-[#1e1f22] rounded-lg p-6">
        <h3 className="text-xs font-semibold text-[#949ba4] uppercase mb-4">Achievements</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#949ba4]">Total Achievements</span>
          <span className="text-sm font-semibold text-white">{stats.achievements.length}</span>
        </div>
      </div>
    </div>
  )
}
