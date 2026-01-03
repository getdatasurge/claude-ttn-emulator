/**
 * useTTNConfig Hook
 * React hook for TTN configuration state management
 */

import { useState, useEffect } from 'react'
import { ttnConfigStore, type TTNConfigState } from '@/lib/ttnConfigStore'
import type { TTNConfig } from '@/lib/ttn-payload'

/**
 * Hook for accessing and managing TTN configuration
 * Subscribes to the config store and provides CRUD operations
 */
export function useTTNConfig() {
  const [state, setState] = useState<TTNConfigState>(ttnConfigStore.getState())

  useEffect(() => {
    // Subscribe to store updates
    const unsubscribe = ttnConfigStore.subscribe(setState)

    // Load config on mount if not already loaded
    if (!state.config && !state.isLoading) {
      ttnConfigStore.loadConfig()
    }

    return unsubscribe
  }, [])

  return {
    // Config state
    config: state.config,
    isDirty: state.isDirty,
    isLoading: state.isLoading,
    error: state.error,
    lastSyncedAt: state.lastSyncedAt,

    // Config operations
    updateConfig: (updates: Partial<TTNConfig>) => ttnConfigStore.updateLocal(updates),
    saveConfig: () => ttnConfigStore.saveConfig(),
    loadConfig: () => ttnConfigStore.loadConfig(),
    discardChanges: () => ttnConfigStore.discardChanges(),
    clearConfig: () => ttnConfigStore.clearConfig(),

    // Utility methods
    hasUnsavedChanges: () => ttnConfigStore.hasUnsavedChanges(),
    getValidationErrors: () => ttnConfigStore.getValidationErrors(),
  }
}

/**
 * Hook for TTN config validation state
 * Returns validation errors without full config state
 */
export function useTTNConfigValidation() {
  const [validationErrors, setValidationErrors] = useState<string[] | null>(null)

  useEffect(() => {
    const updateValidation = () => {
      setValidationErrors(ttnConfigStore.getValidationErrors())
    }

    const unsubscribe = ttnConfigStore.subscribe(updateValidation)
    updateValidation() // Initial check

    return unsubscribe
  }, [])

  return {
    errors: validationErrors,
    isValid: validationErrors === null || validationErrors.length === 0,
    hasErrors: validationErrors !== null && validationErrors.length > 0,
  }
}

/**
 * Hook for TTN config dirty state only
 * Useful for showing "unsaved changes" warnings
 */
export function useTTNConfigDirty() {
  const [isDirty, setIsDirty] = useState(ttnConfigStore.hasUnsavedChanges())

  useEffect(() => {
    const updateDirty = (state: TTNConfigState) => {
      setIsDirty(state.isDirty)
    }

    const unsubscribe = ttnConfigStore.subscribe(updateDirty)
    return unsubscribe
  }, [])

  return isDirty
}
