/**
 * Centralized Auth Type Definitions
 * This file ensures type consistency across the entire auth system
 */

// User type from auth store
export interface User {
  id: string
  username: string
  discriminator: string
  email: string
  avatar: string | null
  banner: string | null
  bio: string | null
  status: 'online' | 'idle' | 'dnd' | 'offline'
  customStatus: string | null
  isVerified: boolean
  createdAt?: string
  lastSeen?: string
}

// API Response types
export interface UserResponse {
  success?: boolean
  user: User
  message?: string
}

export interface LoginResponse {
  success?: boolean
  user: User
  token: string
  message?: string
}

export interface SignupResponse {
  success: boolean
  message?: string
  user?: User
  token?: string
  recommendedChannels?: any[]
}

// Form data types
export interface LoginFormData {
  email: string
  password: string
}

export interface SignupFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

// Error types
export interface LoginErrors {
  email?: string
  password?: string
}

export interface SignupErrors {
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
  interests?: string
}

// Auth state type
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// Auth actions type
export interface AuthActions {
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  clearError: () => void
  hasToken: () => boolean
}

// Combined auth store type
export type AuthStore = AuthState & AuthActions
