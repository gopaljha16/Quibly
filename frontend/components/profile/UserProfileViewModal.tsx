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
      <DialogContent className="max-w-4xl max-h-[95vh] bg-[#313338] border-none text-white p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3f4147] bg-[#313338]">
          <h2 className="text-xl font-bold">User Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-80px)] p-6">
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
