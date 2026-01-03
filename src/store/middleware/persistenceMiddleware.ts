/**
 * Persistence Middleware
 * Handles localStorage persistence for user preferences and UI state
 */

import { Middleware } from '@reduxjs/toolkit'

interface PersistConfig {
  key: string
  storage: Storage
  whitelist?: string[]
  blacklist?: string[]
  transforms?: Record<string, {
    serialize: (value: any) => any
    deserialize: (value: any) => any
  }>
}

const defaultConfig: PersistConfig = {
  key: 'frostguard-emulator',
  storage: localStorage,
  whitelist: ['ui'], // Only persist UI state by default
  blacklist: ['auth'], // Don't persist sensitive auth data
}

class PersistenceManager {
  private config: PersistConfig
  private persistedState: any = null
  private lastPersistedState: any = null
  private persistTimer: number | null = null

  constructor(config: PersistConfig = defaultConfig) {
    this.config = { ...defaultConfig, ...config }
    this.loadPersistedState()
  }

  private loadPersistedState() {
    try {
      const serialized = this.config.storage.getItem(this.config.key)
      if (serialized) {
        this.persistedState = JSON.parse(serialized)
        console.log('Loaded persisted state:', Object.keys(this.persistedState))
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error)
      this.persistedState = null
    }
  }

  getPersistedState() {
    return this.persistedState
  }

  private shouldPersistSlice(sliceName: string): boolean {
    const { whitelist, blacklist } = this.config
    
    if (blacklist && blacklist.includes(sliceName)) {
      return false
    }
    
    if (whitelist && whitelist.length > 0) {
      return whitelist.includes(sliceName)
    }
    
    return true
  }

  private transformState(state: any): any {
    const transformed: any = {}
    
    for (const [sliceName, sliceState] of Object.entries(state)) {
      if (!this.shouldPersistSlice(sliceName)) {
        continue
      }
      
      let processedState = sliceState
      
      // Apply transforms if configured
      if (this.config.transforms && this.config.transforms[sliceName]) {
        try {
          processedState = this.config.transforms[sliceName].serialize(processedState)
        } catch (error) {
          console.error(`Failed to serialize ${sliceName}:`, error)
          continue
        }
      }
      
      // Filter out sensitive or temporary data
      if (sliceName === 'ui') {
        processedState = this.filterUIState(processedState)
      }
      
      transformed[sliceName] = processedState
    }
    
    return transformed
  }

  private filterUIState(uiState: any): any {
    return {
      ...uiState,
      // Don't persist temporary UI state
      toasts: [],
      modals: [],
      isPageLoading: false,
      globalError: null,
      // Keep preferences and layout
      theme: uiState.theme,
      sidebarCollapsed: uiState.sidebarCollapsed,
      layout: uiState.layout,
      preferences: uiState.preferences,
      features: uiState.features,
    }
  }

  persistState(state: any) {
    // Debounce persistence to avoid too frequent writes
    if (this.persistTimer) {
      clearTimeout(this.persistTimer)
    }
    
    this.persistTimer = window.setTimeout(() => {
      this.performPersistence(state)
    }, 500)
  }

  private performPersistence(state: any) {
    try {
      const stateToSerialize = this.transformState(state)
      
      // Check if state actually changed to avoid unnecessary writes
      if (JSON.stringify(stateToSerialize) === JSON.stringify(this.lastPersistedState)) {
        return
      }
      
      const serialized = JSON.stringify(stateToSerialize)
      this.config.storage.setItem(this.config.key, serialized)
      this.lastPersistedState = stateToSerialize
      
      // Clean up old data periodically
      this.cleanupOldData()
      
    } catch (error) {
      console.error('Failed to persist state:', error)
    }
  }

  private cleanupOldData() {
    // Remove old data that might be taking up space
    const keysToRemove = []
    
    for (let i = 0; i < this.config.storage.length; i++) {
      const key = this.config.storage.key(i)
      if (key && key.startsWith('frostguard-') && key !== this.config.key) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      try {
        this.config.storage.removeItem(key)
      } catch (error) {
        console.warn(`Failed to remove old storage key ${key}:`, error)
      }
    })
  }

  clearPersistedState() {
    try {
      this.config.storage.removeItem(this.config.key)
      this.persistedState = null
      this.lastPersistedState = null
    } catch (error) {
      console.error('Failed to clear persisted state:', error)
    }
  }
}

// Global persistence manager
const persistenceManager = new PersistenceManager()

// Middleware function
export const persistenceMiddleware: Middleware = (store) => {
  // Initialize store with persisted state
  const persistedState = persistenceManager.getPersistedState()
  if (persistedState) {
    // This would typically be done in the store configuration
    // but we can dispatch actions to restore state
    try {
      if (persistedState.ui) {
        store.dispatch({
          type: 'ui/updatePreferences',
          payload: {
            layout: persistedState.ui.layout,
            preferences: persistedState.ui.preferences,
            features: persistedState.ui.features,
          },
        })
        
        if (persistedState.ui.theme) {
          store.dispatch({
            type: 'ui/setTheme',
            payload: persistedState.ui.theme,
          })
        }
        
        if (persistedState.ui.sidebarCollapsed !== undefined) {
          store.dispatch({
            type: 'ui/setSidebarCollapsed',
            payload: persistedState.ui.sidebarCollapsed,
          })
        }
      }
    } catch (error) {
      console.error('Failed to restore persisted state:', error)
    }
  }

  return (next) => (action) => {
    const result = next(action)
    
    // Persist state after each action (with debouncing)
    const currentState = store.getState()
    persistenceManager.persistState(currentState)
    
    // Handle special actions
    if (action.type === 'auth/signOut/fulfilled') {
      // Clear persisted state on logout for security
      persistenceManager.clearPersistedState()
    }
    
    return result
  }
}

// Utility functions for manual persistence control
export const persistenceUtils = {
  clearPersistedState: () => persistenceManager.clearPersistedState(),
  getPersistedState: () => persistenceManager.getPersistedState(),
  
  // Storage quota check
  getStorageInfo: () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate()
    }
    
    // Fallback for browsers without Storage API
    return Promise.resolve({
      quota: undefined,
      usage: undefined,
    })
  },
  
  // Manual state migration for version updates
  migrateState: (migrations: Record<string, (state: any) => any>) => {
    const persistedState = persistenceManager.getPersistedState()
    if (!persistedState) return
    
    let migratedState = { ...persistedState }
    let wasModified = false
    
    for (const [version, migration] of Object.entries(migrations)) {
      try {
        const newState = migration(migratedState)
        if (newState !== migratedState) {
          migratedState = newState
          wasModified = true
        }
      } catch (error) {
        console.error(`Migration ${version} failed:`, error)
      }
    }
    
    if (wasModified) {
      persistenceManager.clearPersistedState()
      persistenceManager.persistState(migratedState)
    }
  },
}