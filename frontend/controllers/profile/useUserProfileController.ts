import { useState } from 'react'
import {
  useCurrentUser,
  useUpdateProfile,
  useUploadAvatar,
  useUploadBanner,
  useDeleteAvatar,
  useDeleteBanner
} from '@/hooks/queries/useUserProfile'

export function useUserProfileController() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: user, isLoading } = useCurrentUser()
  const updateProfileMutation = useUpdateProfile()
  const uploadAvatarMutation = useUploadAvatar()
  const uploadBannerMutation = useUploadBanner()
  const deleteAvatarMutation = useDeleteAvatar()
  const deleteBannerMutation = useDeleteBanner()

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const handleUpdateProfile = async (data: any) => {
    await updateProfileMutation.mutateAsync(data)
    closeModal()
  }

  const handleUploadAvatar = async (file: File) => {
    await uploadAvatarMutation.mutateAsync(file)
  }

  const handleUploadBanner = async (file: File) => {
    await uploadBannerMutation.mutateAsync(file)
  }

  const handleDeleteAvatar = async () => {
    await deleteAvatarMutation.mutateAsync()
  }

  const handleDeleteBanner = async () => {
    await deleteBannerMutation.mutateAsync()
  }

  return {
    user,
    isLoading,
    isModalOpen,
    openModal,
    closeModal,
    handleUpdateProfile,
    handleUploadAvatar,
    handleUploadBanner,
    handleDeleteAvatar,
    handleDeleteBanner
  }
}
