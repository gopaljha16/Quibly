'use client'

import { useState } from 'react'
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  MessageSquare, 
  Check, 
  X, 
  UserX 
} from 'lucide-react'
import { 
  useFriends, 
  usePendingRequests, 
  useProfile 
} from '@/hooks/queries'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiPatch, apiDelete } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

type Tab = 'ONLINE' | 'ALL' | 'PENDING' | 'BLOCKED' | 'ADD_FRIEND'

export default function FriendsDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('ONLINE')
  const [searchQuery, setSearchQuery] = useState('')
  const [friendInput, setFriendInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data: currentUser } = useProfile()
  const { data: friends = [], isLoading: friendsLoading } = useFriends()
  const { data: requests = [], isLoading: requestsLoading } = usePendingRequests()

  // Mutations
  const sendRequestMutation = useMutation({
    mutationFn: (data: { username: string, discriminator: string }) => apiPost('/friends/request', data),
    onSuccess: () => {
      toast.success('Friend request sent!')
      setFriendInput('')
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send request')
    }
  })

  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: string) => apiPost(`/friends/accept/${requestId}`, {}),
    onSuccess: () => {
      toast.success('Friend request accepted!')
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
    }
  })

  const removeRequestMutation = useMutation({
    mutationFn: (requestId: string) => apiDelete(`/friends/reject/${requestId}`),
    onSuccess: () => {
      toast.success('Friend request removed')
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
    }
  })

  const createDMMutation = useMutation({
    mutationFn: (userId: string) => apiPost<{ success: boolean; room: { id: string } }>('/dms/room', { userId }),
    onSuccess: (data) => {
      console.log('DM Created/Retrieved:', data)
      router.push(`/channels/@me/${data.room.id}`)
    },
    onError: (error: any) => {
      console.error('Create DM Error:', error)
      toast.error(error.message || 'Failed to start conversation')
    }
  })

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault()
    const match = friendInput.match(/^(.+)#(\d{4})$/)
    if (!match) {
      toast.error('Invalid format. Use Username#0000')
      return
    }

    const [, username, discriminator] = match

    // Check if trying to add self
    if (username === currentUser?.username && discriminator === currentUser?.discriminator) {
      toast.error("You can't add yourself as a friend!")
      return
    }

    setIsSubmitting(true)
    try {
      await sendRequestMutation.mutateAsync({ username, discriminator })
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeFriendMutation = useMutation({
    mutationFn: (friendId: string) => apiDelete(`/friends/${friendId}`),
    onSuccess: () => {
      toast.success('Friend removed')
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      setActiveMenu(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove friend')
    }
  })

  const blockUserMutation = useMutation({
    mutationFn: (userId: string) => apiPost('/friends/block', { userId }),
    onSuccess: () => {
      toast.success('User blocked')
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      setActiveMenu(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to block user')
    }
  })

  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const handleRemoveFriend = (friendId: string) => {
    if (confirm('Are you sure you want to remove this friend?')) {
      removeFriendMutation.mutate(friendId)
    }
  }

  // Filter friends logic
  const filteredFriends = friends.filter(friend => {
    if (activeTab === 'ONLINE' && friend.status === 'offline') return false
    if (searchQuery) {
      return friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const renderContent = () => {
    switch (activeTab) {
      case 'ADD_FRIEND':
        return (
          <div className="p-8">
            <h2 className="text-white font-bold uppercase text-sm mb-2">Add Friend</h2>
            <p className="text-[#b5bac1] text-sm mb-4">You can add friends with their Discord Tag. It's case-sensitive!</p>
            <form onSubmit={handleAddFriend} className="relative">
              <input
                type="text"
                placeholder="You can add friends with their Discord Tag. e.g. Wumpus#0000"
                value={friendInput}
                onChange={(e) => setFriendInput(e.target.value)}
                className="w-full bg-[#1e1f22] text-[#dbdee1] rounded-[8px] p-4 pr-32 outline-none border border-transparent focus:border-[#00a8fc] transition-colors"
                autoFocus
              />
              <button
                type="submit"
                disabled={isSubmitting || !friendInput}
                className="absolute right-2 top-2 bottom-2 bg-[#5865f2] hover:bg-[#4752c4] disabled:bg-[#3c4270] disabled:text-[#a0a0a0] text-white px-4 rounded-[3px] text-sm font-medium transition-colors"
              >
                Send Friend Request
              </button>
            </form>
          </div>
        )
      
      case 'PENDING':
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-4 pb-2 text-[12px] font-bold text-[#b5bac1] uppercase">
              Pending — {requests.length}
            </div>
            <div className="mt-2">
              {requests.map(request => {
                const currentUserId = currentUser?._id || (currentUser as any)?.id
                const isIncoming = request.receiverId === currentUserId
                const person = isIncoming ? request.sender : request.receiver
                
                return (
                  <div key={request.id} className="group mx-2 px-3 py-2.5 rounded-[8px] hover:bg-[#393c41] flex items-center justify-between border-t border-[#3f4147] transition-colors first:border-t-0">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold overflow-hidden shadow-inner">
                          {person.avatar ? <img src={person.avatar} className="w-full h-full object-cover" /> : person.username[0].toUpperCase()}
                        </div>
                        <div className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-[3px] border-[#313338] ${
                          person.status === 'online' ? 'bg-[#23a55a]' : 
                          person.status === 'idle' ? 'bg-[#f0b232]' : 
                          person.status === 'dnd' ? 'bg-[#f23f43]' : 'bg-[#80848e]'
                        }`} />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="text-white font-semibold text-[15px]">{person.username}</span>
                          <span className="text-[#b5bac1] text-xs font-medium group-hover:text-[#dbdee1]">#{person.discriminator}</span>
                        </div>
                        <span className="text-[#b5bac1] text-[12px]">{isIncoming ? 'Incoming Friend Request' : 'Outgoing Friend Request'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isIncoming ? (
                        <>
                          <button 
                            onClick={() => acceptRequestMutation.mutate(request.id)}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] text-[#b5bac1] hover:text-[#23a55a] hover:bg-[#202020] transition-colors"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => removeRequestMutation.mutate(request.id)}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] text-[#b5bac1] hover:text-[#f23f43] hover:bg-[#202020] transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => removeRequestMutation.mutate(request.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] text-[#b5bac1] hover:text-[#f23f43] hover:bg-[#202020] transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              {requests.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-20 opacity-40">
                  <Users className="w-20 h-20 mb-4" />
                  <p className="text-[#b5bac1]">There are no pending friend requests. Here's Wumpus for now.</p>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-4 flex flex-col gap-4">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1e1f22] text-[#dbdee1] rounded-[4px] px-3 py-1.5 text-sm outline-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b5bac1]">
                  <Search className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="px-5 pt-4 pb-2 text-[12px] font-bold text-[#b5bac1] uppercase">
              {activeTab === 'ONLINE' ? 'Online' : 'All Friends'} — {filteredFriends.length}
            </div>

            <div className="overflow-y-auto flex-1">
              {filteredFriends.map(friend => (
                <div key={friend.id} className="group mx-2 px-3 py-2.5 rounded-[8px] hover:bg-[#393c41] flex items-center justify-between border-t border-[#3f4147] transition-colors first:border-t-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold overflow-hidden shadow-inner">
                        {friend.avatar ? <img src={friend.avatar} className="w-full h-full object-cover" /> : friend.username[0].toUpperCase()}
                      </div>
                      <div className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-[3px] border-[#313338] ${
                        friend.status === 'online' ? 'bg-[#23a55a]' : 
                        friend.status === 'idle' ? 'bg-[#f0b232]' : 
                        friend.status === 'dnd' ? 'bg-[#f23f43]' : 'bg-[#80848e]'
                      }`} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-white font-semibold text-[15px]">{friend.username}</span>
                        <span className="text-[#b5bac1] text-xs font-medium group-hover:text-[#dbdee1]">#{friend.discriminator}</span>
                      </div>
                      <span className="text-[#b5bac1] text-[12px]">{friend.status}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 relative">
                    <button 
                      onClick={() => createDMMutation.mutate(friend.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] text-[#b5bac1] hover:text-white hover:bg-[#202020] transition-colors"
                      title="Message"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenu(activeMenu === friend.id ? null : friend.id)
                        }}
                        className={`w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] text-[#b5bac1] hover:text-white hover:bg-[#202020] transition-colors ${activeMenu === friend.id ? 'text-white bg-[#202020]' : ''}`}
                        title="More"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {activeMenu === friend.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setActiveMenu(null)}
                          />
                          <div className="absolute right-0 top-10 w-48 bg-[#111214] rounded-[4px] shadow-xl z-[100] py-1.5 border border-[#1e1f22]">
                            <button
                              onClick={() => {
                                createDMMutation.mutate(friend.id)
                                setActiveMenu(null)
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm text-[#dbdee1] hover:bg-[#4752c4] hover:text-white transition-colors"
                            >
                              Message
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(friend.id)
                                toast.success('User ID copied')
                                setActiveMenu(null)
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm text-[#dbdee1] hover:bg-[#4752c4] hover:text-white transition-colors"
                            >
                              Copy User ID
                            </button>
                            <div className="h-px bg-[#3f4147] my-1 mx-1.5" />
                            <button
                              onClick={() => {
                                handleRemoveFriend(friend.id)
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm text-[#f23f43] hover:bg-[#da373c] hover:text-white transition-colors font-medium"
                            >
                              Remove Friend
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to block ${friend.username}?`)) {
                                  blockUserMutation.mutate(friend.id)
                                }
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm text-[#f23f43] hover:bg-[#da373c] hover:text-white transition-colors font-medium"
                            >
                              Block
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredFriends.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-20 opacity-40">
                  <Users className="w-20 h-20 mb-4" />
                  <p className="text-[#b5bac1]">No one's around to play with Wumpus.</p>
                </div>
              )}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#313338] min-h-0 overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-[#26272d] flex items-center px-4 shadow-sm z-10">
        <div className="flex items-center gap-2 text-[#b5bac1] mr-4 border-r border-[#3f4147] pr-4">
          <Users className="w-5 h-5" />
          <span className="text-white font-bold text-base">Friends</span>
        </div>
        
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {[
            { id: 'ONLINE', label: 'Online' },
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'BLOCKED', label: 'Blocked' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-4 py-0.5 rounded-[4px] text-base font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-[#3f4147] text-white' 
                  : 'text-[#b5bac1] hover:bg-[#393c41] hover:text-[#dbdee1]'
              }`}
            >
              {tab.label}
            </button>
          ))}
          
          <button
            onClick={() => setActiveTab('ADD_FRIEND')}
            className={`px-4 py-0.5 rounded-[4px] text-base font-medium transition-colors ml-1 ${
              activeTab === 'ADD_FRIEND'
                ? 'text-[#23a55a] bg-transparent'
                : 'bg-[#248046] text-white hover:bg-[#1a6334]'
            }`}
          >
            Add Friend
          </button>
        </div>
      </div>

      {renderContent()}
    </div>
  )
}
