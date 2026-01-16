'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChannels } from '@/components/channels/ChannelsProvider'

export default function ChannelsPage() {
  const router = useRouter()
  const { route, channels, channelsLoading, selectedChannel } = useChannels()

  useEffect(() => {
    if (route.isMe) return
    if (!route.serverId) return
    if (channelsLoading) return

    if (!route.channelId && channels.length > 0) {
      router.replace(`/channels/${route.serverId}/${channels[0]._id}`)
    }
  }, [channels, channelsLoading, route.channelId, route.isMe, route.serverId, router])

  return (
    <>
      <div className="flex-1 overflow-auto p-4">
        {route.isMe ? (
          <div className="text-white/70">Friends UI can be added here.</div>
        ) : selectedChannel ? (
          <div className="text-white/70">
            Messages UI will be added here.
            <div className="mt-2 text-white/50 text-sm">
              Note: backend messages GET route is not exposed yet.
            </div>
          </div>
        ) : (
          <div className="text-white/70">Select a channel</div>
        )}
      </div>

      <div className="p-4 border-t border-white/5">
        <div className="h-11 rounded-md bg-black/20 border border-white/5 flex items-center px-3 text-sm text-white/50">
          Message input (next step)
        </div>
      </div>
    </>
  )
}
