import { apiPost } from './api'
import { useAuthStore } from './store/authStore'

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

        // Redirect to login page
        if (typeof window !== 'undefined') {
            window.location.href = '/login'
        }
    }
}

/**
 * Check if user has a valid authentication token
 * Note: With httpOnly cookies, we can't directly read the token
 * This function checks for any token cookie presence
 */
export function hasAuthToken(): boolean {
    if (typeof document === 'undefined') return false
    return document.cookie.includes('token=')
}
