/**
 * Utility function to logout user
 * Clears authentication token and redirects to login page
 */
export function logout() {
    // Clear authentication cookie
    if (typeof document !== 'undefined') {
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }

    // Redirect to login page
    if (typeof window !== 'undefined') {
        window.location.href = '/login'
    }
}

/**
 * Check if user has a valid authentication token
 */
export function hasAuthToken(): boolean {
    if (typeof document === 'undefined') return false
    return document.cookie.includes('token=')
}
