/**
 * Cloudflare Workers API Client
 * Replaces Supabase client for all backend communication
 */

/// <reference lib="dom" />

import { stackClientApp } from './stackAuth'
import type {
  Device,
  DeviceInsert,
  DeviceUpdate,
  Telemetry,
  TTNSettings,
  TTNSettingsInsert,
  TTNSettingsUpdate,
} from './types'

// API configuration from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

/**
 * Get auth headers from Stack Auth
 * Uses the native getAuthHeaders() which returns x-stack-auth header
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = await stackClientApp.getUser()
  // Guard against null user or missing getAuthHeaders method
  if (!user || !user.getAuthHeaders) return {}

  try {
    // Use Stack Auth's native getAuthHeaders() method
    // This returns { 'x-stack-auth': '{"accessToken":"...","refreshToken":"..."}' }
    return await user.getAuthHeaders()
  } catch (error) {
    console.error('Failed to get auth headers:', error)
    return {}
  }
}

/**
 * Generic API request helper
 */
async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string
  } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const authHeaders = await getAuthHeaders()

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Unknown error',
      message: response.statusText,
    }))
    throw new Error(error.message || error.error || 'API request failed')
  }

  return response.json()
}

/**
 * Generic API client with common methods
 */
export const apiClient = {
  get: <T>(endpoint: string): Promise<T> => {
    return apiRequest<T>(endpoint, { method: 'GET' })
  },
  post: <T>(endpoint: string, data?: any): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },
  put: <T>(endpoint: string, data?: any): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  },
  delete: <T = { success: boolean }>(endpoint: string): Promise<T> => {
    return apiRequest<T>(endpoint, { method: 'DELETE' })
  },
}

// ==========================================
// DEVICE API
// ==========================================

export async function getDevices(): Promise<Device[]> {
  return apiRequest<Device[]>('/api/devices')
}

export async function createDevice(device: DeviceInsert): Promise<Device> {
  return apiRequest<Device>('/api/devices', {
    method: 'POST',
    body: JSON.stringify(device),
  })
}

export async function updateDevice(
  id: string,
  updates: DeviceUpdate
): Promise<Device> {
  return apiRequest<Device>(`/api/devices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function deleteDevice(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/devices/${id}`, {
    method: 'DELETE',
  })
}

// ==========================================
// TELEMETRY API
// ==========================================

export async function getTelemetry(
  deviceId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<Telemetry[]> {
  const { limit = 100, offset = 0 } = options
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  })

  return apiRequest<Telemetry[]>(
    `/api/devices/${deviceId}/telemetry?${params}`
  )
}

// ==========================================
// TTN SIMULATION API
// ==========================================

export async function simulateTTNUplink(
  deviceId: string,
  payload: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    `/api/ttn/simulate/${deviceId}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

// ==========================================
// TTN SETTINGS API
// ==========================================

export async function getTTNSettings(): Promise<TTNSettings | null> {
  try {
    return await apiRequest<TTNSettings>('/api/ttn-settings')
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return null
    }
    throw error
  }
}

export async function saveTTNSettings(
  settings: TTNSettingsInsert
): Promise<TTNSettings> {
  return apiRequest<TTNSettings>('/api/ttn-settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  })
}

export async function updateTTNSettings(
  updates: TTNSettingsUpdate
): Promise<TTNSettings> {
  return apiRequest<TTNSettings>('/api/ttn-settings', {
    method: 'POST',
    body: JSON.stringify(updates),
  })
}

export async function testTTNConnection(config: {
  app_id: string
  api_key: string
  region: string
}): Promise<{
  success: boolean
  error?: string
  details?: string
  application?: {
    id: string
    name: string
    description: string
  }
}> {
  return apiRequest<{
    success: boolean
    error?: string
    details?: string
    application?: {
      id: string
      name: string
      description: string
    }
  }>('/api/ttn-settings/test', {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

// ==========================================
// HEALTH CHECK
// ==========================================

export async function checkAPIHealth(): Promise<{
  status: string
  timestamp: number
}> {
  return apiRequest<{ status: string; timestamp: number }>('/health')
}
