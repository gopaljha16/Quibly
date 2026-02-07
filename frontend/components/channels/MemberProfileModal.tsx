'use client'

import { useEffect, useState } from 'react'
import { UserPlus, MessageSquare, Smile } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useFriends, usePendingRequests } from '@/hooks/queries'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '@/lib/api'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useActivity } from '@/hooks/useActivity'
import { ActivityDisplay } from '@/components/profile/ActivityDisplay'

type MemberUser = {
  _id: string
  username: string
  discriminator: string
  avatar?: string | null
  banner?: string | null
  bio?: string
  status?: 'online' | 'idle' | 'dnd' | 'offline'
  customStatus?: string
}

// Status indicator component
const StatusIndicator = ({ status }: { status?: 'online' | 'idle' | 'dnd' | 'offline' }) => {
  const statusColors = {
    online: 'bg-[#23a559]',
    idle: 'bg-[#f0b232]',
    dnd: 'bg-[#f23f43]',
    offline: 'bg-[#80848e]'
  }

  return (
    <div className={`w-[18px] h-[18px] rounded-full border-[4px] border-[#111214] ${statusColors[status || 'offline']}`} />
  )
}

export default function MemberProfileModal({
  open,
  onClose,
  user,
  isOwner,
  roleIds,
  roles,
  currentUserId,
}: {
  open: boolean
  onClose: () => void
  user: MemberUser | null
  isOwner: boolean
  roleIds?: string[]
  roles?: Array<{ id: string, name: string, color: string | null }>
  currentUserId?: string
}) {
  const [messageInput, setMessageInput] = useState('')
  const queryClient = useQueryClient()
  const router = useRouter()
  
  const { data: friends = [] } = useFriends()
  const { data: pendingRequests = [] } = usePendingRequests()
  
  const userId = user?._id || ''
  
  // Get user's activity
  const { activity, customStatus } = useActivity(userId)
  
  // Check friendship status
  const isFriend = friends.some(f => f.id === userId)
  const hasPendingRequest = pendingRequests.some(
    req => req.receiverId === userId || req.senderId === userId
  )
  
  // Add Friend mutation
  const addFriendMutation = useMutation({
    mutationFn: ({ username, discriminator }: { username: string, discriminator: string }) =>
      apiPost('/friends/request', { username, discriminator }),
    onSuccess: () => {
      toast.success('Friend request sent!')
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send friend request')
    }
  })
  
  // Create DM mutation
  const createDMMutation = useMutation({
    mutationFn: (userId: string) => apiPost<{ success: boolean; room: { id: string } }>('/dm/room', { userId }),
    onSuccess: (data) => {
      router.push(`/channels/@me/${data.room.id}`)
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start conversation')
    }
  })
  
  const handleAddFriend = () => {
    if (!user?.discriminator) {
      toast.error('Cannot add friend: missing discriminator')
      return
    }
    addFriendMutation.mutate({
      username: user.username,
      discriminator: user.discriminator
    })
  }
  
  const handleSendMessage = () => {
    createDMMutation.mutate(userId)
  }
  
  const handleMessageInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim()) return
    
    try {
      // Create DM room if it doesn't exist
      const dmData = await apiPost<{ success: boolean; room: { id: string } }>('/dm/room', { userId })
      
      // Send the message
      await apiPost('/messages', {
        content: messageInput.trim(),
        channelId: dmData.room.id,
      })
      
      // Navigate to the DM
      router.push(`/channels/@me/${dmData.room.id}`)
      setMessageInput('')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
    }
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open || !user) return null

  const initials = user.username?.slice(0, 1).toUpperCase() || 'U'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="max-w-[calc(100%-2rem)] sm:max-w-[340px] bg-[#111214] border-none text-white p-0 overflow-hidden rounded-lg">
          {/* Banner */}
          <div className="h-[60px] relative overflow-hidden bg-gradient-to-r from-[#1e3a8a] via-[#7c3aed] to-[#db2777]">
            {user.banner && (
              <img
                src={user.banner}
                alt="Profile Banner"
                className="w-full h-full object-cover"
              />
            )}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#0a0a0b]/60 hover:bg-[#0a0a0b]/80 transition-colors flex items-center justify-center text-white/90 hover:text-white z-10"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="fill-current">
                <path fillRule="evenodd" clipRule="evenodd" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
              </svg>
            </button>
          </div>

          <div className="px-4 pb-3">
            {/* Avatar */}
            <div className="relative -mt-[52px] mb-3">
              <div className="relative w-[80px] h-[80px] rounded-full border-[6px] border-[#111214] overflow-hidden bg-[#5865f2]">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">
                    {initials}
                  </div>
                )}
                {/* Status Indicator */}
                <div className="absolute bottom-0 right-0">
                  <StatusIndicator status={user.status} />
                </div>
              </div>
            </div>

            {/* User Info Card */}
            <div className="bg-[#232428] rounded-lg p-3 mb-2">
              {/* Username */}
              <h3 className="text-[20px] font-bold text-white mb-0.5 leading-tight">
                {user.username}
              </h3>
              {/* Discriminator */}
              <p className="text-sm text-[#b5bac1] mb-3 leading-tight">
                {user.username.toLowerCase()}#{user.discriminator}
              </p>

              <div className="h-px bg-[#3f4147] mb-3" />

              {/* Mutual Servers */}
              <div className="mb-3">
                <p className="text-xs font-bold text-white uppercase mb-2">1 Mutual Server</p>
                {/* Placeholder for server icons - you can add actual server data here */}
              </div>

              <div className="h-px bg-[#3f4147] mb-3" />

              {/* Activity & Custom Status */}
              {(activity || customStatus?.customStatus) && (
                <>
                  <div className="mb-3">
                    <p className="text-xs font-bold text-[#b5bac1] uppercase mb-2">Activity</p>
                    <ActivityDisplay
                      activity={activity}
                      customStatus={customStatus?.customStatus}
                      customStatusEmoji={customStatus?.customStatusEmoji}
                    />
                  </div>
                  <div className="h-px bg-[#3f4147] mb-3" />
                </>
              )}

              {/* About Me Section */}
              <div>
                <p className="text-xs font-bold text-[#b5bac1] uppercase mb-2">About Me</p>
                <p className="text-sm text-[#dbdee1] leading-relaxed">
                  {user.bio || 'Just another discord user.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={handleSendMessage}
                disabled={createDMMutation.isPending}
                className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2.5 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {createDMMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>

              {!isFriend && !hasPendingRequest && currentUserId !== userId && (
                <button
                  onClick={handleAddFriend}
                  disabled={addFriendMutation.isPending}
                  className="bg-[#3ba55d] hover:bg-[#2d7d46] text-white font-medium py-2.5 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  title="Add Friend"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              )}

              {hasPendingRequest && (
                <div className="bg-[#4e5058] text-[#b5bac1] font-medium py-2.5 px-4 rounded flex items-center justify-center" title="Pending">
                  <UserPlus className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleMessageInputSubmit} className="mb-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Message @${user.username}`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="w-full bg-[#383a40] text-[#dbdee1] rounded px-3 py-2 pr-10 text-sm outline-none placeholder-[#6d6f78] transition-all"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#b5bac1] hover:text-[#dbdee1] transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Roles Section */}
            {((roles || []).filter(r => roleIds?.includes(r.id)).length > 0 || isOwner) && (
              <div className="mb-3">
                <p className="text-xs font-bold text-[#b5bac1] uppercase mb-2">Roles</p>
                <div className="flex flex-wrap gap-1">
                  {(roles || []).filter(r => roleIds?.includes(r.id)).map(role => (
                    <div
                      key={role.id}
                      className="flex items-center gap-1.5 px-2 py-1 bg-[#2B2D31] rounded-[4px] border border-[#1E1F22]"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color || '#99AAB5' }} />
                      <span className="text-xs font-medium text-slate-50">{role.name}</span>
                    </div>
                  ))}
                  {isOwner && !(roles || []).some(r => r.name === 'Owner' && roleIds?.includes(r.id)) && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[#2B2D31] rounded-[4px] border border-[#1E1F22]">
                      <div className="w-3 h-3 rounded-full bg-[#F0B232]" />
                      <span className="text-xs font-medium text-slate-50">Owner</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Note Section */}
            <div>
              <p className="text-xs font-bold text-[#b5bac1] uppercase mb-2">Note</p>
              <textarea
                className="w-full bg-[#111214] text-slate-50 text-xs p-2 rounded-[3px] border-none outline-none resize-none h-[36px] placeholder-[#5C5E66] focus:h-[60px] transition-all duration-200"
                placeholder="Click to add a note"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
  )
}
