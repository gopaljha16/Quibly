'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useChannelsData } from '@/hooks/useChannelsData'
import { useMessagesData } from '@/hooks/useMessagesData'
import { useLinkPreviews } from '@/lib/useLinkPreviews'
import { useUIStore } from '@/lib/store'
import LinkPreview from '@/components/LinkPreview'
import LinkifiedText from '@/components/LinkifiedText'
import { Message } from '@/hooks/queries'
import { MessageListSkeleton } from '@/components/LoadingSkeletons'

// Message Item Component
const MessageItem = ({
  message,
  onEdit,
  onDelete
}: {
  message: Message
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { firstUrl } = useLinkPreviews(message.content)

  const sender = typeof message.senderId === 'string'
    ? message.senderId === 'me' ? 'You' : message.senderId
    : message.senderId.username

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
    <div className={`group flex gap-4 px-4 py-0.5 hover:bg-[#2e3035]/60 relative mt-[1.0625rem] first:mt-2 ${menuOpen ? 'bg-[#2e3035]/60' : ''}`}>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f3c178] to-[#f35e41] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5 cursor-pointer hover:drop-shadow-md transition-all active:translate-y-px">
        {typeof message.senderId === 'object' && message.senderId.avatar ? (
          <img
            src={message.senderId.avatar}
            alt={sender}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white hover:underline cursor-pointer">
            {sender}
          </span>
          <span className="text-[0.75rem] text-[#949BA4] font-medium">{dateStr}</span>
          {message.editedAt && (
            <span className="text-[0.625rem] text-[#949BA4]">(edited)</span>
          )}
        </div>

        <div className="text-[#DBDEE1] break-words leading-[1.375rem]">
          <LinkifiedText
            text={message.content}
            className="whitespace-pre-wrap"
            linkClassName="text-[#f3c178] hover:underline cursor-pointer transition-colors"
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
          <div className="bg-[#313338] rounded shadow-sm border border-[#26272D] flex items-center p-0.5 transition-transform hover:scale-[1.02]">
            <button
              onClick={() => onEdit(message._id, message.content)}
              className="p-1.5 hover:bg-[#404249] text-[#B5BAC1] hover:text-[#DBDEE1] rounded transition-colors relative group/tooltip"
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
              className={`p-1.5 hover:bg-[#404249] text-[#B5BAC1] hover:text-[#DBDEE1] rounded transition-colors relative group/tooltip ${menuOpen ? 'bg-[#404249] text-[#DBDEE1]' : ''}`}
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
              className="absolute top-full right-0 mt-1 w-[188px] bg-[#111214] rounded shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1.5 z-50"
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
  disabled
}: {
  channelName: string
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled: boolean
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
    <div className="px-4 pb-6 bg-[#0b0500] flex-shrink-0 z-10">
      <div className="bg-[#1a1510] rounded-lg focus-within:ring-1 focus-within:ring-[#f3c178] transition-all relative">
        <div className="absolute left-4 top-[10px] flex items-center">
          <button className="w-6 h-6 rounded-full bg-[#B5BAC1] hover:text-[#DBDEE1] text-[#313338] flex items-center justify-center transition-colors hover:bg-[#D1D5DA]">
            <svg width="14" height="14" viewBox="0 0 24 24" className="fill-current font-bold">
              <path fillRule="evenodd" clipRule="evenodd" d="M13 11V4H11V11H4V13H11V20H13V13H20V11H13Z" />
            </svg>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="w-full bg-transparent pl-[52px] pr-12 py-[11px] text-[#DBDEE1] placeholder-[#949BA4] resize-none outline-none min-h-[44px] max-h-[200px] leading-[1.375rem] font-normal"
          placeholder={`Message #${channelName}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />

        <div className="absolute right-3 top-[8px] flex items-center gap-3">
          <button className="text-[#B5BAC1] hover:text-[#DBDEE1] transition-colors">
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
  const bottomRef = useRef<HTMLDivElement | null>(null)

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
  } = useMessagesData(selectedChannel?._id || null)

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

  return (
    <>
      <div className="flex-1 overflow-auto bg-[#0b0500] scrollbar-thin scrollbar-thumb-[#1a1510] scrollbar-track-[#0b0500] flex flex-col">
        {route.isMe ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#f3c178] to-[#f35e41] flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" className="fill-current text-white">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Friends</h2>
              <p className="text-[#B5BAC1]">Start a conversation with your friends!</p>
            </div>
          </div>
        ) : !selectedChannel ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-[#B5BAC1] text-lg">Select a channel to start chatting</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 flex flex-col justify-end min-h-0">
              {!messagesLoading && sortedMessages.length < 50 && (
                <div className="px-4 pt-12 pb-4 mt-auto">
                  <div className="w-[68px] h-[68px] rounded-full bg-[#1a1510] flex items-center justify-center mb-4">
                    <svg width="42" height="42" viewBox="0 0 24 24" className="fill-current text-white">
                      <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41001 9L8.35001 15H14.35L15.41 9H9.41001Z" />
                    </svg>
                  </div>
                  <h1 className="text-[32px] font-bold text-white mb-2">Welcome to #{selectedChannel.name}!</h1>
                  <p className="text-[#B5BAC1] text-base">This is the start of the <span className="font-semibold text-white">#{selectedChannel.name}</span> channel.</p>
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
                    />
                  ))}
                </div>
              )}

              <div ref={bottomRef} className="h-0" />
            </div>
          </div>
        )}
      </div>

      {!route.isMe && selectedChannel && (
        <MessageInput
          channelName={selectedChannel.name}
          value={draft}
          onChange={updateDraft}
          onSend={handleSend}
          disabled={sending}
        />
      )}

      {editingMessageId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cancelEditing()
          }}
        >
          <div className="w-[520px] max-w-[92vw] rounded-xl border border-black/20 bg-[#1a1510] p-6">
            <div className="text-lg font-semibold text-white mb-4">Edit Message</div>
            <textarea
              className="w-full min-h-24 rounded bg-[#0d0805] border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#f3c178] text-white resize-none"
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
                className="px-4 py-2 rounded bg-transparent hover:bg-white/5 text-sm text-white"
                onClick={cancelEditing}
                disabled={editing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-gradient-to-r from-[#f3c178] to-[#f35e41] hover:from-[#e0a850] hover:to-[#e0442a] text-sm text-[#0b0500] font-bold disabled:opacity-60"
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
