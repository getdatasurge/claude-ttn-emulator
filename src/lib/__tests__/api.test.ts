/**
 * API Client Tests
 * Tests for Cloudflare Workers API client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as api from '../api'
import type { DeviceInsert, DeviceUpdate } from '../types'

// Mock stackAuth
vi.mock('../stackAuth', () => ({
  stackClientApp: {
    getUser: vi.fn(),
  },
}))

import { stackClientApp } from '../stackAuth'

describe('API Client', () => {
  const mockFetch = vi.fn()
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch

    // Mock successful auth
    vi.mocked(stackClientApp.getUser).mockResolvedValue({
      id: 'user-123',
      primaryEmail: 'test@example.com',
      displayName: 'Test User',
      getAuthHeaders: async () => ({
        'x-stack-auth': JSON.stringify({
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
        }),
      }),
    } as any)
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('getAuthHeaders', () => {
    it('should return auth headers when user is authenticated', async () => {
      const { getDevices } = await import('../api')

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      })

      await getDevices()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-stack-auth': expect.stringContaining('accessToken'),
          }),
        })
      )
    })

    it('should return empty headers when user is not authenticated', async () => {
      vi.mocked(stackClientApp.getUser).mockResolvedValue(null)

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      })

      await api.getDevices()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })
  })

  describe('Device Operations', () => {
    it('should fetch devices', async () => {
      const mockDevices = [
        {
          id: 'dev-123',
          organization_id: 'org-123',
          dev_eui: '0004A30B001A2B3C',
          name: 'Test Device',
          device_type: 'temperature',
          status: 'active',
          simulation_params: '{}',
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockDevices,
      })

      const result = await api.getDevices()

      expect(result).toEqual(mockDevices)
      // Verify fetch was called (URL format may vary based on environment)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('/api/devices')
    })

    it('should create device', async () => {
      const newDevice: DeviceInsert = {
        organization_id: 'org-123',
        dev_eui: '0004A30B001A2B3C',
        name: 'New Device',
        device_type: 'temperature',
        status: 'active',
        simulation_params: '{}',
      }

      const createdDevice = {
        ...newDevice,
        id: 'dev-123',
        created_at: Date.now(),
        updated_at: Date.now(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => createdDevice,
      })

      const result = await api.createDevice(newDevice)

      expect(result).toEqual(createdDevice)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/devices'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newDevice),
        })
      )
    })

    it('should update device', async () => {
      const updates: DeviceUpdate = {
        name: 'Updated Device',
        status: 'inactive',
      }

      const updatedDevice = {
        id: 'dev-123',
        organization_id: 'org-123',
        dev_eui: '0004A30B001A2B3C',
        name: 'Updated Device',
        device_type: 'temperature' as const,
        status: 'inactive' as const,
        simulation_params: '{}',
        created_at: Date.now(),
        updated_at: Date.now(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => updatedDevice,
      })

      const result = await api.updateDevice('dev-123', updates)

      expect(result).toEqual(updatedDevice)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/devices/dev-123'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      )
    })

    it('should delete device', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await api.deleteDevice('dev-123')

      expect(result).toEqual({ success: true })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/devices/dev-123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('Telemetry Operations', () => {
    it('should fetch telemetry with default options', async () => {
      const mockTelemetry = [
        {
          id: 'tel-123',
          device_id: 'dev-123',
          timestamp: Date.now(),
          payload: '{"temperature": 5.2}',
          rssi: -60,
          snr: 9.5,
          created_at: Date.now(),
        },
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTelemetry,
      })

      const result = await api.getTelemetry('dev-123')

      expect(result).toEqual(mockTelemetry)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/devices/dev-123/telemetry'),
        expect.any(Object)
      )
    })

    it('should fetch telemetry with custom limit and offset', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      })

      await api.getTelemetry('dev-123', { limit: 50, offset: 10 })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=10'),
        expect.any(Object)
      )
    })
  })

  describe('TTN Operations', () => {
    it('should simulate TTN uplink', async () => {
      const payload = {
        temperature: 5.2,
        battery: 3.4,
        f_cnt: 1,
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Simulated' }),
      })

      const result = await api.simulateTTNUplink('dev-123', payload)

      expect(result).toEqual({ success: true, message: 'Simulated' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ttn/simulate/dev-123'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        })
      )
    })

    it('should fetch TTN settings', async () => {
      const mockSettings = {
        id: 'ttn-123',
        organization_id: 'org-123',
        app_id: 'test-app',
        api_key: 'test-key',
        webhook_url: 'https://example.com/webhook',
        region: 'eu1',
        created_at: Date.now(),
        updated_at: Date.now(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSettings,
      })

      const result = await api.getTTNSettings()

      expect(result).toEqual(mockSettings)
    })

    it('should return null when TTN settings not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Settings not found' }),
      })

      const result = await api.getTTNSettings()

      expect(result).toBeNull()
    })

    it('should save TTN settings', async () => {
      const settings = {
        organization_id: 'org-123',
        app_id: 'test-app',
        api_key: 'test-key',
        webhook_url: 'https://example.com/webhook',
        region: 'eu1',
      }

      const savedSettings = {
        ...settings,
        id: 'ttn-123',
        created_at: Date.now(),
        updated_at: Date.now(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => savedSettings,
      })

      const result = await api.saveTTNSettings(settings)

      expect(result).toEqual(savedSettings)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ttn-settings'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(settings),
        })
      )
    })

    it('should test TTN connection', async () => {
      const config = {
        app_id: 'test-app',
        api_key: 'test-key',
        region: 'eu1',
      }

      const testResult = {
        success: true,
        application: {
          id: 'test-app',
          name: 'Test App',
          description: 'Test',
        },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => testResult,
      })

      const result = await api.testTTNConnection(config)

      expect(result).toEqual(testResult)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ttn-settings/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(config),
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error', message: 'Something went wrong' }),
      })

      await expect(api.getDevices()).rejects.toThrow('Something went wrong')
    })

    it('should handle JSON parse errors in error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      await expect(api.getDevices()).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(api.getDevices()).rejects.toThrow('Network error')
    })
  })

  describe('Health Check', () => {
    it('should check API health', async () => {
      const healthResponse = {
        status: 'ok',
        timestamp: Date.now(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => healthResponse,
      })

      const result = await api.checkAPIHealth()

      expect(result).toEqual(healthResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.any(Object)
      )
    })
  })

  describe('API Client Generic Methods', () => {
    it('should perform GET request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      })

      const result = await api.apiClient.get('/test')

      expect(result).toEqual({ data: 'test' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should perform POST request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'created' }),
      })

      const result = await api.apiClient.post('/test', { value: 'test' })

      expect(result).toEqual({ data: 'created' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ value: 'test' }),
        })
      )
    })

    it('should perform PUT request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'updated' }),
      })

      const result = await api.apiClient.put('/test', { value: 'updated' })

      expect(result).toEqual({ data: 'updated' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ value: 'updated' }),
        })
      )
    })

    it('should perform DELETE request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await api.apiClient.delete('/test')

      expect(result).toEqual({ success: true })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })
})
