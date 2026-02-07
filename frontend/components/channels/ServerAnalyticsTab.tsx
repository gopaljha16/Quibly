'use client'

import { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api'

type Analytics = {
  timeline: Array<{
    date: string
    newMembers: number
    leftMembers: number
    totalMessages: number
    voiceMinutes: number
    activeMembers: number
  }>
  summary: {
    currentMembers: number
    totalMessages: number
    growthRate: number
    totalNewMembers: number
    totalLeftMembers: number
    totalVoiceMinutes: number
  }
  mostActiveMembers: Array<{
    user: {
      id: string
      username: string
      discriminator: string
      avatar: string | null
    }
    messageCount: number
  }>
  mostActiveChannels: Array<{
    channel: {
      id: string
      name: string
      type: string
    }
    messageCount: number
  }>
}

export default function ServerAnalyticsTab({ serverId }: { serverId: string }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchAnalytics()
  }, [serverId, days])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await apiRequest<{ success: boolean; analytics: Analytics }>(
        `/server/${serverId}/analytics?days=${days}`
      )
      setAnalytics(response.analytics)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading analytics...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Failed to load analytics</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Server Analytics</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="bg-[#1E1F22] text-white px-3 py-2 rounded-[3px] text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#2B2D31] p-4 rounded-lg">
          <div className="text-xs text-slate-400 uppercase mb-1">Total Members</div>
          <div className="text-2xl font-bold text-white">{analytics.summary.currentMembers}</div>
          <div className={`text-xs mt-1 ${analytics.summary.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {analytics.summary.growthRate >= 0 ? '↑' : '↓'} {Math.abs(analytics.summary.growthRate)}% growth
          </div>
        </div>

        <div className="bg-[#2B2D31] p-4 rounded-lg">
          <div className="text-xs text-slate-400 uppercase mb-1">Total Messages</div>
          <div className="text-2xl font-bold text-white">{analytics.summary.totalMessages.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-1">
            {analytics.timeline.length > 0 && (
              <>Avg {Math.round(analytics.summary.totalMessages / analytics.timeline.length)}/day</>
            )}
          </div>
        </div>

        <div className="bg-[#2B2D31] p-4 rounded-lg">
          <div className="text-xs text-slate-400 uppercase mb-1">Voice Time</div>
          <div className="text-2xl font-bold text-white">
            {Math.round(analytics.summary.totalVoiceMinutes / 60)}h
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {analytics.summary.totalVoiceMinutes} minutes total
          </div>
        </div>
      </div>

      {/* Member Growth */}
      <div className="bg-[#2B2D31] p-4 rounded-lg">
        <h3 className="text-sm font-bold text-white mb-3">Member Growth</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">New Members</div>
            <div className="text-xl font-bold text-green-400">+{analytics.summary.totalNewMembers}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Left Members</div>
            <div className="text-xl font-bold text-red-400">-{analytics.summary.totalLeftMembers}</div>
          </div>
        </div>
      </div>

      {/* Most Active Members */}
      <div className="bg-[#2B2D31] p-4 rounded-lg">
        <h3 className="text-sm font-bold text-white mb-3">Most Active Members</h3>
        <div className="space-y-2">
          {analytics.mostActiveMembers.slice(0, 5).map((member, index) => (
            <div key={member.user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-slate-400 font-mono text-sm w-6">#{index + 1}</div>
                <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center overflow-hidden">
                  {member.user.avatar ? (
                    <img src={member.user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {member.user.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm text-white font-medium">
                    {member.user.username}#{member.user.discriminator}
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-400">{member.messageCount} messages</div>
            </div>
          ))}
        </div>
      </div>

      {/* Most Active Channels */}
      <div className="bg-[#2B2D31] p-4 rounded-lg">
        <h3 className="text-sm font-bold text-white mb-3">Most Active Channels</h3>
        <div className="space-y-2">
          {analytics.mostActiveChannels.slice(0, 5).map((channel, index) => (
            <div key={channel.channel.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-slate-400 font-mono text-sm w-6">#{index + 1}</div>
                <div className="text-sm text-white font-medium">
                  {channel.channel.type === 'VOICE' ? '🔊' : '#'} {channel.channel.name}
                </div>
              </div>
              <div className="text-sm text-slate-400">{channel.messageCount} messages</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
