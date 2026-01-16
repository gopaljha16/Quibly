'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChannels } from '@/components/channels/ChannelsProvider'
import { apiGet, apiPost, apiRequest, ApiError } from '@/lib/api'
import { io, type Socket } from 'socket.io-client'

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
  isDeleted?: boolean
}

export default function ChannelsPage() {
  const router = useRouter()
  const { route, channels, channelsLoading, selectedChannel } = useChannels()

  const [meUsername, setMeUsername] = useState<string | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const [messageMenuOpenId, setMessageMenuOpenId] = useState<string | null>(null)
  const messageMenuRef = useRef<HTMLDivElement | null>(null)
  const [editMessageId, setEditMessageId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editing, setEditing] = useState(false)

  const socketRef = useRef<Socket | null>(null)
  const joinedChannelIdRef = useRef<string | null>(null)

  const selectedChannelId = selectedChannel?._id || null

  const sortedMessages = useMemo(() => {
    // backend returns newest-first; render oldest-first
    return [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [messages])

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
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000').replace(/\/$/, '')

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
    })
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
        isDeleted: msg.isDeleted,
      }

      setMessages((prev) => {
        const exists = prev.some((m) => m._id === normalized._id)
        if (exists) {
          return prev.map((m) => (m._id === normalized._id ? { ...m, ...normalized } : m))
        }
        return [...prev, normalized]
      })
    }

    socket.on('receive_message', onReceiveMessage)
    return () => {
      try {
        socket.off('receive_message', onReceiveMessage)
        socket.disconnect()
      } finally {
        socketRef.current = null
        joinedChannelIdRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (route.isMe) return
    if (!route.serverId) return
    if (channelsLoading) return

    if (!route.channelId && channels.length > 0) {
      router.replace(`/channels/${route.serverId}/${channels[0]._id}`)
    }
  }, [channels, channelsLoading, route.channelId, route.isMe, route.serverId, router])

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
    return () => {
      cancelled = true
    }
  }, [selectedChannelId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sortedMessages.length, selectedChannelId])

  useEffect(() => {
    if (!messageMenuOpenId) return

    const onMouseDown = (e: MouseEvent) => {
      const el = messageMenuRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) {
        setMessageMenuOpenId(null)
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMessageMenuOpenId(null)
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [messageMenuOpenId])

  useEffect(() => {
    if (!editMessageId) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditMessageId(null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [editMessageId])

  const onSend = async () => {
    const cid = selectedChannelId
    const content = draft.trim()
    if (!cid || !content) return

    setSending(true)
    setDraft('')

    // optimistic
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
        // If socket already delivered it, just remove optimistic.
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

  return (
    <>
      <div className="flex-1 overflow-auto p-4">
        {route.isMe ? (
          <div className="text-white/70">Friends UI can be added here.</div>
        ) : !selectedChannel ? (
          <div className="text-white/70">Select a channel</div>
        ) : (
          <div className="space-y-3">
            {messagesError && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {messagesError}
              </div>
            )}

            {messagesLoading ? (
              <div className="text-white/50 text-sm">Loading messages...</div>
            ) : sortedMessages.length === 0 ? (
              <div className="text-white/50 text-sm">No messages yet. Say hi!</div>
            ) : (
              sortedMessages.map((m) => {
                const sender =
                  typeof m.senderId === 'string'
                    ? m.senderId === 'me'
                      ? meUsername || 'You'
                      : m.senderId
                    : `${m.senderId.username}`
                const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const canAct = !m._id.startsWith('optimistic-') && !m.isDeleted

                return (
                  <div key={m._id} className="group flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold">
                      {sender?.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold truncate">{sender}</div>
                        <div className="text-[10px] text-white/40">{time}</div>

                        <div
                          className="ml-auto relative flex items-center"
                          ref={messageMenuOpenId === m._id ? messageMenuRef : undefined}
                        >
                          <button
                            type="button"
                            className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center text-white/70 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus:opacity-100 focus:pointer-events-auto disabled:opacity-40"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setMessageMenuOpenId((prev) => (prev === m._id ? null : m._id))
                            }}
                            aria-label="Message actions"
                            aria-haspopup="menu"
                            aria-expanded={messageMenuOpenId === m._id}
                            title="Message actions"
                            disabled={!canAct}
                          >
                            ...
                          </button>

                          {messageMenuOpenId === m._id && (
                            <div
                              role="menu"
                              className="absolute mt-2 right-0 top-full w-40 rounded-md border border-white/10 bg-[#0f1115] shadow-lg z-50 overflow-hidden"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                            >
                              <button
                                type="button"
                                role="menuitem"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-60"
                                disabled={!canAct}
                                onClick={() => {
                                  setMessageMenuOpenId(null)
                                  setEditMessageId(m._id)
                                  setEditValue(m.content)
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-60"
                                disabled={!canAct}
                                onClick={async () => {
                                  setMessageMenuOpenId(null)
                                  if (!confirm('Delete this message?')) return
                                  try {
                                    const res = await apiRequest<{
                                      success: boolean
                                      data?: Message
                                    }>(`/message/${m._id}`, { method: 'DELETE' })
                                    const updated = res.data
                                    setMessages((prev) =>
                                      prev.map((x) =>
                                        x._id === m._id
                                          ? {
                                              ...x,
                                              ...(updated || {}),
                                              isDeleted: true,
                                              content: updated?.content || 'This message was deleted',
                                            }
                                          : x
                                      )
                                    )
                                  } catch (e) {
                                    if (e instanceof ApiError) {
                                      setMessagesError(e.message)
                                      return
                                    }
                                    setMessagesError('Failed to delete message')
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-white/80 whitespace-pre-wrap break-words">
                        <span>{m.content}</span>
                        {m.editedAt ? <span className="ml-2 text-[10px] text-white/40">(edited)</span> : null}
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5">
        {!route.isMe && selectedChannel ? (
          <div className="flex items-center gap-2">
            <input
              className="flex-1 h-11 rounded-md bg-black/20 border border-white/10 px-3 text-sm outline-none focus:border-[#5865f2]"
              placeholder={`Message #${selectedChannel.name}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void onSend()
                }
              }}
              disabled={sending}
            />
            <button
              type="button"
              className="h-11 px-4 rounded-md bg-[#5865f2] hover:bg-[#4752c4] text-sm font-semibold disabled:opacity-60"
              onClick={() => void onSend()}
              disabled={sending || !draft.trim()}
            >
              Send
            </button>
          </div>
        ) : (
          <div className="h-11 rounded-md bg-black/20 border border-white/5 flex items-center px-3 text-sm text-white/50">
            Message input
          </div>
        )}
      </div>

      {editMessageId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditMessageId(null)
          }}
        >
          <div className="w-[520px] max-w-[92vw] rounded-xl border border-white/10 bg-[#11151b] p-4">
            <div className="text-sm font-semibold">Edit message</div>
            <textarea
              className="mt-3 w-full min-h-24 rounded-md bg-black/20 border border-white/10 px-3 py-2 text-sm outline-none focus:border-[#5865f2]"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-sm"
                onClick={() => setEditMessageId(null)}
                disabled={editing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-md bg-[#5865f2] hover:bg-[#4752c4] text-sm disabled:opacity-60"
                disabled={editing || !editValue.trim()}
                onClick={async () => {
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
                }}
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
