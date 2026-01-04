/**
 * Test Utilities
 * Provides helper functions and wrappers for testing
 */

import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { configureStore, PreloadedState } from '@reduxjs/toolkit'
import { BrowserRouter } from 'react-router-dom'

// Import all slices
import authSlice from '@/store/slices/authSlice'
import devicesSlice from '@/store/slices/devicesSlice'
import ttnConfigSlice from '@/store/slices/ttnConfigSlice'
import uiSlice from '@/store/slices/uiSlice'
import websocketMiddleware from '@/store/middleware/websocketMiddleware'
import { persistenceMiddleware } from '@/store/middleware/persistenceMiddleware'
import type { RootState } from '@/store'

// ==========================================
// Store Setup
// ==========================================

export function setupStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: {
      auth: authSlice,
      devices: devicesSlice,
      ttnConfig: ttnConfigSlice,
      ui: uiSlice,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for tests
      }),
    preloadedState,
  })
}

export type AppStore = ReturnType<typeof setupStore>

// ==========================================
// Query Client Setup
// ==========================================

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
        gcTime: 0, // Disable garbage collection
        staleTime: 0, // All data is stale immediately
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
}

// ==========================================
// Render Helpers
// ==========================================

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>
  store?: AppStore
  queryClient?: QueryClient
}

/**
 * Render with all providers (Redux + React Query + Router)
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
      </Provider>
    )
  }

  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

/**
 * Render with Query Client only (for hooks that don't need Redux)
 */
export function renderWithQueryClient(
  ui: ReactElement,
  queryClient = createTestQueryClient()
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper }),
  }
}

// ==========================================
// Mock Data Factories
// ==========================================

export const mockDevice = {
  id: 'dev-123',
  organization_id: 'org-123',
  dev_eui: '0004A30B001A2B3C',
  name: 'Test Device',
  device_type: 'temperature' as const,
  status: 'active' as const,
  simulation_params: JSON.stringify({
    interval: 30,
    min_value: -5,
    max_value: 10,
  }),
  created_at: Math.floor(Date.now() / 1000),
  updated_at: Math.floor(Date.now() / 1000),
}

export const mockTelemetry = {
  id: 'tel-123',
  device_id: 'dev-123',
  timestamp: Math.floor(Date.now() / 1000),
  payload: JSON.stringify({
    temperature: 5.2,
    battery: 3.4,
  }),
  rssi: -60,
  snr: 9.5,
  created_at: Math.floor(Date.now() / 1000),
}

export const mockTTNSettings = {
  id: 'ttn-123',
  organization_id: 'org-123',
  app_id: 'test-app',
  api_key: 'NNSXS.ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
  webhook_url: 'https://example.com/webhook',
  region: 'eu1' as const,
  created_at: Math.floor(Date.now() / 1000),
  updated_at: Math.floor(Date.now() / 1000),
}

export const mockUser = {
  id: 'user-123',
  primaryEmail: 'test@example.com',
  displayName: 'Test User',
  clientMetadata: {
    organizationId: 'org-123',
    role: 'admin',
  },
  toJson: async () => ({
    id: 'user-123',
    primaryEmail: 'test@example.com',
    displayName: 'Test User',
  }),
  getAuthHeaders: async () => ({
    'x-stack-auth': JSON.stringify({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }),
  }),
}

// ==========================================
// Mock API Responses
// ==========================================

export const mockApiResponses = {
  devices: {
    list: [mockDevice],
    single: mockDevice,
    create: mockDevice,
    update: { ...mockDevice, name: 'Updated Device' },
    delete: { success: true },
  },
  telemetry: {
    list: [mockTelemetry],
  },
  ttn: {
    settings: mockTTNSettings,
    simulate: { success: true, message: 'Simulation successful' },
    test: {
      success: true,
      application: {
        id: 'test-app',
        name: 'Test Application',
        description: 'Test TTN Application',
      },
    },
  },
}

// ==========================================
// Wait Utilities
// ==========================================

/**
 * Wait for specific condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 1000
): Promise<void> {
  const startTime = Date.now()

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition')
    }
    await new Promise(resolve => setTimeout(resolve, 50))
  }
}

/**
 * Wait for a specific time
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ==========================================
// Assertion Helpers
// ==========================================

/**
 * Assert that a function was called with specific arguments
 */
export function assertCalledWith(fn: any, ...expectedArgs: any[]) {
  const calls = fn.mock.calls
  const matchingCall = calls.find((call: any[]) => {
    return expectedArgs.every((arg, i) => {
      return JSON.stringify(call[i]) === JSON.stringify(arg)
    })
  })

  if (!matchingCall) {
    throw new Error(
      `Expected function to be called with ${JSON.stringify(expectedArgs)}, ` +
      `but was called with ${JSON.stringify(calls)}`
    )
  }
}

// ==========================================
// Cleanup Helpers
// ==========================================

/**
 * Clear all mocks between tests
 */
export function clearAllMocks() {
  // Clear localStorage and sessionStorage
  localStorage.clear()
  sessionStorage.clear()

  // Clear console mocks
  if (console.warn && typeof console.warn === 'function') {
    (console.warn as any).mockClear?.()
  }
  if (console.error && typeof console.error === 'function') {
    (console.error as any).mockClear?.()
  }
}
