/**
 * useDevices Hook Tests
 * Tests for device CRUD operations with React Query
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDevices, useDevice } from '../useDevices'
import * as api from '@/lib/api'
import type { Device, DeviceInsert, DeviceUpdate } from '@/lib/types'

// Mock the API module
vi.mock('@/lib/api')

describe('useDevices', () => {
  let queryClient: QueryClient

  const mockDevice: Device = {
    id: 'dev-123',
    organization_id: 'org-123',
    dev_eui: '0004A30B001A2B3C',
    name: 'Test Device',
    device_type: 'temperature',
    status: 'active',
    simulation_params: JSON.stringify({ interval: 30 }),
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
  }

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
      logger: {
        log: () => {},
        warn: () => {},
        error: () => {},
      },
    })

    // Mock API responses
    vi.mocked(api.getDevices).mockResolvedValue([mockDevice])
    vi.mocked(api.createDevice).mockResolvedValue(mockDevice)
    vi.mocked(api.updateDevice).mockResolvedValue({
      ...mockDevice,
      name: 'Updated Device',
    })
    vi.mocked(api.deleteDevice).mockResolvedValue({ success: true })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('Query Operations', () => {
    it('should fetch devices on mount', async () => {
      const { result } = renderHook(() => useDevices(), { wrapper })

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.devices).toEqual([])

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.devices).toEqual([mockDevice])
      expect(api.getDevices).toHaveBeenCalledTimes(1)
    })

    it('should handle empty device list', async () => {
      vi.mocked(api.getDevices).mockResolvedValue([])

      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.devices).toEqual([])
      expect(result.current.isError).toBe(false)
    })

    it('should handle fetch errors', async () => {
      const errorMessage = 'Failed to fetch devices'
      vi.mocked(api.getDevices).mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeTruthy()
      expect(result.current.devices).toEqual([])
    })

    it('should refetch devices when refetch is called', async () => {
      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(api.getDevices).toHaveBeenCalledTimes(1)

      // Refetch
      await act(async () => {
        await result.current.refetch()
      })

      expect(api.getDevices).toHaveBeenCalledTimes(2)
    })
  })

  describe('Create Operations', () => {
    it('should create a device', async () => {
      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const newDevice: DeviceInsert = {
        organization_id: 'org-123',
        dev_eui: '0004A30B001A2B3D',
        name: 'New Device',
        device_type: 'humidity',
        status: 'active',
        simulation_params: '{}',
      }

      await act(async () => {
        await result.current.createDeviceAsync(newDevice)
      })

      expect(api.createDevice).toHaveBeenCalledWith(newDevice)

      // Should invalidate cache and refetch
      await waitFor(() => {
        expect(api.getDevices).toHaveBeenCalledTimes(2)
      })
    })

    it('should track creating state', async () => {
      // Make create device slow
      vi.mocked(api.createDevice).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockDevice), 100))
      )

      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const newDevice: DeviceInsert = {
        organization_id: 'org-123',
        dev_eui: '0004A30B001A2B3D',
        name: 'New Device',
        device_type: 'humidity',
        status: 'active',
        simulation_params: '{}',
      }

      act(() => {
        result.current.createDevice(newDevice)
      })

      // Should be creating
      expect(result.current.isCreating).toBe(true)

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false)
      })
    })

    it('should handle create errors', async () => {
      const errorMessage = 'Failed to create device'
      vi.mocked(api.createDevice).mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const newDevice: DeviceInsert = {
        organization_id: 'org-123',
        dev_eui: '0004A30B001A2B3D',
        name: 'New Device',
        device_type: 'humidity',
        status: 'active',
        simulation_params: '{}',
      }

      await expect(
        act(async () => {
          await result.current.createDeviceAsync(newDevice)
        })
      ).rejects.toThrow(errorMessage)

      expect(result.current.isCreating).toBe(false)
    })
  })

  describe('Update Operations', () => {
    it('should update a device', async () => {
      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const updates: DeviceUpdate = {
        name: 'Updated Device',
        status: 'inactive',
      }

      await act(async () => {
        await result.current.updateDeviceAsync({
          id: 'dev-123',
          updates,
        })
      })

      expect(api.updateDevice).toHaveBeenCalledWith('dev-123', updates)

      // Should invalidate cache and refetch
      await waitFor(() => {
        expect(api.getDevices).toHaveBeenCalledTimes(2)
      })
    })

    it('should track updating state', async () => {
      // Make update device slow
      vi.mocked(api.updateDevice).mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ ...mockDevice, name: 'Updated' }), 100)
          )
      )

      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.updateDevice({
          id: 'dev-123',
          updates: { name: 'Updated' },
        })
      })

      // Should be updating
      expect(result.current.isUpdating).toBe(true)

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false)
      })
    })

    it('should handle update errors', async () => {
      const errorMessage = 'Failed to update device'
      vi.mocked(api.updateDevice).mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.updateDeviceAsync({
            id: 'dev-123',
            updates: { name: 'Updated' },
          })
        })
      ).rejects.toThrow(errorMessage)

      expect(result.current.isUpdating).toBe(false)
    })
  })

  describe('Delete Operations', () => {
    it('should delete a device', async () => {
      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.deleteDeviceAsync('dev-123')
      })

      expect(api.deleteDevice).toHaveBeenCalledWith('dev-123')

      // Should invalidate cache and refetch
      await waitFor(() => {
        expect(api.getDevices).toHaveBeenCalledTimes(2)
      })
    })

    it('should track deleting state', async () => {
      // Make delete device slow
      vi.mocked(api.deleteDevice).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.deleteDevice('dev-123')
      })

      // Should be deleting
      expect(result.current.isDeleting).toBe(true)

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false)
      })
    })

    it('should handle delete errors', async () => {
      const errorMessage = 'Failed to delete device'
      vi.mocked(api.deleteDevice).mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.deleteDeviceAsync('dev-123')
        })
      ).rejects.toThrow(errorMessage)

      expect(result.current.isDeleting).toBe(false)
    })
  })

  describe('Cache Invalidation', () => {
    it('should refetch after successful create', async () => {
      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCallCount = vi.mocked(api.getDevices).mock.calls.length

      await act(async () => {
        await result.current.createDeviceAsync({
          organization_id: 'org-123',
          dev_eui: '0004A30B001A2B3D',
          name: 'New Device',
          device_type: 'humidity',
          status: 'active',
          simulation_params: '{}',
        })
      })

      // Should have called getDevices again
      await waitFor(() => {
        expect(api.getDevices).toHaveBeenCalledTimes(initialCallCount + 1)
      })
    })

    it('should refetch after successful update', async () => {
      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCallCount = vi.mocked(api.getDevices).mock.calls.length

      await act(async () => {
        await result.current.updateDeviceAsync({
          id: 'dev-123',
          updates: { name: 'Updated' },
        })
      })

      // Should have called getDevices again
      await waitFor(() => {
        expect(api.getDevices).toHaveBeenCalledTimes(initialCallCount + 1)
      })
    })

    it('should refetch after successful delete', async () => {
      const { result } = renderHook(() => useDevices(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCallCount = vi.mocked(api.getDevices).mock.calls.length

      await act(async () => {
        await result.current.deleteDeviceAsync('dev-123')
      })

      // Should have called getDevices again
      await waitFor(() => {
        expect(api.getDevices).toHaveBeenCalledTimes(initialCallCount + 1)
      })
    })
  })
})

describe('useDevice', () => {
  let queryClient: QueryClient

  const mockDevices: Device[] = [
    {
      id: 'dev-123',
      organization_id: 'org-123',
      dev_eui: '0004A30B001A2B3C',
      name: 'Device 1',
      device_type: 'temperature',
      status: 'active',
      simulation_params: '{}',
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    },
    {
      id: 'dev-456',
      organization_id: 'org-123',
      dev_eui: '0004A30B001A2B3D',
      name: 'Device 2',
      device_type: 'humidity',
      status: 'active',
      simulation_params: '{}',
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
      },
      logger: {
        log: () => {},
        warn: () => {},
        error: () => {},
      },
    })

    vi.mocked(api.getDevices).mockResolvedValue(mockDevices)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should return device by ID', async () => {
    const { result } = renderHook(() => useDevice('dev-123'), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.device).toEqual(mockDevices[0])
  })

  it('should return null for non-existent device', async () => {
    const { result } = renderHook(() => useDevice('non-existent'), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.device).toBeNull()
  })

  it('should return null when deviceId is null', async () => {
    const { result } = renderHook(() => useDevice(null), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.device).toBeNull()
  })

  it('should update when device list changes', async () => {
    const { result, rerender } = renderHook(
      ({ deviceId }) => useDevice(deviceId),
      {
        wrapper,
        initialProps: { deviceId: 'dev-123' },
      }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.device).toEqual(mockDevices[0])

    // Change device ID
    rerender({ deviceId: 'dev-456' })

    await waitFor(() => {
      expect(result.current.device).toEqual(mockDevices[1])
    })
  })
})
