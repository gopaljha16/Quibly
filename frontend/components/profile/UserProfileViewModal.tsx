'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import UserProfileView from './UserProfileView'
import { useCurrentUser } from '@/hooks/queries/useUserProfile'
import { useQueryClient } from '@tanstack/react-query'

interface UserProfileViewModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
}

export default function UserProfileViewModal({
  isOpen,
  onClose,
  user: initialUser
}: UserProfileViewModalProps) {
  const { data: currentUser } = useCurrentUser()
  const queryClient = useQueryClient()
  
  // Use fresh data from React Query if available, otherwise use initialUser
  const user = currentUser || initialUser

  const handleUpdate = (updatedData: any) => {
    // Update the query cache optimistically for current user
    queryClient.setQueryData(['users', 'current'], (old: any) => ({
      ...old,
      ...updatedData
    }))
    
    // Also update the profile query cache (used by useProfile hook)
    queryClient.setQueryData(['profile'], (old: any) => ({
      ...old,
      ...updatedData
    }))
    
    // Invalidate all user-related queries to refetch fresh data
    queryClient.invalidateQueries({ queryKey: ['users', 'current'] })
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    queryClient.invalidateQueries({ queryKey: ['users'] })
    queryClient.invalidateQueries({ queryKey: ['members'] })
    queryClient.invalidateQueries({ queryKey: ['servers'] })
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[90vw] w-[90vw] max-h-[95vh] bg-[#313338] border border-[#1e1f22] text-white p-0 overflow-hidden rounded-xl shadow-2xl"
        showCloseButton={false}
      >
        {/* Header with gradient */}
        <div className="relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#2b2d31] to-[#1e1f22] border-b border-[#3f4147]">
          <h2 className="text-xl font-bold text-white tracking-tight">User Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-[#3f4147] hover:rotate-90"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content with custom scrollbar */}
        <div className="overflow-y-auto max-h-[calc(90vh-72px)] bg-[#313338] scrollbar-thin scrollbar-thumb-[#1e1f22] scrollbar-track-transparent">
          <UserProfileView 
            user={user}
            isOwnProfile={true}
            onEdit={onClose}
            onUpdate={handleUpdate}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
