'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import axios from 'axios'
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react'
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
import { useTypingIndicator } from '@/hooks/useTypingIndicator'
import { TypingIndicator } from '@/components/TypingIndicator'
import GifPicker from '@/components/GifPicker'
import { useUploadThing } from '@/lib/uploadthing'
import { Loader2, Plus, Pin, Ban, Clock, CornerUpLeft, X, SmilePlus } from 'lucide-react'
import { connectSocket } from '@/lib/socket'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { usePinMessage, useUnpinMessage } from '@/hooks/queries/usePinnedMessages'
import { PinnedMessagesBanner } from '@/components/channels/PinnedMessagesBanner'
import BanModal from '@/components/channels/BanModal'
import TimeoutModal from '@/components/channels/TimeoutModal'
import DeleteMessageModal from '@/components/channels/DeleteMessageModal'
import UserClickModal from '@/components/profile/UserClickModal'



// Message Item Component
const MessageItem = ({
  message,
  onEdit,
  onDelete,
  currentUser,
  isEditing,
  editContent,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  onReply,
  onReplyClick,
  isServerOwner,
  onAvatarClick
}: {
  message: Message
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
  currentUser?: any
  isEditing?: boolean
  editContent?: string
  onEditContentChange?: (content: string) => void
  onSaveEdit?: () => void
  onCancelEdit?: () => void
  onReply?: (message: Message) => void
  onReplyClick?: (id: string) => void
  isServerOwner?: boolean
  onAvatarClick?: (user: any) => void
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [showTimeoutModal, setShowTimeoutModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)
  const { firstUrl } = useLinkPreviews(message.content)
  const pinMessageMutation = usePinMessage()
  const unpinMessageMutation = useUnpinMessage()
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const reactionPickerRef = useRef<HTMLDivElement>(null)
  
  const queryClient = useQueryClient()
  
  const toggleReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string, emoji: string }) => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/message/${messageId}/reactions`, { emoji }, { withCredentials: true })
      return response.data
    },
    onSuccess: () => {
        // No action needed, updated via socket
    }
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
        setShowReactionPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleReactionClick = (emoji: string) => {
    toggleReactionMutation.mutate({ messageId: message._id, emoji })
    setShowReactionPicker(false)
  }

  const isSenderMe = typeof message.senderId === 'object' && message.senderId?._id === currentUser?._id
  
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
  const canAct = !message._id.startsWith('optimistic-') && isSenderMe
  const canPin = !message._id.startsWith('optimistic-') && isServerOwner && message.channelId
  const canModerate = !message._id.startsWith('optimistic-') && isServerOwner && !isSenderMe && message.channelId
  const canReply = !message._id.startsWith('optimistic-')
  
  // Get sender ID for moderation actions
  const senderId = typeof message.senderId === 'object' ? message.senderId?._id : message?.senderId

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

  // Auto-resize textarea and focus when editing
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      const textarea = editTextareaRef.current
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [isEditing])

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSaveEdit?.()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancelEdit?.()
    }
  }

  const handlePinToggle = async () => {
    try {
      if (message.isPinned) {
        await unpinMessageMutation.mutateAsync(message._id)
      } else {
        await pinMessageMutation.mutateAsync(message._id)
      }
      setMenuOpen(false)
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  if (message.type === 'SYSTEM') {
    return (
      <div 
        id={`message-${message._id}`}
        className="flex items-center gap-4 px-4 py-1 hover:bg-[#2e3035] group relative transition-colors"
      >
        <div className="w-10 flex justify-center items-start pt-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#23a559]">
            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="text-[#949ba4] text-[15px] leading-[1.375rem]">
            {message.content.split('**').map((part, i) => 
              i % 2 === 1 ? <span key={i} className="text-[#f2f3f5] font-semibold">{part}</span> : part
            )}
            <span className="text-[0.75rem] ml-2 font-medium">{dateStr}</span>
          </div>
          
          {message.metadata && typeof message.metadata === 'object' && (message.metadata as any).type === 'WELCOME' && (
            <button 
              onClick={() => {
                const input = document.querySelector('textarea[placeholder*="Message"]') as HTMLTextAreaElement;
                if (input) {
                  input.value = `👋 Welcome @${(message.metadata as any)?.username || 'User'}!`;
                  input.focus();
                  // Trigger change event for React
                  const event = new Event('input', { bubbles: true });
                  input.dispatchEvent(event);
                }
              }}
              className="flex items-center gap-2 bg-[#383a40] hover:bg-[#4e5058] transition-colors text-white text-[13px] px-3 py-1.5 rounded w-fit mt-1 group/wave"
            >
              <span className="text-lg group-hover/wave:animate-bounce">👋</span>
              <span className="font-medium">Wave to say hi!</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      id={`message-${message._id}`}
      className={`group flex flex-col px-4 py-0.5 hover:bg-[#2e3035] relative mt-[1.0625rem] first:mt-2 ${menuOpen ? 'bg-[#2e3035]' : ''} ${message.isPinned ? 'bg-[#2e3035]/50' : ''} transition-colors duration-500`}
    >
      {message.parent && (
        <div 
          className="flex items-center gap-1 mb-1 ml-9 overflow-hidden group/reply"
          onClick={() => onReplyClick?.(message.parentId!)}
        >
          <div className="w-8 h-4 border-l-2 border-t-2 border-[#4e5058] rounded-tl-md ml-[-20px] mr-1 mb-[-8px]"></div>
          <div className="flex items-center gap-2 opacity-60 hover:opacity-100 cursor-pointer overflow-hidden min-w-0 bg-transparent hover:bg-white/5 px-2 py-0.5 rounded transition-colors">
            {message.parent.senderId?.avatar ? (
              <img src={message.parent.senderId.avatar} alt="" className="w-4 h-4 rounded-full" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-[#5865f2] flex items-center justify-center text-[8px] text-white">
                {message.parent.senderId?.username?.slice(0, 1).toUpperCase() || 'U'}
              </div>
            )}
            <span className="font-bold text-[13px] whitespace-nowrap text-[#f2f3f5] hover:underline">
              @{message.parent.senderId?.username || 'User'}
            </span>
            <span className="text-[13px] truncate text-[#dbdee1] italic">
              {message.parent.content}
            </span>
            <span className="text-[10px] text-[#949ba4] font-bold opacity-0 group-hover/reply:opacity-100 transition-opacity ml-1 bg-[#1a1a1a] px-1 rounded">JUMP</span>
          </div>
        </div>
      )}
      <div className="flex gap-4">
        <div 
          onClick={() => onAvatarClick?.(senderInfo)}
          className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5 cursor-pointer hover:drop-shadow-md transition-all active:translate-y-px"
        >
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
          {message.isPinned && (
            <Pin className="w-3 h-3 text-[#949ba4]" />
          )}
          <span className="font-medium text-[#f2f3f5] hover:underline cursor-pointer">
            {sender}
          </span>
          <span className="text-[0.75rem] text-[#949ba4] font-medium">{dateStr}</span>
          {message.editedAt && (
            <span className="text-[0.625rem] text-[#949ba4]">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              ref={editTextareaRef}
              value={editContent}
              onChange={(e) => onEditContentChange?.(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="w-full bg-[#383a40] text-[#dbdee1] rounded px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#5865f2] min-h-[44px] max-h-[200px]"
              placeholder="Edit message..."
            />
            <div className="flex items-center gap-2 text-xs text-[#949ba4]">
              <span>escape to <button onClick={onCancelEdit} className="text-[#5865f2] hover:underline">cancel</button></span>
              <span>•</span>
              <span>enter to <button onClick={onSaveEdit} className="text-[#5865f2] hover:underline">save</button></span>
            </div>
          </div>
        ) : (
          <>
            {(() => {
              const content = message.content.trim();
              const isMedia = message.type === 'FILE' || 
                (content.match(/\.(jpeg|jpg|gif|png|webp|mp4|webm|ogg)$/i) || content.includes('utfs.io/f/') || content.includes('utfs.io/v/')) && !content.includes(' ');

              if (isMedia && message.type === 'FILE') return null; // Hide text if it's explicitly a FILE
              if (isMedia) return null; // Hide text for pure media URLs too

              return (
                <div className="text-[#dbdee1] break-words leading-[1.375rem]">
                  <LinkifiedText
                    text={message.content}
                    className="whitespace-pre-wrap"
                    linkClassName="text-[#5865f2] hover:underline cursor-pointer transition-colors"
                  />
                </div>
              );
            })()}

            {(() => {
              const content = message.content.trim();
              const attachments = message.attachments || [];
              
              // Priority 1: Render Attachments
              if (attachments.length > 0) {
                return attachments.map((att, i) => (
                  <div key={i} className="mt-2 rounded-md overflow-hidden max-w-[400px] border border-[#2a2a2a]">
                    {att.type === 'video' || att.url?.includes('utfs.io/v/') ? (
                      <video src={att.url} controls className="w-full h-auto" />
                    ) : (
                      <img src={att.url} alt="Attachment" className="w-full h-auto object-contain cursor-pointer" />
                    )}
                  </div>
                ));
              }

              // Priority 2: Legacy/Link Detection fallback
              const isImage = content.match(/\.(jpeg|jpg|gif|png|webp)$/i) || content.includes('utfs.io/f/');
              const isVideo = content.match(/\.(mp4|webm|ogg)$/i) || content.includes('utfs.io/v/');
              
              if (isImage && !content.includes(' ')) {
                return (
                  <div className="mt-2 rounded-md overflow-hidden max-w-[400px]">
                    <img src={content} alt="User upload" className="w-full h-auto object-contain cursor-pointer" />
                  </div>
                );
              }
              if (isVideo && !content.includes(' ')) {
                return (
                  <div className="mt-2 rounded-md overflow-hidden max-w-[400px]">
                    <video src={content} controls className="w-full h-auto" />
                  </div>
                );
              }
              return null;
            })()}

            {firstUrl && message.type !== 'FILE' && !message.content.match(/\.(jpeg|jpg|gif|png|webp|mp4|webm|ogg)$/i) && (
              <div className="mt-2 max-w-[432px]">
                <LinkPreview url={firstUrl} />
              </div>
            )}
          </>
        )}
      </div>
      
        {/* Reactions Display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 ml-10">
            {(() => {
                // Group reactions by emoji
                const reactionGroups: { [emoji: string]: { count: number, hasReacted: boolean } } = {};
                message.reactions.forEach((r: any) => {
                    if (!reactionGroups[r.emoji]) {
                        reactionGroups[r.emoji] = { count: 0, hasReacted: false };
                    }
                    reactionGroups[r.emoji].count++;
                    const reactionUserId = typeof r.userId === 'object' ? r.userId._id : r.userId; // Handle populated or raw ID
                    if (currentUser && (reactionUserId === currentUser._id)) {
                        reactionGroups[r.emoji].hasReacted = true;
                    }
                });

                return Object.entries(reactionGroups).map(([emoji, { count, hasReacted }]) => (
                    <button
                        key={emoji}
                        onClick={() => toggleReactionMutation.mutate({ messageId: message._id, emoji })}
                        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[4px] border text-xs font-semibold min-w-[2rem] transition-colors
                            ${hasReacted 
                                ? 'bg-[#3b405a] border-[#5865f2] text-white hover:bg-[#454960]' 
                                : 'bg-[#2b2d31] border-transparent text-[#949ba4] hover:bg-[#313338] hover:border-[#383a40]'
                            }`}
                    >
                        <span>{emoji}</span>
                        <span className={hasReacted ? 'text-[#dee0fc]' : ''}>{count}</span>
                    </button>
                ));
            })()}
          </div>
        )}
      </div>

      {(canAct || canModerate || canPin || canReply) && !isEditing && (
        <div className={`absolute -top-4 right-4 ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity z-10`}>
          <div className="bg-[#1a1a1a] rounded shadow-sm border border-[#2a2a2a] flex items-center p-0.5 transition-transform hover:scale-[1.02]">
            <button
              onClick={() => onReply?.(message)}
              className="p-1.5 hover:bg-[#2a2a2a] text-[#b4b4b4] hover:text-white rounded transition-colors relative group/tooltip"
            >
              <CornerUpLeft className="w-5 h-5" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-semibold">
                Reply
              </div>
            </button>

            {canPin && (
              <button
                onClick={handlePinToggle}
                disabled={pinMessageMutation.isPending || unpinMessageMutation.isPending}
                className={`p-1.5 hover:bg-[#2a2a2a] rounded transition-colors relative group/tooltip ${message.isPinned ? 'text-[#f5c358]' : 'text-[#b4b4b4] hover:text-white'}`}
              >
                <Pin className="w-5 h-5" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-semibold">
                  {message.isPinned ? 'Unpin' : 'Pin'}
                </div>
              </button>
            )}

            {canAct && (
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
            )}

            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-1.5 hover:bg-[#2a2a2a] text-[#b4b4b4] hover:text-white rounded transition-colors relative group/tooltip"
            >
              <SmilePlus className="w-5 h-5" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-semibold">
                Add Reaction
              </div>
            </button>
            {showReactionPicker && (
                <div ref={reactionPickerRef} className="absolute right-0 top-8 z-50">
                    <EmojiPicker 
                        onEmojiClick={(emojiData) => handleReactionClick(emojiData.emoji)}
                        theme={Theme.DARK}
                        emojiStyle={EmojiStyle.TWITTER}
                        lazyLoadEmojis={true}
                        width={300}
                        height={400}
                    />
                </div>
            )}
            
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
              {/* Pin/Unpin moved to action bar */}

              
              {canModerate && (
                <>
                  <button
                    onClick={() => {
                      setShowTimeoutModal(true)
                      setMenuOpen(false)
                    }}
                    className="w-full text-left px-2 py-1.5 text-sm text-[#b5bac1] hover:bg-[#5865f2] hover:text-white rounded-[2px] transition-colors flex items-center justify-between group/item"
                  >
                    Timeout User
                    <Clock className="w-4 h-4 hidden group-hover/item:block" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowBanModal(true)
                      setMenuOpen(false)
                    }}
                    className="w-full text-left px-2 py-1.5 text-sm text-[#b5bac1] hover:bg-[#5865f2] hover:text-white rounded-[2px] transition-colors flex items-center justify-between group/item"
                  >
                    Ban User
                    <Ban className="w-4 h-4 hidden group-hover/item:block" />
                  </button>
                </>
              )}
              
              {(canAct || isServerOwner) && (
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
              )}
            </div>
          )}
          
          {/* Ban Modal */}
          {showBanModal && message.channelId && (
            <BanModal
              open={showBanModal}
              onClose={() => setShowBanModal(false)}
              serverId={message.serverId || ''}
              userId={senderId}
              username={sender}
              isBanned={false}
            />
          )}
          
          {/* Timeout Modal */}
          {showTimeoutModal && message.channelId && (
            <TimeoutModal
              open={showTimeoutModal}
              onClose={() => setShowTimeoutModal(false)}
              serverId={message.serverId || ''}
              userId={senderId}
              username={sender}
            />
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
  isMe,
  isReadOnly,
  timeoutUntil,
  timeoutReason,
  replyingToMessage,
  onCancelReply,
  members = [],
  currentUserId,
  slowMode = 0,
  isExempt = false
}: {
  channelName: string
  value: string
  onChange: (value: string) => void
  onSend: (type?: 'TEXT' | 'FILE', attachments?: any[]) => void
  disabled: boolean
  isMe?: boolean
  isReadOnly?: boolean
  timeoutUntil?: string | null
  timeoutReason?: string | null
  replyingToMessage?: Message | null
  onCancelReply?: () => void
  members?: any[]
  currentUserId?: string
  slowMode?: number
  isExempt?: boolean
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [mentionSearch, setMentionSearch] = useState<string | null>(null)
  const [localCooldown, setLocalCooldown] = useState(0)
  
  // Handle local cooldown countdown
  useEffect(() => {
    if (localCooldown <= 0) return
    const timer = setInterval(() => {
      setLocalCooldown(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [localCooldown])

  // Reset local cooldown when switching channels
  useEffect(() => {
    setLocalCooldown(0)
  }, [channelName])
  const [mentionIndex, setMentionIndex] = useState(0)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const gifPickerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { startUpload, isUploading } = useUploadThing("messageFile", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        // Send as FILE type with attachment
        onSendFile(res[0].url)
      }
    },
    onUploadError: (error: Error) => {
      alert(`Upload failed: ${error.message}`)
    },
  })

  const onSendFile = (url: string) => {
    // Send as FILE type
    onSend('FILE', [{ url, type: url.includes('/v/') ? 'video' : 'image' }])
  }

  const filteredMembers = useMemo(() => {
    if (mentionSearch === null) return []
    const searchLower = mentionSearch.toLowerCase()
    return members
      .filter(m => {
        const userId = m.userId?._id || m.userId?.id || m.userId
        if (currentUserId && userId === currentUserId) return false
        
        const username = m.userId?.username?.toLowerCase() || ''
        return username.includes(searchLower)
      })
      .slice(0, 8)
  }, [members, mentionSearch, currentUserId])

  const insertMention = (member: any) => {
    if (mentionSearch === null) return
    const username = member.userId?.username || 'User'
    const beforeMention = value.slice(0, value.lastIndexOf('@', textareaRef.current?.selectionStart || value.length))
    const afterMention = value.slice(textareaRef.current?.selectionStart || value.length)
    onChange(beforeMention + '@' + username + ' ' + afterMention)
    setMentionSearch(null)
    setMentionIndex(0)
    // Focus back to textarea
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionSearch !== null && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex(prev => (prev + 1) % filteredMembers.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(filteredMembers[mentionIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setMentionSearch(null)
      }
      return
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (slowMode > 0 && localCooldown > 0 && !isExempt) return
      onSend('TEXT')
      if (slowMode > 0 && !isExempt) {
        setLocalCooldown(slowMode)
      }
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart
    onChange(newValue)

    // Mention detection
    const textBeforeCursor = newValue.slice(0, cursorPosition)
    const lastAtIdx = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIdx !== -1 && (lastAtIdx === 0 || /\s/.test(textBeforeCursor[lastAtIdx - 1]))) {
      const search = textBeforeCursor.slice(lastAtIdx + 1)
      if (!/\s/.test(search)) {
        setMentionSearch(search)
        setMentionIndex(0)
        return
      }
    }
    setMentionSearch(null)
  }

  const onEmojiClick = (emojiData: any) => {
    onChange(value + emojiData.emoji)
    // Keep focus on textarea
    textareaRef.current?.focus()
  }

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (gifPickerRef.current && !gifPickerRef.current.contains(event.target as Node)) {
        setShowGifPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleGifSelect = (url: string) => {
    // For GIFs, we send as FILE type
    onSend('FILE', [{ url, type: 'image' }])
    setShowGifPicker(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await startUpload([file])
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
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
      {replyingToMessage && (
        <div className="bg-[#2b2d31] rounded-t-lg px-4 py-2 flex items-center justify-between border-b border-[#3f4147]">
          <div className="text-sm text-[#dbdee1] flex items-center gap-1 overflow-hidden">
            <span>Replying to</span>
            <span className="font-semibold">
              {typeof replyingToMessage.senderId === 'object' ? replyingToMessage.senderId.username : 'User'}
            </span>
          </div>
          <button 
            onClick={onCancelReply}
            className="w-4 h-4 rounded-full bg-[#b5bac1] hover:bg-white text-[#313338] flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className={`${replyingToMessage ? 'rounded-b-lg' : 'rounded-lg'} bg-[#383a40] focus-within:ring-1 focus-within:ring-[#00a8fc] transition-all relative`}>
        {slowMode > 0 && (
           <div className="absolute top-[-24px] right-0 text-xs text-[#949ba4] font-bold flex items-center gap-1">
             <Clock className="w-3 h-3" />
             {isExempt ? (
               <span>Slow Mode Active (Immune)</span>
             ) : (
               <span>Slow Mode Active ({slowMode < 60 ? `${slowMode}s` : slowMode < 3600 ? `${Math.floor(slowMode / 60)}m` : `${Math.floor(slowMode / 3600)}h`})</span>
             )}
           </div>
        )}
        <div className="absolute left-4 top-[10px] flex items-center">
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept="image/*,video/*"
          />
          <button 
            className="w-6 h-6 rounded-full bg-[#b5bac1] hover:bg-[#d1d5da] text-[#313338] flex items-center justify-center transition-colors disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" strokeWidth={3} />
            )}
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="w-full bg-transparent pl-[52px] pr-12 py-[11px] text-[#dbdee1] placeholder-[#87898c] resize-none outline-none min-h-[44px] max-h-[200px] leading-[1.375rem] font-normal disabled:cursor-not-allowed"
          placeholder={
            timeoutUntil && new Date(timeoutUntil) > new Date()
              ? `You are timed out until ${new Date(timeoutUntil).toLocaleString()}. Reason: ${timeoutReason || 'No reason provided'}`
              : isReadOnly
                ? 'Only the server owner can message in this channel'
                : localCooldown > 0 && !isExempt
                ? `Slow mode is enabled. Wait ${localCooldown}s to send another message.`
                : isMe ? `Message @${channelName}` : `Message #${channelName}`
          }
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay closing so clicks on members work
            setTimeout(() => setMentionSearch(null), 200)
          }}
          disabled={disabled || (!!timeoutUntil && new Date(timeoutUntil) > new Date()) || (localCooldown > 0 && !isExempt)}
          rows={1}
        />

        <div className="absolute right-3 top-[8px] flex items-center gap-2">
          <button 
            className={`text-[#b5bac1] hover:text-[#dbdee1] transition-colors ${showEmojiPicker ? 'text-[#dbdee1]' : ''}`} 
            title="Emoji"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current transform scale-90">
              <path fillRule="evenodd" clipRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12ZM20 12C20 16.418 16.418 20 12 20C7.582 20 4 16.418 4 12C4 7.582 7.582 4 12 4C16.418 4 20 7.582 20 12Z" />
              <path fillRule="evenodd" clipRule="evenodd" d="M13 9.5C13 10.328 13.672 11 14.5 11C15.328 11 16 10.328 16 9.5C16 8.672 15.328 8 14.5 8C13.672 8 13 8.672 13 9.5ZM9.5 8C8.672 8 8 8.672 8 9.5C8 10.328 8.672 11 9.5 11C10.328 11 11 10.328 11 9.5C11 8.672 10.328 8 9.5 8Z" />
              <path fillRule="evenodd" clipRule="evenodd" d="M12 17.5C14.33 17.5 16.315 16.052 17.11 14H6.89C7.685 16.052 9.67 17.5 12 17.5Z" />
            </svg>
          </button>
        </div>

        {mentionSearch !== null && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#1e1f22] rounded-md shadow-[0_8px_16px_rgba(0,0,0,0.24)] overflow-hidden border border-[#2a2a2a] z-50">
            <div className="px-3 py-2 text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider border-b border-[#2a2a2a]">
              Members matching "{mentionSearch}"
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {filteredMembers.map((member, idx) => (
                <button
                  key={member.id}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 transition-colors ${idx === mentionIndex ? 'bg-[#35373c] text-white' : 'text-[#dbdee1] hover:bg-[#2b2d31]'}`}
                  onClick={() => insertMention(member)}
                  onMouseEnter={() => setMentionIndex(idx)}
                >
                  {member.userId?.avatar ? (
                    <img src={member.userId.avatar} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#5865f2] flex items-center justify-center text-[10px] text-white font-bold">
                      {member.userId?.username?.slice(0, 1).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="font-medium truncate flex-1 text-left">
                    {member.userId?.username || 'User'}
                  </span>
                  <span className="text-[#949ba4] text-xs">
                    #{member.userId?.discriminator || '0000'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showGifPicker && (
          <div 
            ref={gifPickerRef}
            className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <GifPicker 
              onGifSelect={handleGifSelect}
              onClose={() => setShowGifPicker(false)}
            />
          </div>
        )}

        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef}
            className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              theme={Theme.DARK}
              emojiStyle={EmojiStyle.TWITTER}
              lazyLoadEmojis={true}
              searchPlaceholder="Search emojis..."
              width={350}
              height={450}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChannelsPage() {
  const { route, members, membersLoading, selectedChannel, selectedServer, ownerId } = useChannelsData()
  const { data: currentUser } = useProfile()
  
  const currentMember = useMemo(() => {
    if (!currentUser || !members) return null
    return members.find((m: any) => (m.userId?._id || m.userId) === currentUser._id)
  }, [currentUser, members])
  
  const isServerOwner = useMemo(() => {
    if (!currentUser) return false
    const currentId = currentUser._id || currentUser._id
    const actualOwnerId = ownerId || selectedServer?.ownerId
    if (!actualOwnerId || !currentId) return false
    
    // Convert both to strings and compare
    return String(actualOwnerId) === String(currentId)
  }, [currentUser, selectedServer, ownerId])
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Listen for member updates (e.g., timeout changes) via socket
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!route.serverId) return
    
    const socket = connectSocket()
    
    const handleMemberUpdated = (data: any) => {
      // Invalidate members query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['members', route.serverId] })
    }
    
    socket.on('member_updated', handleMemberUpdated)
    
    return () => {
      socket.off('member_updated', handleMemberUpdated)
    }
  }, [route.serverId, queryClient])

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
    replyingToMessage,
    setReplyingToMessage,
  } = useMessagesData(
    route.isMe ? (route.channelId || null) : (selectedChannel?._id || null),
    route.isMe ? 'dm' : 'channel'
  )

  const handleSend = async (typeMod: 'TEXT' | 'FILE' = 'TEXT', attachments: any[] = []) => {
    const contentToSend = typeMod === 'FILE' ? (attachments[0]?.url || '') : draft
    if (!contentToSend.trim() && attachments.length === 0) return
    try {
      await sendMessage(contentToSend, typeMod, attachments, replyingToMessage?._id)
      if (typeMod === 'TEXT') updateDraft('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }
  const { mutate: removeFriend, isPending: removingFriend } = useRemoveFriend()
  const { mutate: blockUser, isPending: blockingUser } = useBlockUser()
  const { mutate: addFriend, isPending: addingFriend } = useAddFriend()

  // Typing indicator
  const { typingUsers, handleTyping, handleStopTyping } = useTypingIndicator(
    route.isMe ? null : (selectedChannel?._id || null),
    route.isMe ? (route.channelId || null) : null
  )

  // Get setEditingMessageContent from store for the handler
  const { setEditingMessageContent } = useUIStore()

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
    if (!editingMessageId) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [sortedMessages.length, selectedChannel?._id, editingMessageId])

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a double-flash effect
      element.classList.add('bg-[#5865f2]/30', 'scale-[1.01]', 'z-20');
      setTimeout(() => {
        element.classList.remove('scale-[1.01]');
        setTimeout(() => {
          element.classList.remove('bg-[#5865f2]/30', 'z-20');
        }, 1500);
      }, 300);
    } else {
      toast.info("Message is too far up or hasn't loaded yet.");
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)

  // User profile modal state
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const handleAvatarClick = (user: any) => {
    if (user && user._id !== currentUser?._id) {
      setSelectedUser(user)
      setUserModalOpen(true)
    }
  }

  const handleSendAction = (typeMod: 'TEXT' | 'FILE' = 'TEXT', attachments: any[] = []) => {
    handleSend(typeMod, attachments)
    handleStopTyping()
  }

  const handleDelete = async (messageId: string) => {
    setMessageToDelete(messageId)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!messageToDelete) return
    try {
      await deleteMessage(messageToDelete)
      setMessageToDelete(null)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const handleEditContentChange = (content: string) => {
    setEditingMessageContent(content)
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
            {/* Pinned Messages Banner */}
            {!route.isMe && selectedChannel && (
              <PinnedMessagesBanner channelId={selectedChannel._id} />
            )}
            
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
                    {sortedMessages.map((msg) => {
                      // Resolve parent locally if not provided by backend (e.g. optimistic or fallback)
                      const message = { ...msg };
                      if (message.parentId && !message.parent) {
                        const localParent = sortedMessages.find(m => m._id === message.parentId);
                        if (localParent) {
                          message.parent = {
                            _id: localParent._id,
                            content: localParent.content,
                            senderId: typeof localParent.senderId === 'object' ? localParent.senderId : {
                              _id: localParent.senderId,
                              username: 'Loading...',
                            }
                          };
                        }
                      }

                      return (
                        <MessageItem
                          key={message._id}
                          message={message}
                          onEdit={startEditing}
                          onDelete={handleDelete}
                          currentUser={currentUser}
                          isEditing={editingMessageId === message._id}
                          editContent={editingMessageContent}
                          onEditContentChange={handleEditContentChange}
                          onSaveEdit={saveEdit}
                          onCancelEdit={cancelEditing}
                          onReply={(msg) => setReplyingToMessage(msg)}
                          onReplyClick={scrollToMessage}
                          isServerOwner={isServerOwner}
                          onAvatarClick={handleAvatarClick}
                        />
                      );
                    })}
                  </div>
                )}

                <div ref={bottomRef} className="h-0" />
              </div>
            </div>

            {/* Typing Indicator */}
            <TypingIndicator typingUsers={typingUsers} />

            <MessageInput
              channelName={route.isMe ? (dmRoom?.otherUser?.username || 'User') : (selectedChannel?.name || 'channel')}
              value={draft}
              onChange={(value) => {
                updateDraft(value)
                handleTyping()
              }}
              onSend={handleSendAction}
              disabled={sending || (!!selectedChannel?.isReadOnly && !isServerOwner)}
              isMe={route.isMe}
              isReadOnly={!!selectedChannel?.isReadOnly && !isServerOwner}
              timeoutUntil={currentMember?.timeoutUntil}
              timeoutReason={currentMember?.timeoutReason}
              replyingToMessage={replyingToMessage}
              onCancelReply={() => setReplyingToMessage(null)}
              members={members}
              currentUserId={currentUser?._id}
              slowMode={(selectedChannel as any)?.slowMode || 0}
              isExempt={isServerOwner}
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
                const { setEditingMessageContent } = useUIStore.getState()
                setEditingMessageContent(e.target.value)
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

      {/* Delete Message Modal */}
      <DeleteMessageModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* User Profile Modal */}
      {selectedUser && (
        <UserClickModal
          isOpen={userModalOpen}
          onClose={() => {
            setUserModalOpen(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
          currentUserId={currentUser?._id}
        />
      )}
    </>
  )
}
