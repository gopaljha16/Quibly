'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useChannelsData } from '@/hooks/useChannelsData'
import { useMessagesData } from '@/hooks/useMessagesData'
import { useLinkPreviews } from '@/lib/useLinkPreviews'
import { useUIStore } from '@/lib/store'
import { useProfile } from '@/hooks/queries'
import LinkPreview from '@/components/LinkPreview'
import LinkifiedText from '@/components/LinkifiedText'
import { VoiceChannelPanel } from '@/components/channels/VoiceChannelPanel'
import FriendsDashboard from '@/components/friends/FriendsDashboard'
import { useDMRoom } from '@/hooks/queries'
import { useRemoveFriend, useBlockUser, useAddFriend } from '@/hooks/queries/useFriendQueries'
import { Message } from '@/hooks/queries'
import { MessageListSkeleton } from '@/components/LoadingSkeletons'

// Message Item Component
const MessageItem = ({
  message,
  onEdit,
  onDelete,
  currentUser
}: {
  message: Message
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
  currentUser?: any
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { firstUrl } = useLinkPreviews(message.content)

  const isSenderMe = typeof message.senderId === 'object' && message.senderId._id === currentUser?._id
  
  const senderInfo = isSenderMe ? currentUser : (typeof message.senderId === 'object' ? message.senderId : null)
  
  const sender = senderInfo?.username || 'User'
  const avatar = senderInfo?.avatar

  const date = new Date(message.createdAt)
  const today = new Date()
  const isToday = date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  const timeStr = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })

  const dateStr = isToday
    ? `Today at ${timeStr}`
    : isYesterday
      ? `Yesterday at ${timeStr}`
      : `${date.toLocaleDateString()} ${timeStr}`

  const initials = sender?.slice(0, 1).toUpperCase() || 'U'
  const canAct = !message._id.startsWith('optimistic-')

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div className={`group flex gap-4 px-4 py-0.5 hover:bg-[#2e3035] relative mt-[1.0625rem] first:mt-2 ${menuOpen ? 'bg-[#2e3035]' : ''}`}>
      <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5 cursor-pointer hover:drop-shadow-md transition-all active:translate-y-px">
        {avatar ? (
          <img
            src={avatar}
            alt={sender}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-[#f2f3f5] hover:underline cursor-pointer">
            {sender}
          </span>
          <span className="text-[0.75rem] text-[#949ba4] font-medium">{dateStr}</span>
          {message.editedAt && (
            <span className="text-[0.625rem] text-[#949ba4]">(edited)</span>
          )}
        </div>

        <div className="text-[#dbdee1] break-words leading-[1.375rem]">
          <LinkifiedText
            text={message.content}
            className="whitespace-pre-wrap"
            linkClassName="text-[#5865f2] hover:underline cursor-pointer transition-colors"
          />
        </div>

        {firstUrl && (
          <div className="mt-2 max-w-[432px]">
            <LinkPreview url={firstUrl} />
          </div>
        )}
      </div>

      {canAct && (
        <div className={`absolute -top-4 right-4 ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity z-10`}>
          <div className="bg-[#1a1a1a] rounded shadow-sm border border-[#2a2a2a] flex items-center p-0.5 transition-transform hover:scale-[1.02]">
            <button
              onClick={() => onEdit(message._id, message.content)}
              className="p-1.5 hover:bg-[#2a2a2a] text-[#b4b4b4] hover:text-white rounded transition-colors relative group/tooltip"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current">
                <path fillRule="evenodd" clipRule="evenodd" d="M19.2929 9.8299L19.9409 9.18278C21.353 7.77064 21.353 5.47197 19.9409 4.05892C18.5287 2.64678 16.2292 2.64678 14.817 4.05892L14.1699 4.70694L19.2929 9.8299ZM12.8962 5.97688L5.18469 13.6906L10.3085 18.8129L18.0192 11.1001L12.8962 5.97688ZM4.11851 20.9704L8.75906 19.8112L4.18692 15.239L3.02678 19.8796C2.95028 20.1856 3.04028 20.5105 3.26349 20.7337C3.48669 20.9569 3.8116 21.046 4.11851 20.9704Z" />
              </svg>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-semibold">
                Edit
              </div>
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-1.5 hover:bg-[#2a2a2a] text-[#b4b4b4] hover:text-white rounded transition-colors relative group/tooltip ${menuOpen ? 'bg-[#2a2a2a] text-white' : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current">
                <path fillRule="evenodd" clipRule="evenodd" d="M7 12.001C7 10.8964 6.10457 10.001 5 10.001C3.89543 10.001 3 10.8964 3 12.001C3 13.1055 3.89543 14.001 5 14.001C6.10457 14.001 7 13.1055 7 12.001ZM14 12.001C14 10.8964 13.1046 10.001 12 10.001C10.8954 10.001 10 10.8964 10 12.001C10 13.1055 10.8954 14.001 12 14.001C13.1046 14.001 14 13.1055 14 12.001ZM19 10.001C20.1046 10.001 21 10.8964 21 12.001C21 13.1055 20.1046 14.001 19 14.001C17.8954 14.001 17 13.1055 17 12.001C17 10.8964 17.8954 10.001 19 10.001Z" />
              </svg>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-semibold">
                More
              </div>
            </button>
          </div>

          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute top-full right-0 mt-1 w-[188px] bg-[#202020] rounded shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1.5 z-50"
            >
              <button
                onClick={() => {
                  onDelete(message._id)
                  setMenuOpen(false)
                }}
                className="w-full text-left px-2 py-1.5 text-sm text-[#DA373C] hover:bg-[#DA373C] hover:text-white rounded-[2px] transition-colors flex items-center justify-between group/item"
              >
                Delete Message
                <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current hidden group-hover/item:block">
                  <path fillRule="evenodd" clipRule="evenodd" d="M15 3.999V2H9V3.999H3V5.999H21V3.999H15Z M5 6.999V22H19V6.999H5ZM8.61538 17.999H6.46154V9.999H8.61538V17.999ZM13.0769 17.999H10.9231V9.999H13.0769V17.999ZM17.5385 17.999H15.3846V9.999H17.5385V17.999Z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Message Input Component
const MessageInput = ({
  channelName,
  value,
  onChange,
  onSend,
  disabled,
  isMe
}: {
  channelName: string
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled: boolean
  isMe?: boolean
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [value])

  return (
    <div className="px-4 pb-6 bg-[#313338] flex-shrink-0 z-10">
      <div className="bg-[#383a40] rounded-lg focus-within:ring-1 focus-within:ring-[#00a8fc] transition-all relative">
        <div className="absolute left-4 top-[10px] flex items-center">
          <button className="w-6 h-6 rounded-full bg-[#b5bac1] hover:bg-[#d1d5da] text-[#313338] flex items-center justify-center transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current font-bold">
              <path fillRule="evenodd" clipRule="evenodd" d="M13 11V4H11V11H4V13H11V20H13V13H20V11H13Z" />
            </svg>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="w-full bg-transparent pl-[52px] pr-12 py-[11px] text-[#dbdee1] placeholder-[#87898c] resize-none outline-none min-h-[44px] max-h-[200px] leading-[1.375rem] font-normal"
          placeholder={isMe ? `Message @${channelName}` : `Message #${channelName}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />

        <div className="absolute right-3 top-[8px] flex items-center gap-2">
          <button className="text-[#b5bac1] hover:text-[#dbdee1] transition-colors" title="Send a gift">
            <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
              <path d="M16.886 7.999H20C21.104 7.999 22 8.896 22 9.999V11.999H2V9.999C2 8.896 2.897 7.999 4 7.999H7.114C6.663 7.764 6.236 7.477 5.879 7.121C4.709 5.951 4.709 4.048 5.879 2.879C7.012 1.746 8.986 1.746 10.121 2.877L12 4.757L13.879 2.877C15.014 1.742 16.986 1.746 18.121 2.877C19.29 4.046 19.29 5.949 18.121 7.119C17.764 7.477 17.337 7.764 16.886 7.999ZM7.293 5.707C6.903 5.316 6.903 4.682 7.293 4.292C7.481 4.103 7.732 4 8 4C8.268 4 8.519 4.103 8.707 4.292L12 7.586L15.293 4.292C15.481 4.103 15.732 4 16 4C16.268 4 16.519 4.103 16.707 4.292C17.097 4.682 17.097 5.316 16.707 5.707L13.414 8.999H10.586L7.293 5.707ZM20 13.999V19.999C20 21.102 19.104 21.999 18 21.999H6C4.897 21.999 4 21.102 4 19.999V13.999H11V17.999H13V13.999H20Z" />
            </svg>
          </button>
          <button className="text-[#b5bac1] hover:text-[#dbdee1] transition-colors" title="GIF">
            <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
              <path d="M2 2C0.895 2 0 2.895 0 4V20C0 21.105 0.895 22 2 22H22C23.105 22 24 21.105 24 20V4C24 2.895 23.105 2 22 2H2ZM11 8H13V16H11V8ZM15 8H17V16H15V8ZM7 8H9V12H7V16H5V8H7Z" />
            </svg>
          </button>
          <button className="text-[#b5bac1] hover:text-[#dbdee1] transition-colors" title="Sticker">
            <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
              <path d="M12 0C5.373 0 0 5.373 0 12C0 18.627 5.373 24 12 24C12.894 24 13.766 23.902 14.604 23.716L14.154 21.757C13.457 21.916 12.737 22 12 22C6.486 22 2 17.514 2 12C2 6.486 6.486 2 12 2C17.514 2 22 6.486 22 12C22 12.737 21.916 13.457 21.757 14.154L23.716 14.604C23.902 13.766 24 12.894 24 12C24 5.373 18.627 0 12 0ZM12 4C9.794 4 8 5.794 8 8C8 10.206 9.794 12 12 12C14.206 12 16 10.206 16 8C16 5.794 14.206 4 12 4ZM12 6C13.103 6 14 6.897 14 8C14 9.103 13.103 10 12 10C10.897 10 10 9.103 10 8C10 6.897 10.897 6 12 6ZM18.793 13.793L13.5 19.086L11.914 17.5L10.5 18.914L13.5 21.914L20.207 15.207L18.793 13.793Z" />
            </svg>
          </button>
          <button className="text-[#b5bac1] hover:text-[#dbdee1] transition-colors" title="Emoji">
            <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current transform scale-90">
              <path fillRule="evenodd" clipRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12ZM20 12C20 16.418 16.418 20 12 20C7.582 20 4 16.418 4 12C4 7.582 7.582 4 12 4C16.418 4 20 7.582 20 12Z" />
              <path fillRule="evenodd" clipRule="evenodd" d="M13 9.5C13 10.328 13.672 11 14.5 11C15.328 11 16 10.328 16 9.5C16 8.672 15.328 8 14.5 8C13.672 8 13 8.672 13 9.5ZM9.5 8C8.672 8 8 8.672 8 9.5C8 10.328 8.672 11 9.5 11C10.328 11 11 10.328 11 9.5C11 8.672 10.328 8 9.5 8Z" />
              <path fillRule="evenodd" clipRule="evenodd" d="M12 17.5C14.33 17.5 16.315 16.052 17.11 14H6.89C7.685 16.052 9.67 17.5 12 17.5Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ChannelsPage() {
  const { route, channels, channelsLoading, selectedChannel } = useChannelsData()
  const { data: currentUser } = useProfile()
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Fetch DM room data if applicable
  const { data: dmRoom, isLoading: dmLoading } = useDMRoom(route.isMe ? route.channelId : null)

  // Use new messages hook
  const {
    messages,
    messagesLoading,
    messagesError,
    draft,
    updateDraft,
    sendMessage,
    sending,
    editingMessageId,
    editingMessageContent,
    startEditing,
    cancelEditing,
    saveEdit,
    editing,
    deleteMessage,
  } = useMessagesData(
    route.isMe ? (route.channelId || null) : (selectedChannel?._id || null),
    route.isMe ? 'dm' : 'channel'
  )

  const { mutate: removeFriend, isPending: removingFriend } = useRemoveFriend()
  const { mutate: blockUser, isPending: blockingUser } = useBlockUser()
  const { mutate: addFriend, isPending: addingFriend } = useAddFriend()

  const handleAddFriendAction = () => {
    const username = dmRoom?.otherUser?.username;
    const discriminator = dmRoom?.otherUser?.discriminator;
    if (username && discriminator) {
      addFriend({ username, discriminator });
    }
  }

  const handleRemoveFriendAction = () => {
    const friendId = dmRoom?.otherUser?.id;
    if (friendId && window.confirm(`Are you sure you want to remove ${dmRoom.otherUser?.username} as a friend?`)) {
      removeFriend(friendId);
    }
  }

  const handleBlockUserAction = () => {
    const userIdToBlock = dmRoom?.otherUser?.id;
    if (userIdToBlock && window.confirm(`Are you sure you want to block ${dmRoom.otherUser?.username}?`)) {
      blockUser(userIdToBlock);
    }
  }

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [messages])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sortedMessages.length, selectedChannel?._id])

  const handleSend = async () => {
    if (!draft.trim()) return
    try {
      await sendMessage(draft)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('Delete this message permanently? This action cannot be undone.')) return
    try {
      await deleteMessage(messageId)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  // Check if current channel is a voice channel
  const isVoiceChannel = selectedChannel?.type === 'VOICE'

  // If we are in the "Me" section but no channel is selected, show Friends Dashboard
  if (route.isMe && !route.channelId) {
    return <FriendsDashboard />
  }

  // If it's a voice channel, show the voice panel
  if (!route.isMe && selectedChannel && isVoiceChannel && currentUser) {
    return (
      <VoiceChannelPanel
        channelId={selectedChannel._id}
        channelName={selectedChannel.name}
        currentUser={{
          id: currentUser._id,
          username: currentUser.username,
          avatar: currentUser.avatar || undefined,
        }}
      />
    )
  }

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0 bg-[#313338]">
        {/* Show placeholder if no conversation selected */}
        {((!selectedChannel && !route.isMe) || (route.isMe && !route.channelId)) ? (
          <div className="flex items-center justify-center h-full">
            {route.isMe ? (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#5865f2] flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" className="fill-current text-white">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Friends</h2>
                <p className="text-[#b4b4b4]">Start a conversation with your friends!</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-[#b4b4b4] text-lg">Select a conversation to start chatting</div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1e1f22] scrollbar-track-transparent">
              <div className="flex flex-col justify-end min-h-full">
                {!messagesLoading && sortedMessages.length < 50 && (
                  <div className="px-4 pt-12 pb-4">
                    <div className={`w-[80px] h-[80px] rounded-full flex items-center justify-center mb-4 ${route.isMe ? 'bg-[#5865f2]' : 'bg-[#1a1a1a]'} overflow-hidden`}>
                      {route.isMe ? (
                        dmRoom?.otherUser?.avatar ? (
                          <img src={dmRoom.otherUser.avatar} alt={dmRoom.otherUser.username} className="w-full h-full object-cover" />
                        ) : (
                          <svg width="48" height="48" viewBox="0 0 28 20" className="fill-current text-white">
                            <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461744 10.3368 0.00546311C8.48074 0.324393 6.67795 0.885118 4.96746 1.68231C1.56727 6.77853 0.649666 11.7538 1.11108 16.652C3.10102 18.1418 5.3262 19.2743 7.69177 20C8.22338 19.2743 8.69519 18.4993 9.09812 17.691C8.32996 17.3997 7.58522 17.0424 6.87684 16.6291C7.06531 16.4979 7.25183 16.3615 7.43624 16.2202C11.4193 18.0402 15.9176 18.0402 19.8555 16.2202C20.0403 16.3615 20.2268 16.4979 20.4148 16.6291C19.7059 17.0427 18.9606 17.4 18.1921 17.691C18.5949 18.4993 19.0667 19.2743 19.5984 20C21.9639 19.2743 24.1894 18.1418 26.1794 16.652C26.7228 11.0369 25.2119 6.10654 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0395 9.54272 12.0187 10.994C12.0187 12.4453 10.9893 13.6383 9.68041 13.6383ZM18.5129 13.6383C17.2271 13.6383 16.1703 12.4453 16.1703 10.994C16.1703 9.54272 17.2009 8.34973 18.5129 8.34973C19.8248 8.34973 20.8751 9.54272 20.8542 10.994C20.8542 12.4453 19.8228 13.6383 18.5129 13.6383Z" />
                          </svg>
                        )
                      ) : (
                        <svg width="42" height="42" viewBox="0 0 24 24" className="fill-current text-white">
                          <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41001 9L8.35001 15H14.35L15.41 9H9.41001Z" />
                        </svg>
                      )}
                    </div>
                    <h1 className="text-[32px] font-bold text-white mb-0 flex items-baseline gap-2">
                      {route.isMe ? (dmRoom?.otherUser?.username || 'User') : `Welcome to #${selectedChannel?.name}!`}
                      {route.isMe && dmRoom?.otherUser && (
                        <span className="text-[#b5bac1] text-2xl font-medium ml-1">
                          #{dmRoom.otherUser.discriminator || '0000'}
                        </span>
                      )}
                    </h1>
                    {route.isMe && (
                      <div className="text-[20px] font-medium text-[#f2f3f5] mb-4">
                        {dmRoom?.otherUser?.username?.toLowerCase()}.{dmRoom?.otherUser?.discriminator || '0000'}
                      </div>
                    )}
                    <p className="text-[#b4b4b4] text-base mb-4">
                      This is the beginning of your {route.isMe ? 'direct message history' : 'conversation'} with{' '}
                      <span className="font-semibold text-white">
                        {route.isMe ? `${dmRoom?.otherUser?.username || 'this user'}` : `#${selectedChannel?.name}`}
                      </span>.
                    </p>
                    {route.isMe && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          {dmLoading ? (
                            <span className="text-[#b4b4b4] text-sm animate-pulse italic">Checking for mutual servers...</span>
                          ) : dmRoom?.mutualServers && dmRoom.mutualServers.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {dmRoom.mutualServers.slice(0, 3).map((server) => (
                                  <div 
                                    key={server.id} 
                                    className="w-8 h-8 rounded-full border-[3px] border-[#313338] bg-[#2b2d31] flex items-center justify-center overflow-hidden"
                                    title={server.name}
                                  >
                                    {server.icon ? (
                                      <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[10px] font-bold text-[#b5bac1]">{server.name[0]}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <span className="text-[#00aff4] hover:underline cursor-pointer text-sm font-medium">
                                {dmRoom.mutualServers.length} Mutual Server{dmRoom.mutualServers.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#b4b4b4] text-sm">No servers in common</span>
                          )}
                        </div>
                        
                         <div className="flex items-center gap-3">
                        {dmRoom?.friendshipStatus === 'ACCEPTED' ? (
                          <button 
                            onClick={handleRemoveFriendAction}
                            disabled={removingFriend}
                            className="px-4 py-1.5 rounded-[4px] bg-[#35373c] hover:bg-[#4e5058] text-white text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {removingFriend ? 'Removing...' : 'Remove Friend'}
                          </button>
                        ) : dmRoom?.friendshipStatus === 'PENDING' ? (
                          <button 
                            disabled
                            className="px-4 py-1.5 rounded-[4px] bg-[#35373c] text-[#b5bac1] text-sm font-medium opacity-50 cursor-not-allowed"
                          >
                            Friend Request Sent
                          </button>
                        ) : dmRoom?.friendshipStatus !== 'BLOCKED' ? (
                          <button 
                            onClick={handleAddFriendAction}
                            disabled={addingFriend}
                            className="px-4 py-1.5 rounded-[4px] bg-[#248046] hover:bg-[#1a5b32] text-white text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {addingFriend ? 'Adding...' : 'Add Friend'}
                          </button>
                        ) : (
                          <button 
                            disabled
                            className="px-4 py-1.5 rounded-[4px] bg-[#35373c] text-[#b5bac1] text-sm font-medium opacity-50 cursor-not-allowed"
                          >
                            Blocked
                          </button>
                        )}

                        <button 
                          onClick={handleBlockUserAction}
                          disabled={blockingUser}
                          className="px-4 py-1.5 rounded-[4px] bg-[#35373c] hover:bg-[#4e5058] text-white text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {blockingUser ? 'Blocking...' : 'Block'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

                {messagesError && (
                  <div className="mx-4 my-2 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {messagesError instanceof Error ? messagesError.message : String(messagesError)}
                  </div>
                )}

                {messagesLoading ? (
                  <MessageListSkeleton />
                ) : sortedMessages.length === 0 ? null : (
                  <div className="flex flex-col pb-4">
                    {sortedMessages.map((message) => (
                      <MessageItem
                        key={message._id}
                        message={message}
                        onEdit={startEditing}
                        onDelete={handleDelete}
                        currentUser={currentUser}
                      />
                    ))}
                  </div>
                )}

                <div ref={bottomRef} className="h-0" />
              </div>
            </div>

            <MessageInput
              channelName={route.isMe ? (dmRoom?.otherUser?.username || 'User') : (selectedChannel?.name || 'channel')}
              value={draft}
              onChange={updateDraft}
              onSend={handleSend}
              disabled={sending}
              isMe={route.isMe}
            />
          </>
        )}
      </div>

      {!route.isMe && selectedChannel && route.isMe === false && (
        <div className="hidden" />
      )}

      {editingMessageId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cancelEditing()
          }}
        >
          <div className="w-[520px] max-w-[92vw] rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
            <div className="text-lg font-semibold text-white mb-4">Edit Message</div>
            <textarea
              className="w-full min-h-24 rounded bg-[#141414] border border-[#2a2a2a] px-3 py-2 text-sm outline-none focus:border-[#4a9eff] text-white resize-none"
              value={editingMessageContent}
              onChange={(e) => {
                // Update editing content in Zustand
                const { startEditingMessage } = useUIStore.getState()
                startEditingMessage(editingMessageId, e.target.value)
              }}
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded bg-transparent hover:bg-[#2a2a2a] text-sm text-white"
                onClick={cancelEditing}
                disabled={editing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-gradient-to-r from-[#23a559] to-[#4a9eff] hover:from-[#2bc46a] hover:to-[#5aafff] text-sm text-white font-bold disabled:opacity-60"
                disabled={editing || !editingMessageContent.trim()}
                onClick={saveEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
