'use client'

import { useCurrentUser } from '@/hooks/queries/useUserProfile'
import UserProfileView from '@/components/profile/UserProfileView'
import { useState } from 'react'
import UserProfileModal from '@/components/profile/UserProfileModal'
import { apiPut } from '@/lib/api'


export default function MyProfilePage() {
  const { data: user, isLoading, refetch } = useCurrentUser()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleUpdate = async (data: any) => {
    try {
      await apiPut('/user/profile', data)
      await refetch()
      setIsEditModalOpen(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  const handleUploadAvatar = async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    await apiPut('/user/avatar', formData)
    await refetch()
  }

  const handleUploadBanner = async (file: File) => {
    const formData = new FormData()
    formData.append('banner', file)
    await apiPut('/user/banner', formData)
    await refetch()
  }

  const handleDeleteAvatar = async () => {
    await apiPut('/user/avatar/delete', {})
    await refetch()
  }

  const handleDeleteBanner = async () => {
    await apiPut('/user/banner/delete', {})
    await refetch()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#313338] flex items-center justify-center">
        <div className="text-white">Loading your profile...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#313338] flex items-center justify-center">
        <div className="text-white">Please log in to view your profile</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#313338] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-[#949ba4]">View and customize your Discord profile with tabs!</p>
        </div>

        <UserProfileView 
          user={user} 
          isOwnProfile={true}
          onEdit={() => setIsEditModalOpen(true)}
        />

        {isEditModalOpen && (
          <UserProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            user={user}
            onUpdate={handleUpdate}
            onUploadAvatar={handleUploadAvatar}
            onUploadBanner={handleUploadBanner}
            onDeleteAvatar={handleDeleteAvatar}
            onDeleteBanner={handleDeleteBanner}
          />
        )}
      </div>
    </div>
  )
}
