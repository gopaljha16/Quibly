import { apiPost } from './api'
import { useAuthStore } from './store/authStore'

/**
 * Store authentication token in localStorage
 */
export function storeAuthToken(token: string): boolean {
    try {
        if (typeof window === 'undefined') {
            console.warn('Cannot store token: window is undefined (SSR)')
            return false
        }
        
        console.log('Storing token:', token.substring(0, 20) + '...')
        window.localStorage.setItem('token', token)
        
        // Verify it was stored
        const stored = window.localStorage.getItem('token')
        if (stored === token) {
            console.log('✓ Token successfully stored and verified')
            return true
        } else {
            console.error('✗ Token storage verification failed')
            return false
        }
    } catch (error) {
        console.error('✗ Error storing token:', error)
        return false
    }
}

/**
 * Retrieve authentication token from localStorage
 */
export function getAuthToken(): string | null {
    try {
        if (typeof window === 'undefined') return null
        return window.localStorage.getItem('token')
    } catch (error) {
        console.error('Error retrieving token:', error)
        return null
    }
}

/**
 * Utility function to logout user
 * Clears authentication token and redirects to login page
 */
export async function logout() {
    try {
        // Call backend logout endpoint to clear httpOnly cookie
        await apiPost('/auth/logout', {})
    } catch (error) {
        console.error('Logout error:', error)
    } finally {
        // Clear Zustand auth store
        useAuthStore.getState().logout()
        
        // Clear any client-side cookies (in case they exist)
        if (typeof document !== 'undefined') {
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        }

        // Clear localStorage token
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token')
        }

        // Redirect to login page
        if (typeof window !== 'undefined') {
            window.location.href = '/login'
        }
    }
}

/**
 * Check if user has a valid authentication token
 * Checks both httpOnly cookies and localStorage token
 */
export function hasAuthToken(): boolean {
    if (typeof document === 'undefined') return false
    // Check cookie first
    if (document.cookie.includes('token=')) return true
    // Fall back to localStorage
    if (typeof window !== 'undefined' && localStorage.getItem('token')) return true
    return false
}

