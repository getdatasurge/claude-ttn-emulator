/**
 * Test Utilities
 * Helpers for testing React components with Redux and other providers
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StackProvider, StackTheme } from '@stackframe/react'
import { configureStore } from '@reduxjs/toolkit'
import { vi } from 'vitest'

import authSlice from '@/store/slices/authSlice'
import devicesSlice from '@/store/slices/devicesSlice'
import ttnConfigSlice from '@/store/slices/ttnConfigSlice'
import uiSlice from '@/store/slices/uiSlice'
import type { RootState } from '@/store'

// Mock Stack Auth for testing
const mockStackApp = {
  getUser: vi.fn(),
  useUser: vi.fn(),
  signOut: vi.fn(),
}

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>
  store?: any
  route?: string
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        auth: authSlice,
        devices: devicesSlice,
        ttnConfig: ttnConfigSlice,
        ui: uiSlice,
      },
      preloadedState,
    }),
    route = '/',
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  // Set initial route
  window.history.pushState({}, 'Test page', route)

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  })

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <StackProvider app={mockStackApp as any}>
            <StackTheme>
              <BrowserRouter>
                {children}
              </BrowserRouter>
            </StackTheme>
          </StackProvider>
        </QueryClientProvider>
      </Provider>
    )
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  primaryEmail: 'test@example.com',
  displayName: 'Test User',
  clientMetadata: {
    organizationId: 'test-org-id',
    role: 'admin',
  },
  ...overrides,
})

export const createMockDevice = (overrides = {}) => ({
  id: 'test-device-id',
  organization_id: 'test-org-id',
  dev_eui: 'TEST123456789ABC',
  name: 'Test Device',
  device_type: 'temperature' as const,
  status: 'active' as const,
  simulation_params: '{"interval":60,"min_value":20,"max_value":25}',
  created_at: Math.floor(Date.now() / 1000),
  updated_at: Math.floor(Date.now() / 1000),
  ...overrides,
})

export const createMockTelemetry = (overrides = {}) => ({
  id: 'test-telemetry-id',
  device_id: 'test-device-id',
  timestamp: Math.floor(Date.now() / 1000),
  payload: '{"temperature":22.5,"battery":85}',
  rssi: -80,
  snr: 10,
  created_at: Math.floor(Date.now() / 1000),
  ...overrides,
})

export const createMockTTNSettings = (overrides = {}) => ({
  id: 'test-ttn-settings-id',
  organization_id: 'test-org-id',
  app_id: 'test-application',
  api_key: 'test-api-key',
  webhook_url: 'https://example.com/webhook',
  region: 'eu1',
  created_at: Math.floor(Date.now() / 1000),
  updated_at: Math.floor(Date.now() / 1000),
  ...overrides,
})

// Mock API responses
export const mockApiResponse = <T,>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

export const mockApiError = (message: string, status = 500, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message) as any
      error.status = status
      reject(error)
    }, delay)
  })
}

// Custom matchers
export const customMatchers = {
  toBeInTheDocument: (received: any) => {
    const element = received
    const pass = element && document.contains(element)
    
    return {
      pass,
      message: () => pass
        ? `Expected element not to be in the document`
        : `Expected element to be in the document`,
    }
  },
}

// Setup helpers for different test scenarios
export const setupAuthenticatedUser = (store: any, userOverrides = {}) => {
  const user = createMockUser(userOverrides)
  store.dispatch({
    type: 'auth/initializeAuth/fulfilled',
    payload: {
      user,
      organizationId: user.clientMetadata.organizationId,
      role: user.clientMetadata.role,
    },
  })
  return user
}

export const setupDevices = (store: any, devices: any[] = [createMockDevice()]) => {
  store.dispatch({
    type: 'devices/fetchDevices/fulfilled',
    payload: devices,
  })
  return devices
}

export const setupTTNConfig = (store: any, config = createMockTTNSettings()) => {
  store.dispatch({
    type: 'ttnConfig/loadConfig/fulfilled',
    payload: { serverConfig: config },
  })
  return config
}

// Re-export testing library utilities
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'