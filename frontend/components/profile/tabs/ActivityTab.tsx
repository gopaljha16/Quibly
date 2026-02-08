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
  const today = new Date()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Create a map for easy lookup
  const activityMap = new Map(data?.map(d => [new Date(d.date).toDateString(), d]))

  // Generate last 12 months of data (52 weeks)
  const weeks = 52
  const grid: Array<Array<{ date: Date; activity?: any }>> = []
  
  for (let week = weeks - 1; week >= 0; week--) {
    const weekData: Array<{ date: Date; activity?: any }> = []
    for (let day = 0; day < 7; day++) {
      const date = new Date()
      date.setDate(today.getDate() - (week * 7 + (6 - day)))
      weekData.push({
        date,
        activity: activityMap.get(date.toDateString())
      })
    }
    grid.push(weekData)
  }

  // Get month labels
  const monthLabels: Array<{ month: string; weekIndex: number }> = []
  let lastMonth = -1
  grid.forEach((week, index) => {
    const month = week[0].date.getMonth()
    if (month !== lastMonth) {
      monthLabels.push({ month: months[month], weekIndex: index })
      lastMonth = month
    }
  })

  const getColor = (count: number) => {
    if (!count) return 'bg-[#2b2d31]'
    if (count < 3) return 'bg-[#23a559]/30'
    if (count < 7) return 'bg-[#23a559]/60'
    if (count < 15) return 'bg-[#23a559]/80'
    return 'bg-[#23a559]'
  }

  return (
    <div className="bg-[#1e1f22] rounded-lg p-6">
      <h3 className="text-sm font-semibold text-white mb-4">Activity Heatmap</h3>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-2 ml-8">
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-[10px] text-[#949ba4] font-medium"
                style={{ marginLeft: i === 0 ? 0 : `${(label.weekIndex - (monthLabels[i - 1]?.weekIndex || 0)) * 14}px` }}
              >
                {label.month}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-2">
              {days.map((day, i) => (
                <div key={i} className="h-3 flex items-center">
                  <span className="text-[9px] text-[#949ba4] w-6">{i % 2 === 1 ? day : ''}</span>
                </div>
              ))}
            </div>
            
            {/* Activity squares */}
            {grid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`w-3 h-3 rounded-sm ${getColor(day.activity?.count || 0)} transition-all hover:ring-2 hover:ring-white/30 cursor-help`}
                    title={`${day.date.toLocaleDateString()}\n${day.activity?.messages || 0} messages\n${day.activity?.voice || 0}m voice`}
                  />
                ))}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex justify-end items-center gap-2 text-[10px] text-[#949ba4]">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#2b2d31]" />
              <div className="w-3 h-3 rounded-sm bg-[#23a559]/30" />
              <div className="w-3 h-3 rounded-sm bg-[#23a559]/60" />
              <div className="w-3 h-3 rounded-sm bg-[#23a559]/80" />
              <div className="w-3 h-3 rounded-sm bg-[#23a559]" />
            </div>
            <span>More</span>
          </div>
        </div>
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
