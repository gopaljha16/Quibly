'use client'

import { useState } from 'react'
import { UserPlus, MessageSquare, Smile } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useFriends, usePendingRequests } from '@/hooks/queries'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '@/lib/api'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type UserClickModalProps = {
  isOpen: boolean
  onClose: () => void
  user: {
    _id: string
    username: string
    discriminator?: string
    avatar?: string | null
    banner?: string | null
    bio?: string
    themeColor?: string
    status?: 'online' | 'idle' | 'dnd' | 'offline'
  }
  currentUserId?: string
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

export default function UserClickModal({
  isOpen,
  onClose,
  user,
  currentUserId
}: UserClickModalProps) {
  const [messageInput, setMessageInput] = useState('')
  const queryClient = useQueryClient()
  const router = useRouter()
  
  const { data: friends = [] } = useFriends()
  const { data: pendingRequests = [] } = usePendingRequests()
  
  const userId = user._id
  
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
    if (!user.discriminator) {
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
  
  const handleMessageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (messageInput.trim()) {
      createDMMutation.mutate(userId)
    }
  }
  
  const initials = user.username?.slice(0, 1).toUpperCase() || 'U'
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="max-w-[340px] bg-[#111214] border-none text-white p-0 overflow-hidden rounded-lg">
        {/* Banner */}
        <div 
          className="h-[60px] relative overflow-hidden"
          style={{ 
            backgroundColor: user.themeColor || user.banner ? 'transparent' : '#5865f2',
            backgroundImage: user.banner ? `url(${user.banner})` : 'linear-gradient(90deg, #1e3a8a 0%, #7c3aed 50%, #db2777 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
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
              {user.username.toLowerCase()}#{user.discriminator || '0001'}
            </p>

            <div className="h-px bg-[#3f4147] mb-3" />

            {/* Mutual Servers */}
            <div className="mb-3">
              <p className="text-xs font-bold text-white uppercase mb-2">1 Mutual Server</p>
              {/* Placeholder for server icons - you can add actual server data here */}
            </div>

            <div className="h-px bg-[#3f4147] mb-3" />

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
              <MessageSquare className="w-4 h-4" />
              Send Message
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
          <form onSubmit={handleMessageInputSubmit}>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
