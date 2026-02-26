import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  clearError: () => void
  getToken: () => string | null
  hasToken: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
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

      // Set token and persist to localStorage
      setToken: (token: string | null) => {
        console.log('setToken called with:', token ? `${token.substring(0, 20)}...` : 'null')
        set({ token })
        // Also store in localStorage directly for redundancy
        if (typeof window !== 'undefined') {
          if (token) {
            window.localStorage.setItem('token', token)
            console.log('✓ Token stored in localStorage')
          } else {
            window.localStorage.removeItem('token')
            console.log('✓ Token removed from localStorage')
          }
        }
      },

      // Set loading state
      setLoading: (loading: boolean) =>
        set({ isLoading: loading }),

      // Set error
      setError: (error: string | null) =>
        set({ error }),

      // Login - set user, token and mark as authenticated
      login: (user: User, token: string) => {
        console.log('login called with user:', user.username, 'and token:', token.substring(0, 20) + '...')
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
        // Also store in localStorage directly
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('token', token)
          console.log('✓ Token stored in localStorage via login')
        }
      },

      // Logout - clear user, token and mark as unauthenticated
      logout: () => {
        console.log('logout called')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
        // Also remove from localStorage directly
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('token')
          console.log('✓ Token removed from localStorage via logout')
        }
      },

      // Update user data (for profile updates, status changes, etc.)
      updateUser: (updates: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      // Clear error
      clearError: () =>
        set({ error: null }),

      // Get token from store
      getToken: () => {
        const token = get().token
        console.log('getToken called, returning:', token ? `${token.substring(0, 20)}...` : 'null')
        return token
      },

      // Check if token exists (checks store, cookies, and localStorage)
      hasToken: () => {
        if (typeof window === 'undefined') return false
        
        // Check store first
        const storeToken = get().token
        if (storeToken) {
          console.log('✓ Token found in store')
          return true
        }
        
        // Check cookie
        if (typeof document !== 'undefined' && document.cookie.includes('token=')) {
          console.log('✓ Token found in cookie')
          return true
        }
        
        // Check localStorage
        const localToken = window.localStorage.getItem('token')
        if (localToken) {
          console.log('✓ Token found in localStorage')
          // Sync to store if found in localStorage but not in store
          set({ token: localToken })
          return true
        }
        
        console.log('✗ No token found')
        return false
      },
    }),
    {
      name: 'auth-storage',
      // Only persist user and token, not loading/error states
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Selectors for better performance
export const selectUser = (state: AuthState) => state.user
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated
export const selectIsLoading = (state: AuthState) => state.isLoading
export const selectError = (state: AuthState) => state.error
export const selectToken = (state: AuthState) => state.token
