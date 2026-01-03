/**
 * usePolling Hook
 * Utility hook for polling data with React Query
 */

import { useQuery, type QueryKey } from '@tanstack/react-query'

export interface UsePollingOptions<T> {
  queryKey: QueryKey
  queryFn: () => Promise<T>
  interval?: number // Polling interval in milliseconds
  enabled?: boolean // Whether polling should be active
  staleTime?: number // How long data stays fresh
}

/**
 * Generic polling hook using React Query
 * Automatically refetches data at specified intervals
 */
export function usePolling<T>({
  queryKey,
  queryFn,
  interval = 5000, // Default 5 seconds
  enabled = true,
  staleTime = 1000,
}: UsePollingOptions<T>) {
  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    refetchInterval: enabled ? interval : false,
    refetchIntervalInBackground: false, // Pause when tab is not visible
    refetchOnWindowFocus: true,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  }
}

/**
 * Hook for conditional polling
 * Starts/stops polling based on a condition
 */
export function useConditionalPolling<T>(
  options: UsePollingOptions<T> & {
    shouldPoll: boolean // Condition for whether to poll
  }
) {
  return usePolling({
    ...options,
    enabled: options.enabled && options.shouldPoll,
  })
}
