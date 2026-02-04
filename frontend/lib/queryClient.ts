import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh (5 minutes)
      staleTime: 5 * 60 * 1000,
      // Cache time: how long unused data stays in cache (10 minutes)
      gcTime: 10 * 60 * 1000,
      // Don't retry failed requests automatically
      retry: false,
      // Don't refetch on window focus
      refetchOnWindowFocus: false,
      // Don't refetch on mount if data exists
      refetchOnMount: false,
      // Don't refetch on reconnect
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
})
