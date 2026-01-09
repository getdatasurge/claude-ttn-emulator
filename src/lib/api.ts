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

// Retry configuration
const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY = 1000 // Start with 1 second
const BACKOFF_MULTIPLIER = 2

// Cache configuration
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 30000 // 30 seconds

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.DEFAULT_TTL,
    })
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }
    
    // Invalidate entries matching the pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

const requestCache = new RequestCache()

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
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: any): boolean {
  if (error instanceof Error) {
    // Network errors
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      return true
    }
    // Timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return true
    }
  }
  
  // HTTP status codes that are retryable
  if (error.status === 429 || error.status === 503 || error.status >= 500) {
    return true
  }
  
  return false
}

/**
 * Generic API request helper with timeout, retry logic, and caching
 */
async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string
    timeout?: number
    maxRetries?: number
    useCache?: boolean
    cacheTTL?: number
  } = {}
): Promise<T> {
  const method = options.method ?? 'GET'
  const url = `${API_BASE_URL}${endpoint}`
  const timeout = options.timeout ?? 10000 // 10 second default timeout
  const maxRetries = options.maxRetries ?? (method === 'GET' ? DEFAULT_MAX_RETRIES : 0)
  const useCache = options.useCache ?? (method === 'GET')
  
  // Check cache for GET requests
  if (useCache && method === 'GET') {
    const cacheKey = `${method}:${endpoint}`
    const cached = requestCache.get<T>(cacheKey)
    if (cached !== null) {
      return cached
    }
  }

  // Get auth headers with a timeout to prevent hanging
  let authHeaders: Record<string, string> = {}
  try {
    const authPromise = getAuthHeaders()
    const timeoutPromise = new Promise<Record<string, string>>((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    )
    authHeaders = await Promise.race([authPromise, timeoutPromise])
  } catch (error) {
    console.warn('Auth headers unavailable, proceeding without auth:', error)
  }

  let lastError: any
  let retryCount = 0
  
  while (retryCount <= maxRetries) {
    // Create abort controller for request timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Unknown error',
          message: response.statusText,
        }))
        
        const error: any = new Error(errorData.message || errorData.error || 'API request failed')
        error.status = response.status
        error.statusText = response.statusText
        
        // Check if we should retry
        if (isRetryableError(error) && retryCount < maxRetries) {
          lastError = error
          retryCount++
          const delay = DEFAULT_RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, retryCount - 1)
          console.warn(`Request failed, retrying in ${delay}ms... (attempt ${retryCount}/${maxRetries})`)
          await sleep(delay)
          continue
        }
        
        throw error
      }

      const data = await response.json()
      
      // Cache successful GET requests
      if (useCache && method === 'GET') {
        const cacheKey = `${method}:${endpoint}`
        requestCache.set(cacheKey, data, options.cacheTTL)
      }
      
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const timeoutError = new Error('Request timeout - API server may be unavailable')
          
          if (retryCount < maxRetries) {
            lastError = timeoutError
            retryCount++
            const delay = DEFAULT_RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, retryCount - 1)
            console.warn(`Request timeout, retrying in ${delay}ms... (attempt ${retryCount}/${maxRetries})`)
            await sleep(delay)
            continue
          }
          
          throw timeoutError
        }
        
        // Network errors (ERR_CONNECTION_REFUSED, etc.) throw TypeError: Failed to fetch
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
          const networkError = new Error('Network error - API server may be offline. Please check your connection.')
          
          if (retryCount < maxRetries) {
            lastError = networkError
            retryCount++
            const delay = DEFAULT_RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, retryCount - 1)
            console.warn(`Network error, retrying in ${delay}ms... (attempt ${retryCount}/${maxRetries})`)
            await sleep(delay)
            continue
          }
          
          throw networkError
        }
      }
      
      throw error
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError || new Error('Request failed after maximum retries')
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
  const result = await apiRequest<Device>('/api/devices', {
    method: 'POST',
    body: JSON.stringify(device),
  })
  // Invalidate devices cache after creating
  requestCache.invalidate('/api/devices')
  return result
}

export async function updateDevice(
  id: string,
  updates: DeviceUpdate
): Promise<Device> {
  const result = await apiRequest<Device>(`/api/devices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  // Invalidate devices cache after updating
  requestCache.invalidate('/api/devices')
  return result
}

export async function deleteDevice(id: string): Promise<{ success: boolean }> {
  const result = await apiRequest<{ success: boolean }>(`/api/devices/${id}`, {
    method: 'DELETE',
  })
  // Invalidate devices cache after deleting
  requestCache.invalidate('/api/devices')
  return result
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
  const result = await apiRequest<TTNSettings>('/api/ttn-settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  })
  // Invalidate TTN settings cache after saving
  requestCache.invalidate('/api/ttn-settings')
  return result
}

export async function updateTTNSettings(
  updates: TTNSettingsUpdate
): Promise<TTNSettings> {
  const result = await apiRequest<TTNSettings>('/api/ttn-settings', {
    method: 'POST',
    body: JSON.stringify(updates),
  })
  // Invalidate TTN settings cache after updating
  requestCache.invalidate('/api/ttn-settings')
  return result
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
