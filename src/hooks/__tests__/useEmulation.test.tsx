/**
 * useEmulation Hook Tests
 * Tests for device emulation logic
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEmulation } from '../useEmulation'
import * as api from '@/lib/api'
import * as ttnPayload from '@/lib/ttn-payload'

// Mock dependencies
vi.mock('@/lib/api')
vi.mock('@/lib/ttn-payload')
vi.mock('../useDevices')
vi.mock('../use-toast')

// Import mocked modules
import { useDevices } from '../useDevices'
import { useToast } from '../use-toast'
import type { Device } from '@/lib/types'

describe('useEmulation', () => {
  let queryClient: QueryClient
  const mockToast = vi.fn()
  const mockDevices: Device[] = []

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Setup query client
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
      logger: {
        log: () => {},
        warn: () => {},
        error: () => {},
      },
    })

    // Mock useToast
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    })

    // Mock useDevices
    vi.mocked(useDevices).mockReturnValue({
      devices: mockDevices,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      createDevice: vi.fn(),
      updateDevice: vi.fn(),
      deleteDevice: vi.fn(),
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      createDeviceAsync: vi.fn(),
      updateDeviceAsync: vi.fn(),
      deleteDeviceAsync: vi.fn(),
    })

    // Mock API functions
    vi.mocked(api.simulateTTNUplink).mockResolvedValue({
      success: true,
      message: 'Simulation successful',
    })

    // Mock TTN payload functions
    vi.mocked(ttnPayload.generateRandomReading).mockReturnValue({
      temperature: 5.2,
      battery: 3.4,
    })

    // Mock crypto.randomUUID using vi.stubGlobal
    vi.stubGlobal('crypto', {
      ...crypto,
      randomUUID: () => 'test-uuid-' + Date.now(),
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('Initial State', () => {
    it('should initialize with stopped status', () => {
      const { result } = renderHook(() => useEmulation(), { wrapper })

      expect(result.current.status).toBe('stopped')
      expect(result.current.readingsCount).toBe(0)
      expect(result.current.logs).toEqual([])
      expect(result.current.lastError).toBeNull()
    })

    it('should have zero active devices initially', () => {
      const { result } = renderHook(() => useEmulation(), { wrapper })

      expect(result.current.activeDeviceCount).toBe(0)
    })

    it('should accept custom options', () => {
      const { result } = renderHook(
        () => useEmulation({ defaultInterval: 60000, maxLogs: 50 }),
        { wrapper }
      )

      expect(result.current.status).toBe('stopped')
    })
  })

  describe('Device Management', () => {
    it('should count active devices correctly', () => {
      const activeDevices: Device[] = [
        {
          id: 'dev-1',
          organization_id: 'org-1',
          dev_eui: '0004A30B001A2B3C',
          name: 'Device 1',
          device_type: 'temperature',
          status: 'active',
          simulation_params: '{}',
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          id: 'dev-2',
          organization_id: 'org-1',
          dev_eui: '0004A30B001A2B3D',
          name: 'Device 2',
          device_type: 'humidity',
          status: 'active',
          simulation_params: '{}',
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      ]

      vi.mocked(useDevices).mockReturnValue({
        devices: activeDevices,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        createDevice: vi.fn(),
        updateDevice: vi.fn(),
        deleteDevice: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        createDeviceAsync: vi.fn(),
        updateDeviceAsync: vi.fn(),
        deleteDeviceAsync: vi.fn(),
      })

      const { result } = renderHook(() => useEmulation(), { wrapper })

      expect(result.current.activeDeviceCount).toBe(2)
    })

    it('should filter inactive devices', () => {
      const mixedDevices: Device[] = [
        {
          id: 'dev-1',
          organization_id: 'org-1',
          dev_eui: '0004A30B001A2B3C',
          name: 'Active Device',
          device_type: 'temperature',
          status: 'active',
          simulation_params: '{}',
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          id: 'dev-2',
          organization_id: 'org-1',
          dev_eui: '0004A30B001A2B3D',
          name: 'Inactive Device',
          device_type: 'humidity',
          status: 'inactive',
          simulation_params: '{}',
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      ]

      vi.mocked(useDevices).mockReturnValue({
        devices: mixedDevices,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        createDevice: vi.fn(),
        updateDevice: vi.fn(),
        deleteDevice: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        createDeviceAsync: vi.fn(),
        updateDeviceAsync: vi.fn(),
        deleteDeviceAsync: vi.fn(),
      })

      const { result } = renderHook(() => useEmulation(), { wrapper })

      expect(result.current.activeDeviceCount).toBe(1)
    })
  })

  describe('Single Reading', () => {
    it('should send single reading to active devices', async () => {
      const activeDevice: Device = {
        id: 'dev-1',
        organization_id: 'org-1',
        dev_eui: '0004A30B001A2B3C',
        name: 'Test Device',
        device_type: 'temperature',
        status: 'active',
        simulation_params: JSON.stringify({ interval: 30 }),
        created_at: Date.now(),
        updated_at: Date.now(),
      }

      vi.mocked(useDevices).mockReturnValue({
        devices: [activeDevice],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        createDevice: vi.fn(),
        updateDevice: vi.fn(),
        deleteDevice: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        createDeviceAsync: vi.fn(),
        updateDeviceAsync: vi.fn(),
        deleteDeviceAsync: vi.fn(),
      })

      const { result } = renderHook(() => useEmulation(), { wrapper })

      await act(async () => {
        await result.current.sendSingleReading()
      })

      await waitFor(() => {
        expect(api.simulateTTNUplink).toHaveBeenCalledWith(
          'dev-1',
          expect.objectContaining({
            temperature: 5.2,
            battery: 3.4,
            f_cnt: 1,
          })
        )
      })

      expect(result.current.readingsCount).toBe(1)
      expect(result.current.logs).toHaveLength(1)
      expect(result.current.logs[0].success).toBe(true)
    })

    it('should show toast when no active devices', async () => {
      const { result } = renderHook(() => useEmulation(), { wrapper })

      await act(async () => {
        await result.current.sendSingleReading()
      })

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'No active devices',
          variant: 'destructive',
        })
      )
    })

    it('should handle API errors gracefully', async () => {
      const activeDevice: Device = {
        id: 'dev-1',
        organization_id: 'org-1',
        dev_eui: '0004A30B001A2B3C',
        name: 'Test Device',
        device_type: 'temperature',
        status: 'active',
        simulation_params: '{}',
        created_at: Date.now(),
        updated_at: Date.now(),
      }

      vi.mocked(useDevices).mockReturnValue({
        devices: [activeDevice],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        createDevice: vi.fn(),
        updateDevice: vi.fn(),
        deleteDevice: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        createDeviceAsync: vi.fn(),
        updateDeviceAsync: vi.fn(),
        deleteDeviceAsync: vi.fn(),
      })

      vi.mocked(api.simulateTTNUplink).mockRejectedValue(
        new Error('API Error')
      )

      const { result } = renderHook(() => useEmulation(), { wrapper })

      await act(async () => {
        await result.current.sendSingleReading()
      })

      await waitFor(() => {
        expect(result.current.logs[0].success).toBe(false)
        expect(result.current.logs[0].message).toContain('API Error')
        expect(result.current.lastError).toBe('API Error')
      })
    })
  })

  describe('Continuous Emulation', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should start emulation for active devices', async () => {
      const activeDevice: Device = {
        id: 'dev-1',
        organization_id: 'org-1',
        dev_eui: '0004A30B001A2B3C',
        name: 'Test Device',
        device_type: 'temperature',
        status: 'active',
        simulation_params: JSON.stringify({ interval: 30 }),
        created_at: Date.now(),
        updated_at: Date.now(),
      }

      vi.mocked(useDevices).mockReturnValue({
        devices: [activeDevice],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        createDevice: vi.fn(),
        updateDevice: vi.fn(),
        deleteDevice: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        createDeviceAsync: vi.fn(),
        updateDeviceAsync: vi.fn(),
        deleteDeviceAsync: vi.fn(),
      })

      const { result } = renderHook(() => useEmulation(), { wrapper })

      await act(async () => {
        result.current.startEmulation()
        // Flush only pending promises without triggering interval loops
        await vi.runOnlyPendingTimersAsync()
      })

      expect(result.current.status).toBe('running')
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Emulation started',
        })
      )

      // Should have sent initial reading(s) - the hook may trigger multiple calls
      // due to the useEffect that monitors device changes
      expect(api.simulateTTNUplink).toHaveBeenCalled()
    })

    it('should send readings at configured intervals', async () => {
      const activeDevice: Device = {
        id: 'dev-1',
        organization_id: 'org-1',
        dev_eui: '0004A30B001A2B3C',
        name: 'Test Device',
        device_type: 'temperature',
        status: 'active',
        simulation_params: JSON.stringify({ interval: 30 }), // 30 seconds
        created_at: Date.now(),
        updated_at: Date.now(),
      }

      vi.mocked(useDevices).mockReturnValue({
        devices: [activeDevice],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        createDevice: vi.fn(),
        updateDevice: vi.fn(),
        deleteDevice: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        createDeviceAsync: vi.fn(),
        updateDeviceAsync: vi.fn(),
        deleteDeviceAsync: vi.fn(),
      })

      const { result } = renderHook(() => useEmulation(), { wrapper })

      await act(async () => {
        result.current.startEmulation()
        // Flush initial reading
        await vi.runOnlyPendingTimersAsync()
      })

      // Initial reading should have been sent (may be called multiple times initially)
      const initialCallCount = vi.mocked(api.simulateTTNUplink).mock.calls.length
      expect(initialCallCount).toBeGreaterThan(0)

      // Advance time by 30 seconds and flush timers
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30000)
      })

      // Should have sent additional reading(s) from the interval
      expect(api.simulateTTNUplink).toHaveBeenCalledTimes(initialCallCount + 1)
    })

    it('should stop emulation', async () => {
      const activeDevice: Device = {
        id: 'dev-1',
        organization_id: 'org-1',
        dev_eui: '0004A30B001A2B3C',
        name: 'Test Device',
        device_type: 'temperature',
        status: 'active',
        simulation_params: '{}',
        created_at: Date.now(),
        updated_at: Date.now(),
      }

      vi.mocked(useDevices).mockReturnValue({
        devices: [activeDevice],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        createDevice: vi.fn(),
        updateDevice: vi.fn(),
        deleteDevice: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        createDeviceAsync: vi.fn(),
        updateDeviceAsync: vi.fn(),
        deleteDeviceAsync: vi.fn(),
      })

      const { result } = renderHook(() => useEmulation(), { wrapper })

      // Start emulation
      await act(async () => {
        result.current.startEmulation()
        await vi.runOnlyPendingTimersAsync()
      })

      expect(result.current.status).toBe('running')

      // Stop emulation
      act(() => {
        result.current.stopEmulation()
      })

      expect(result.current.status).toBe('stopped')
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Emulation stopped',
        })
      )
    })

    it('should warn when starting with no active devices', async () => {
      const { result } = renderHook(() => useEmulation(), { wrapper })

      await act(async () => {
        result.current.startEmulation()
      })

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'No active devices',
          variant: 'destructive',
        })
      )
      expect(result.current.status).toBe('stopped')
    })
  })

  describe('Log Management', () => {
    it('should add logs for successful readings', async () => {
      const activeDevice: Device = {
        id: 'dev-1',
        organization_id: 'org-1',
        dev_eui: '0004A30B001A2B3C',
        name: 'Test Device',
        device_type: 'temperature',
        status: 'active',
        simulation_params: '{}',
        created_at: Date.now(),
        updated_at: Date.now(),
      }

      vi.mocked(useDevices).mockReturnValue({
        devices: [activeDevice],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        createDevice: vi.fn(),
        updateDevice: vi.fn(),
        deleteDevice: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        createDeviceAsync: vi.fn(),
        updateDeviceAsync: vi.fn(),
        deleteDeviceAsync: vi.fn(),
      })

      const { result } = renderHook(() => useEmulation(), { wrapper })

      await act(async () => {
        await result.current.sendSingleReading()
      })

      await waitFor(() => {
        expect(result.current.logs).toHaveLength(1)
        expect(result.current.logs[0]).toMatchObject({
          deviceId: 'dev-1',
          deviceName: 'Test Device',
          deviceType: 'temperature',
          success: true,
        })
      })
    })

    it('should limit logs to maxLogs', async () => {
      const activeDevice: Device = {
        id: 'dev-1',
        organization_id: 'org-1',
        dev_eui: '0004A30B001A2B3C',
        name: 'Test Device',
        device_type: 'temperature',
        status: 'active',
        simulation_params: '{}',
        created_at: Date.now(),
        updated_at: Date.now(),
      }

      vi.mocked(useDevices).mockReturnValue({
        devices: [activeDevice],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        createDevice: vi.fn(),
        updateDevice: vi.fn(),
        deleteDevice: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        createDeviceAsync: vi.fn(),
        updateDeviceAsync: vi.fn(),
        deleteDeviceAsync: vi.fn(),
      })

      const { result } = renderHook(
        () => useEmulation({ maxLogs: 2 }),
        { wrapper }
      )

      // Send 3 readings
      await act(async () => {
        await result.current.sendSingleReading()
        await result.current.sendSingleReading()
        await result.current.sendSingleReading()
      })

      await waitFor(() => {
        expect(result.current.logs).toHaveLength(2) // Should keep only last 2
      })
    })
  })

  describe('Reset', () => {
    it('should reset all counters and logs', async () => {
      const activeDevice: Device = {
        id: 'dev-1',
        organization_id: 'org-1',
        dev_eui: '0004A30B001A2B3C',
        name: 'Test Device',
        device_type: 'temperature',
        status: 'active',
        simulation_params: '{}',
        created_at: Date.now(),
        updated_at: Date.now(),
      }

      vi.mocked(useDevices).mockReturnValue({
        devices: [activeDevice],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        createDevice: vi.fn(),
        updateDevice: vi.fn(),
        deleteDevice: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        createDeviceAsync: vi.fn(),
        updateDeviceAsync: vi.fn(),
        deleteDeviceAsync: vi.fn(),
      })

      const { result } = renderHook(() => useEmulation(), { wrapper })

      // Send a reading
      await act(async () => {
        await result.current.sendSingleReading()
      })

      await waitFor(() => {
        expect(result.current.readingsCount).toBe(1)
        expect(result.current.logs).toHaveLength(1)
      })

      // Reset
      act(() => {
        result.current.resetEmulation()
      })

      expect(result.current.readingsCount).toBe(0)
      expect(result.current.logs).toEqual([])
      expect(result.current.lastError).toBeNull()
    })
  })

  describe('Cleanup', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should clear intervals on unmount', async () => {
      const activeDevice: Device = {
        id: 'dev-1',
        organization_id: 'org-1',
        dev_eui: '0004A30B001A2B3C',
        name: 'Test Device',
        device_type: 'temperature',
        status: 'active',
        simulation_params: '{}',
        created_at: Date.now(),
        updated_at: Date.now(),
      }

      vi.mocked(useDevices).mockReturnValue({
        devices: [activeDevice],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        createDevice: vi.fn(),
        updateDevice: vi.fn(),
        deleteDevice: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        createDeviceAsync: vi.fn(),
        updateDeviceAsync: vi.fn(),
        deleteDeviceAsync: vi.fn(),
      })

      const { result, unmount } = renderHook(() => useEmulation(), { wrapper })

      // Start emulation
      await act(async () => {
        result.current.startEmulation()
        await vi.runOnlyPendingTimersAsync()
      })

      const callCountBefore = vi.mocked(api.simulateTTNUplink).mock.calls.length

      // Unmount
      unmount()

      // Advance timers - should not send more readings
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60000)
      })

      const callCountAfter = vi.mocked(api.simulateTTNUplink).mock.calls.length
      expect(callCountAfter).toBe(callCountBefore)
    })
  })
})
