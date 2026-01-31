import { apiGet, apiPost, apiPatch, apiDelete, apiRequest } from '@/lib/api'

export interface UpdateProfileData {
  displayName?: string
  bio?: string
  pronouns?: string
  themeColor?: string
  customStatus?: string
  customStatusEmoji?: string
}

export interface UpdateStatusData {
  status: 'online' | 'idle' | 'dnd' | 'offline'
}

export const userService = {
  // Get current user profile
  getCurrentUser: async () => {
    return await apiGet('/users/me')
  },

  // Get user profile by ID
  getUserProfile: async (userId: string) => {
    return await apiGet(`/users/profile/${userId}`)
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileData) => {
    return await apiPatch('/users/profile', data)
  },

  // Upload avatar
  uploadAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    
    return await apiRequest('/users/avatar', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
  },

  // Upload banner
  uploadBanner: async (file: File) => {
    const formData = new FormData()
    formData.append('banner', file)
    
    return await apiRequest('/users/banner', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
  },

  // Delete avatar
  deleteAvatar: async () => {
    return await apiDelete('/users/avatar')
  },

  // Delete banner
  deleteBanner: async () => {
    return await apiDelete('/users/banner')
  },

  // Update status
  updateStatus: async (data: UpdateStatusData) => {
    return await apiPatch('/users/status', data)
  }
}
