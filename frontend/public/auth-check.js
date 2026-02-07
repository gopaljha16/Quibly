// AGGRESSIVE TOKEN VALIDATION SCRIPT
// This runs IMMEDIATELY on page load to check token validity

(function () {
    'use strict';

    // Check if we're on a protected route
    const protectedRoutes = ['/channels', '/invite'];
    const currentPath = window.location.pathname;
    const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));

    // If on protected route, check for token
    if (isProtectedRoute) {
        const hasToken = document.cookie.includes('token=');

        if (!hasToken) {
            console.log('No token found on protected route, redirecting to login');
            window.location.href = '/login';
        }
    }

    // Listen for API errors and clear token immediately
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        try {
            const response = await originalFetch.apply(this, args);

            // If we get a 401, clear token and redirect
            if (response.status === 401) {
                console.log('401 Unauthorized - Clearing token and redirecting to login');
                document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

                // Only redirect if not already on login/signup
                const currentPath = window.location.pathname;
                if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
                    window.location.href = '/login';
                }
            }

            return response;
        } catch (error) {
            throw error;
        }
    };
})();
