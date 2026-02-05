'use client'

import { useState } from 'react'
import { usePinnedMessages } from '@/hooks/queries'
import { X, Pin } from 'lucide-react'
import { Message } from '@/hooks/queries'

interface PinnedMessagesBannerProps {
  channelId: string
}

export function PinnedMessagesBanner({ channelId }: PinnedMessagesBannerProps) {
  const { data: pinnedMessages = [], isLoading } = usePinnedMessages(channelId)
  const [isExpanded, setIsExpanded] = useState(false)

  if (isLoading || pinnedMessages.length === 0) {
    return null
  }

  const latestPinned = pinnedMessages[0]

  return (
    <div className="bg-[#2b2d31] border-b border-[#1e1f22]">
      {!isExpanded ? (
        <div className="flex items-center justify-between px-4 py-2 hover:bg-[#32353b] transition-colors cursor-pointer" onClick={() => setIsExpanded(true)}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Pin className="w-4 h-4 text-[#b5bac1] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#f2f3f5] font-medium">
                {pinnedMessages.length} Pinned Message{pinnedMessages.length !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-[#949ba4] truncate">
                {typeof latestPinned.senderId === 'object' && latestPinned.senderId.username}: {latestPinned.content}
              </div>
            </div>
          </div>
          <button
            className="text-[#b5bac1] hover:text-[#dbdee1] transition-colors p-1"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(true)
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current">
              <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#1e1f22] scrollbar-track-transparent">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e1f22] sticky top-0 bg-[#2b2d31] z-10">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-[#b5bac1]" />
              <span className="text-sm text-[#f2f3f5] font-medium">
                Pinned Messages
              </span>
            </div>
            <button
              className="text-[#b5bac1] hover:text-[#dbdee1] transition-colors p-1"
              onClick={() => setIsExpanded(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="divide-y divide-[#1e1f22]">
            {pinnedMessages.map((message) => (
              <PinnedMessageItem key={message._id} message={message} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PinnedMessageItem({ message }: { message: Message }) {
  const sender = typeof message.senderId === 'object' ? message.senderId : null
  const senderName = sender?.username || 'User'
  const avatar = sender?.avatar

  const date = new Date(message.createdAt)
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="px-4 py-3 hover:bg-[#32353b] transition-colors">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={senderName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            senderName.slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-[#f2f3f5] text-sm">{senderName}</span>
            <span className="text-xs text-[#949ba4]">{dateStr}</span>
          </div>
          <div className="text-sm text-[#dbdee1] break-words line-clamp-3">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  )
}
