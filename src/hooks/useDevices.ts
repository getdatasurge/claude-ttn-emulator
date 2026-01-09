/**
 * useDevices Hook
 * React Query hook for device CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDevices, createDevice, updateDevice, deleteDevice } from '@/lib/api'
import type { DeviceInsert, DeviceUpdate } from '@/lib/types'

/**
 * Hook for managing devices with React Query
 * Provides CRUD operations with automatic cache invalidation
 */
export function useDevices() {
  const queryClient = useQueryClient()

  // Fetch all devices
  const query = useQuery({
    queryKey: ['devices'],
    queryFn: getDevices,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
    // Disable retries - if API is down, show error immediately
    // User can manually retry via SetupErrorWizard's "Try Again" button
    retry: false,
  })

  // Create device mutation
  const createMutation = useMutation({
    mutationFn: (device: DeviceInsert) => createDevice(device),
    onSuccess: () => {
      // Invalidate and refetch devices list
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
    onError: (error) => {
      console.error('Failed to create device:', error)
    },
  })

  // Update device mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: DeviceUpdate }) =>
      updateDevice(id, updates),
    onSuccess: () => {
      // Invalidate devices list and any device-specific queries
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
    onError: (error) => {
      console.error('Failed to update device:', error)
    },
  })

  // Delete device mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDevice(id),
    onSuccess: () => {
      // Invalidate devices list and any related telemetry
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
    onError: (error) => {
      console.error('Failed to delete device:', error)
    },
  })

  return {
    // Query state
    devices: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Mutation functions
    createDevice: createMutation.mutate,
    updateDevice: updateMutation.mutate,
    deleteDevice: deleteMutation.mutate,

    // Mutation state
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Async versions for manual handling
    createDeviceAsync: createMutation.mutateAsync,
    updateDeviceAsync: updateMutation.mutateAsync,
    deleteDeviceAsync: deleteMutation.mutateAsync,
  }
}

/**
 * Hook for a single device by ID
 * Uses the devices query and filters locally
 */
export function useDevice(deviceId: string | null) {
  const { devices, isLoading, isError, error } = useDevices()

  const device = devices.find((d) => d.id === deviceId) ?? null

  return {
    device,
    isLoading,
    isError,
    error,
  }
}
