/**
 * Redux Store Configuration
 * Production-ready store with middleware and enhanced DevTools
 */

import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

// Slice imports
import authSlice from './slices/authSlice'
import devicesSlice from './slices/devicesSlice'
import ttnConfigSlice from './slices/ttnConfigSlice'
import uiSlice from './slices/uiSlice'
import websocketMiddleware from './middleware/websocketMiddleware'
import { persistenceMiddleware } from './middleware/persistenceMiddleware'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    devices: devicesSlice,
    ttnConfig: ttnConfigSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Redux Toolkit Query actions
          'persist/PERSIST',
          'persist/REHYDRATE',
          // WebSocket actions with non-serializable payloads
          'websocket/messageReceived',
          'websocket/connectionEstablished',
          'websocket/connectionClosed',
        ],
        ignoredPaths: ['websocket.connection', 'auth.user'],
      },
      immutableCheck: {
        // Ignore these action types for performance
        ignoredActions: ['websocket/messageReceived'],
      },
    })
      .concat([
        websocketMiddleware,
        persistenceMiddleware,
      ]),
  devTools: import.meta.env.DEV && {
    maxAge: 50,
    trace: true,
    traceLimit: 25,
    actionSanitizer: (action) => ({
      ...action,
      // Sanitize sensitive data from DevTools
      ...(action.type.includes('auth') && action.payload?.password && {
        payload: { ...action.payload, password: '[REDACTED]' },
      }),
      ...(action.type.includes('api') && action.payload?.api_key && {
        payload: { ...action.payload, api_key: '[REDACTED]' },
      }),
    }),
  },
})

// Enable listener behavior for RTK Query
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Typed hooks for use throughout app
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Store subscription utilities
export const subscribeToStore = (listener: () => void) => {
  return store.subscribe(listener)
}

// Selectors for common state
export const selectIsLoading = (state: RootState) => 
  state.auth.isLoading || state.devices.isLoading || state.ttnConfig.isLoading

export const selectHasErrors = (state: RootState) => 
  !!(state.auth.error || state.devices.error || state.ttnConfig.error)

export const selectAllErrors = (state: RootState) => 
  [state.auth.error, state.devices.error, state.ttnConfig.error].filter(Boolean)

// Store health check
export const isStoreHealthy = () => {
  try {
    const state = store.getState()
    return !selectHasErrors(state)
  } catch (error) {
    console.error('Store health check failed:', error)
    return false
  }
}