'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChannels } from '@/components/channels/ChannelsProvider'
import { apiGet, apiPost, apiRequest, ApiError } from '@/lib/api'
import { type Socket } from 'socket.io-client'
import { connectSocket } from '@/lib/socket'
import { useLinkPreviews } from '@/lib/useLinkPreviews'
import LinkPreview from '@/components/LinkPreview'
import LinkifiedText from '@/components/LinkifiedText'

type Message = {
  _id: string
  channelId: string
  serverId?: string
  senderId:
    | string
    | {
        _id: string
        username: string
        avatar?: string | null
      }
  content: string
  createdAt: string
  editedAt?: string | null
}

// Enhanced Message Component
const MessageItem = ({ 
  message, 
  isOwn, 
  onEdit, 
  onDelete 
}: { 
  message: Message
  isOwn: boolean
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { urls, hasLinks, firstUrl } = useLinkPreviews(message.content)
  
  const sender = typeof message.senderId === 'string' 
    ? message.senderId === 'me' ? 'You' : message.senderId
    : message.senderId.username
    
  const time = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  
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
    <div className="group flex gap-4 px-4 py-2 hover:bg-black/5 relative">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
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
      
      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-semibold text-white hover:underline cursor-pointer">
            {sender}
          </span>
          <span className="text-xs text-white/50">{time}</span>
          {message.editedAt && (
            <span className="text-xs text-white/40">(edited)</span>
          )}
        </div>
        
        <div className="text-white/90 break-words mb-2">
          <LinkifiedText 
            text={message.content} 
            className="whitespace-pre-wrap"
            linkClassName="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer transition-colors"
          />
        </div>

        {/* Link Previews */}
        {hasLinks && firstUrl && (
          <div className="mt-2">
            <LinkPreview url={firstUrl} />
          </div>
        )}
      </div>
      
      {/* Message Actions */}
      {canAct && (
        <div className="absolute top-0 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-[#2f3136] border border-black/20 rounded shadow-lg flex">
            <button
              onClick={() => onEdit(message._id, message.content)}
              className="p-2 hover:bg-white/10 transition-colors"
              title="Edit"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current text-white/70">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-white/10 transition-colors"
              title="More"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current text-white/70">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
          
          {menuOpen && (
            <div 
              ref={menuRef}
              className="absolute top-full right-0 mt-1 w-32 bg-[#18191c] border border-black/20 rounded shadow-lg z-50"
            >
              <button
                onClick={() => {
                  onDelete(message._id)
                  setMenuOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Enhanced Message Input
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
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [value])
  
  return (
    <div className="px-4 pb-6">
      <div className="bg-[#40444b] rounded-lg border border-black/20 focus-within:border-[#5865f2] transition-colors">
        <textarea
          ref={textareaRef}
          className="w-full bg-transparent px-4 py-3 text-white placeholder-white/50 resize-none outline-none min-h-[44px] max-h-[200px]"
          placeholder={`Message #${channelName}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2">
            <button className="w-6 h-6 text-white/50 hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </button>
            <button className="w-6 h-6 text-white/50 hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
            </button>
          </div>
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="px-4 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium text-white transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EnhancedChannelsPage() {
  const router = useRouter()
  const { route, channels, channelsLoading, selectedChannel } = useChannels()

  const [meUsername, setMeUsername] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const [editMessageId, setEditMessageId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editing, setEditing] = useState(false)

  const socketRef = useRef<Socket | null>(null)
  const joinedChannelIdRef = useRef<string | null>(null)
  const selectedChannelId = selectedChannel?._id || null

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [messages])

  // Load user profile
  useEffect(() => {
    let cancelled = false
    const loadMe = async () => {
      try {
        const res = await apiGet<any>('/auth/profile')
        const username = res?.user?.username || res?.username || null
        if (!cancelled) setMeUsername(typeof username === 'string' ? username : null)
      } catch {
        if (!cancelled) setMeUsername(null)
      }
    }
    void loadMe()
    return () => { cancelled = true }
  }, [])

  // Socket connection
  useEffect(() => {
    const socket = connectSocket()
    socketRef.current = socket

    const onReceiveMessage = (incoming: unknown) => {
      const msg = incoming as any
      const id = msg?._id
      if (typeof id !== 'string') return

      const normalized: Message = {
        _id: id,
        channelId: String(msg.channelId || selectedChannelId || ''),
        serverId: msg.serverId,
        senderId: msg.senderId,
        content: String(msg.content || ''),
        createdAt: msg.createdAt ? String(msg.createdAt) : new Date().toISOString(),
        editedAt: msg.editedAt ?? null,
      }

      setMessages((prev) => {
        const exists = prev.some((m) => m._id === normalized._id)
        if (exists) {
          return prev.map((m) => (m._id === normalized._id ? { ...m, ...normalized } : m))
        }
        return [...prev, normalized]
      })
    }

    const onMessageDeleted = (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m._id !== data.messageId))
    }

    socket.on('receive_message', onReceiveMessage)
    socket.on('message_deleted', onMessageDeleted)
    
    return () => {
      try {
        socket.off('receive_message', onReceiveMessage)
        socket.off('message_deleted', onMessageDeleted)
      } finally {
        socketRef.current = null
        joinedChannelIdRef.current = null
      }
    }
  }, [selectedChannelId])

  // Channel navigation
  useEffect(() => {
    if (route.isMe) return
    if (!route.serverId) return
    if (channelsLoading) return

    if (!route.channelId && channels.length > 0) {
      router.replace(`/channels/${route.serverId}/${channels[0]._id}`)
    }
  }, [channels, channelsLoading, route.channelId, route.isMe, route.serverId, router])

  // Load messages
  useEffect(() => {
    const cid = selectedChannelId
    if (!cid) {
      setMessages([])
      setMessagesError(null)
      return
    }

    const socket = socketRef.current
    const prevJoined = joinedChannelIdRef.current
    if (socket && prevJoined && prevJoined !== cid) {
      socket.emit('leave_channel', prevJoined)
      joinedChannelIdRef.current = null
    }
    if (socket && joinedChannelIdRef.current !== cid) {
      socket.emit('join_channel', cid)
      joinedChannelIdRef.current = cid
    }

    let cancelled = false
    const load = async () => {
      setMessagesLoading(true)
      setMessagesError(null)
      try {
        const data = await apiGet<Message[]>(`/message/${cid}`)
        if (!cancelled) setMessages(data)
      } catch (e) {
        if (e instanceof ApiError) {
          if (!cancelled) setMessagesError(e.message)
          return
        }
        if (!cancelled) setMessagesError('Failed to load messages')
      } finally {
        if (!cancelled) setMessagesLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [selectedChannelId])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sortedMessages.length, selectedChannelId])

  const onSend = async () => {
    const cid = selectedChannelId
    const content = draft.trim()
    if (!cid || !content) return

    setSending(true)
    setDraft('')

    // Optimistic update
    const optimistic: Message = {
      _id: `optimistic-${Date.now()}`,
      channelId: cid,
      senderId: {
        _id: 'me',
        username: meUsername || 'You',
      },
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const created = await apiPost<Message>('/message', { channelId: cid, content })
      setMessages((prev) => {
        const hasCreated = prev.some((m) => m._id === created._id)
        const withoutOptimistic = prev.filter((m) => m._id !== optimistic._id)
        if (hasCreated) return withoutOptimistic
        return [...withoutOptimistic, created]
      })
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id))
      setDraft(content)
      if (e instanceof ApiError) {
        setMessagesError(e.message)
        return
      }
      setMessagesError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleEdit = (id: string, content: string) => {
    setEditMessageId(id)
    setEditValue(content)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message permanently? This action cannot be undone.')) return
    try {
      await apiRequest<{ success: boolean; messageId: string }>(`/message/${id}`, { 
        method: 'DELETE' 
      })
      // Remove message immediately from local state
      setMessages((prev) => prev.filter((m) => m._id !== id))
    } catch (e) {
      if (e instanceof ApiError) {
        setMessagesError(e.message)
        return
      }
      setMessagesError('Failed to delete message')
    }
  }

  const saveEdit = async () => {
    const id = editMessageId
    const content = editValue.trim()
    if (!id || !content) return
    
    setEditing(true)
    try {
      const updated = await apiRequest<Message>(`/message/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      })
      setMessages((prev) => prev.map((m) => (m._id === id ? updated : m)))
      setEditMessageId(null)
    } catch (e) {
      if (e instanceof ApiError) {
        setMessagesError(e.message)
        return
      }
      setMessagesError('Failed to edit message')
    } finally {
      setEditing(false)
    }
  }

  return (
    <>
      {/* Messages Area */}
      <div className="flex-1 overflow-auto">
        {route.isMe ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#5865f2] flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" className="fill-current text-white">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Friends</h2>
              <p className="text-white/60">Start a conversation with your friends!</p>
            </div>
          </div>
        ) : !selectedChannel ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-white/70 text-lg">Select a channel to start chatting</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Channel Welcome */}
            <div className="px-4 py-6 border-b border-black/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-16 h-16 rounded-full bg-[#5865f2] flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" className="fill-current text-white">
                    <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41001 9L8.35001 15H14.35L15.41 9H9.41001Z"/>
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome to #{selectedChannel.name}!</h1>
              <p className="text-white/60">This is the start of the #{selectedChannel.name} channel.</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto">
              {messagesError && (
                <div className="mx-4 my-2 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {messagesError}
                </div>
              )}

              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-white/50">Loading messages...</div>
                </div>
              ) : sortedMessages.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-white/50">No messages yet. Be the first to say something!</div>
                </div>
              ) : (
                <div className="py-4">
                  {sortedMessages.map((message) => (
                    <MessageItem
                      key={message._id}
                      message={message}
                      isOwn={typeof message.senderId === 'object' && message.senderId._id === 'me'}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      {!route.isMe && selectedChannel && (
        <MessageInput
          channelName={selectedChannel.name}
          value={draft}
          onChange={setDraft}
          onSend={onSend}
          disabled={sending}
        />
      )}

      {/* Edit Message Modal */}
      {editMessageId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditMessageId(null)
          }}
        >
          <div className="w-[520px] max-w-[92vw] rounded-xl border border-black/20 bg-[#36393f] p-6">
            <div className="text-lg font-semibold text-white mb-4">Edit Message</div>
            <textarea
              className="w-full min-h-24 rounded bg-[#40444b] border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#5865f2] text-white resize-none"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded bg-transparent hover:bg-white/5 text-sm text-white"
                onClick={() => setEditMessageId(null)}
                disabled={editing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-[#5865f2] hover:bg-[#4752c4] text-sm text-white disabled:opacity-60"
                disabled={editing || !editValue.trim()}
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