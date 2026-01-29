import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh (5 minutes)
      staleTime: 5 * 60 * 1000,
      // Cache time: how long unused data stays in cache (10 minutes)
      gcTime: 10 * 60 * 1000,
      // Retry failed requests
      retry: 1,
      // Refetch on window focus for real-time feel
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
})
