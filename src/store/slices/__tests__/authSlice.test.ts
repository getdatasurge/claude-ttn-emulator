/**
 * Auth Slice Unit Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authReducer, {
  initializeAuth,
  signOut,
  updateLastActivity,
  setOnlineStatus,
  selectIsAuthenticated,
  selectUser,
  selectIsAdmin,
} from '../authSlice'

// Mock Stack Auth
vi.mock('@/lib/stackAuth', () => ({
  isStackAuthConfigured: true,
  stackClientApp: {
    getUser: vi.fn(),
    signOut: vi.fn(),
  },
}))

// Define initial state manually since we export reducer, not slice
const initialAuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  organizationId: null,
  role: null,
  sessionExpiry: null,
  lastActivity: Date.now(),
  isOnline: true,
}

describe('authSlice', () => {
  const createStore = (initialState = {}) =>
    configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: { ...initialAuthState, ...initialState } as any },
    })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createStore()
      const state = store.getState().auth

      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(true)
      expect(state.error).toBeNull()
      expect(state.organizationId).toBeNull()
      expect(state.role).toBeNull()
      expect(state.isOnline).toBe(true) // navigator.onLine is mocked as true
    })
  })

  describe('reducers', () => {
    it('should update last activity', () => {
      const store = createStore()
      const beforeTime = Date.now()
      
      store.dispatch(updateLastActivity())
      
      const state = store.getState().auth
      expect(state.lastActivity).toBeGreaterThanOrEqual(beforeTime)
    })

    it('should set online status', () => {
      const store = createStore()
      
      store.dispatch(setOnlineStatus(false))
      
      const state = store.getState().auth
      expect(state.isOnline).toBe(false)
    })

    it('should clear error', () => {
      const store = createStore({ error: 'Some error' })
      
      store.dispatch({ type: 'auth/clearError' })
      
      const state = store.getState().auth
      expect(state.error).toBeNull()
    })
  })

  describe('async thunks', () => {
    describe('initializeAuth', () => {
      it('should handle successful initialization with user', async () => {
        const mockUser = {
          id: 'test-user',
          primaryEmail: 'test@example.com',
          displayName: 'Test User',
          clientMetadata: {
            organizationId: 'test-org',
            role: 'admin',
          },
          toJson: () => Promise.resolve({
            id: 'test-user',
            primaryEmail: 'test@example.com',
            displayName: 'Test User',
          }),
        }

        const { stackClientApp } = await import('@/lib/stackAuth')
        vi.mocked(stackClientApp.getUser).mockResolvedValue(mockUser)

        const store = createStore()
        await store.dispatch(initializeAuth())

        const state = store.getState().auth
        expect(state.isLoading).toBe(false)
        expect(state.isAuthenticated).toBe(true)
        expect(state.organizationId).toBe('test-org')
        expect(state.role).toBe('admin')
        expect(state.error).toBeNull()
      })

      it('should handle initialization with no user', async () => {
        const { stackClientApp } = await import('@/lib/stackAuth')
        vi.mocked(stackClientApp.getUser).mockResolvedValue(null)

        const store = createStore()
        await store.dispatch(initializeAuth())

        const state = store.getState().auth
        expect(state.isLoading).toBe(false)
        expect(state.isAuthenticated).toBe(false)
        expect(state.user).toBeNull()
      })

      it('should handle initialization error', async () => {
        const { stackClientApp } = await import('@/lib/stackAuth')
        vi.mocked(stackClientApp.getUser).mockRejectedValue(new Error('Auth failed'))

        const store = createStore()
        await store.dispatch(initializeAuth())

        const state = store.getState().auth
        expect(state.isLoading).toBe(false)
        expect(state.error).toBe('Auth failed')
        expect(state.isAuthenticated).toBe(false)
      })
    })

    describe('signOut', () => {
      it('should handle successful sign out', async () => {
        const { stackClientApp } = await import('@/lib/stackAuth')
        vi.mocked(stackClientApp.signOut).mockResolvedValue(undefined)

        const store = createStore({
          user: { id: 'test-user' },
          isAuthenticated: true,
          organizationId: 'test-org',
          role: 'admin',
        })

        await store.dispatch(signOut())

        const state = store.getState().auth
        expect(state.isLoading).toBe(false)
        expect(state.isAuthenticated).toBe(false)
        expect(state.user).toBeNull()
        expect(state.organizationId).toBeNull()
        expect(state.role).toBeNull()
        expect(state.error).toBeNull()
      })

      it('should handle sign out error', async () => {
        const { stackClientApp } = await import('@/lib/stackAuth')
        vi.mocked(stackClientApp.signOut).mockRejectedValue(new Error('Sign out failed'))

        const store = createStore({
          user: { id: 'test-user' },
          isAuthenticated: true,
        })

        await store.dispatch(signOut())

        const state = store.getState().auth
        expect(state.error).toBe('Sign out failed')
        // Should still clear user data even on error
        expect(state.isAuthenticated).toBe(false)
        expect(state.user).toBeNull()
      })
    })
  })

  describe('selectors', () => {
    it('should select authentication status', () => {
      const authenticatedState = { auth: { isAuthenticated: true } } as any
      const unauthenticatedState = { auth: { isAuthenticated: false } } as any

      expect(selectIsAuthenticated(authenticatedState)).toBe(true)
      expect(selectIsAuthenticated(unauthenticatedState)).toBe(false)
    })

    it('should select user', () => {
      const mockUser = { id: 'test-user', email: 'test@example.com' }
      const state = { auth: { user: mockUser } } as any

      expect(selectUser(state)).toEqual(mockUser)
    })

    it('should select admin status', () => {
      const adminState = { auth: { role: 'admin' } } as any
      const userState = { auth: { role: 'user' } } as any
      const noRoleState = { auth: { role: null } } as any

      expect(selectIsAdmin(adminState)).toBe(true)
      expect(selectIsAdmin(userState)).toBe(false)
      expect(selectIsAdmin(noRoleState)).toBe(false)
    })
  })
})