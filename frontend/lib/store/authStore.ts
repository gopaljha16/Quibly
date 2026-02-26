import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

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

interface AuthState {
  // User state
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  clearError: () => void

  // Token check (for httpOnly cookies, we can't read the token directly)
  hasToken: () => boolean
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Set user and mark as authenticated
      setUser: (user: User | null) =>
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        }),

      // Set loading state
      setLoading: (loading: boolean) =>
        set({ isLoading: loading }),

      // Set error
      setError: (error: string | null) =>
        set({ error }),

      // Login - set user and mark as authenticated
      login: (user: User) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }),

      // Logout - clear user and mark as unauthenticated
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }),

      // Update user data (for profile updates, status changes, etc.)
      updateUser: (updates: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      // Clear error
      clearError: () =>
        set({ error: null }),

      // Check if token exists (for httpOnly cookies)
      hasToken: () => {
        if (typeof document === 'undefined') return false
        return document.cookie.includes('token=')
      },
    }),
    {
      name: 'auth-store',
    }
  )
)

// Selectors for better performance
export const selectUser = (state: AuthState) => state.user
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated
export const selectIsLoading = (state: AuthState) => state.isLoading
export const selectError = (state: AuthState) => state.error
