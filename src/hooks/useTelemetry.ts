/**
 * useTelemetry Hook
 * React Query hook for fetching telemetry data
 */

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTelemetry } from '@/lib/api'

export interface UseTelemetryOptions {
  limit?: number
  offset?: number
  refetchInterval?: number | false // Auto-refresh interval in ms
  enabled?: boolean // Whether query should run
}

/**
 * Hook for fetching telemetry data for a specific device
 * Supports pagination and automatic polling
 */
export function useTelemetry(
  deviceId: string | null,
  options: UseTelemetryOptions = {}
) {
  const {
    limit = 100,
    offset = 0,
    refetchInterval = false, // Disabled by default, enable for real-time
    enabled = true,
  } = options

  const query = useQuery({
    queryKey: ['telemetry', deviceId, limit, offset],
    queryFn: () => {
      if (!deviceId) {
        throw new Error('Device ID is required')
      }
      return getTelemetry(deviceId, { limit, offset })
    },
    enabled: enabled && !!deviceId, // Only run if enabled and deviceId exists
    staleTime: 10000, // Consider data fresh for 10 seconds
    refetchInterval, // Auto-refresh if set
    refetchOnWindowFocus: true,
    // Disable retries - show errors immediately for better UX
    retry: false,
  })

  return {
    telemetry: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  }
}

/**
 * Hook for latest telemetry reading for a device
 * Returns only the most recent reading
 */
export function useLatestTelemetry(
  deviceId: string | null,
  refetchInterval: number | false = 5000 // Default 5 second polling
) {
  const { telemetry, isLoading, isError, error, refetch } = useTelemetry(
    deviceId,
    {
      limit: 1,
      offset: 0,
      refetchInterval,
    }
  )

  return {
    latestReading: telemetry[0] ?? null,
    isLoading,
    isError,
    error,
    refetch,
  }
}

/**
 * Hook for paginated telemetry data
 * Provides helper functions for pagination
 */
export function usePaginatedTelemetry(
  deviceId: string | null,
  pageSize: number = 50
) {
  const [page, setPage] = React.useState(0)

  const { telemetry, isLoading, isError, error, refetch } = useTelemetry(
    deviceId,
    {
      limit: pageSize,
      offset: page * pageSize,
    }
  )

  const nextPage = React.useCallback(() => {
    setPage((prev) => prev + 1)
  }, [])

  const previousPage = React.useCallback(() => {
    setPage((prev) => Math.max(0, prev - 1))
  }, [])

  const goToPage = React.useCallback((newPage: number) => {
    setPage(Math.max(0, newPage))
  }, [])

  const resetPagination = React.useCallback(() => {
    setPage(0)
  }, [])

  return {
    telemetry,
    isLoading,
    isError,
    error,
    refetch,
    // Pagination state
    page,
    pageSize,
    hasMore: telemetry.length === pageSize,
    // Pagination controls
    nextPage,
    previousPage,
    goToPage,
    resetPagination,
  }
}
