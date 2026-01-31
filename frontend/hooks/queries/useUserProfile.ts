import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, UpdateProfileData, UpdateStatusData } from '@/services/api/userService'
import { toast } from 'sonner'

// Query keys
export const userKeys = {
  all: ['users'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  profile: (userId: string) => [...userKeys.all, 'profile', userId] as const
}

// Get current user
export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async () => {
      const response = await userService.getCurrentUser()
      return response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data: any) => data.user // Extract user from response
  })
}

// Get user profile by ID
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: userKeys.profile(userId),
    queryFn: async () => {
      const response = await userService.getUserProfile(userId)
      return response
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    select: (data: any) => data.user // Extract user from response
  })
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileData) => userService.updateProfile(data),
    onSuccess: () => {
      // Invalidate both user profile queries
      queryClient.invalidateQueries({ queryKey: userKeys.current() })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update profile')
    }
  })
}

// Upload avatar mutation
export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: () => {
      // Invalidate both user profile queries
      queryClient.invalidateQueries({ queryKey: userKeys.current() })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Avatar uploaded successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to upload avatar')
    }
  })
}

// Upload banner mutation
export function useUploadBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => userService.uploadBanner(file),
    onSuccess: () => {
      // Invalidate both user profile queries
      queryClient.invalidateQueries({ queryKey: userKeys.current() })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Banner uploaded successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to upload banner')
    }
  })
}

// Delete avatar mutation
export function useDeleteAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userService.deleteAvatar,
    onSuccess: () => {
      // Invalidate both user profile queries
      queryClient.invalidateQueries({ queryKey: userKeys.current() })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Avatar removed successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to remove avatar')
    }
  })
}

// Delete banner mutation
export function useDeleteBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userService.deleteBanner,
    onSuccess: () => {
      // Invalidate both user profile queries
      queryClient.invalidateQueries({ queryKey: userKeys.current() })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Banner removed successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to remove banner')
    }
  })
}

// Update status mutation
export function useUpdateStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateStatusData) => userService.updateStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.current() })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update status')
    }
  })
}
