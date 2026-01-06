/**
 * useLogs - React hook to access the global logs store
 * Uses useSyncExternalStore for proper React 18 concurrent mode support
 */

import { useSyncExternalStore, useCallback, useEffect } from 'react'
import { logsStore, LogEntry, ensureLoggingState } from '@/store/logsStore'

export type { LogEntry }

export function useLogs() {
  // Subscribe to the store using React 18's useSyncExternalStore
  const logs = useSyncExternalStore(
    logsStore.subscribe,
    logsStore.getLogs,
    logsStore.getLogs // Server snapshot (same as client for this app)
  )

  const isLogging = useSyncExternalStore(
    logsStore.subscribe,
    logsStore.getIsLogging,
    logsStore.getIsLogging
  )

  // Ensure logging interval is running if it should be (fixes tab switch issues)
  useEffect(() => {
    ensureLoggingState()
  }, [])

  const startLogging = useCallback(() => {
    logsStore.startLogging()
  }, [])

  const stopLogging = useCallback(() => {
    logsStore.stopLogging()
  }, [])

  const toggleLogging = useCallback(() => {
    logsStore.toggleLogging()
  }, [])

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    logsStore.addLog(entry)
  }, [])

  const addLogs = useCallback((entries: Array<Omit<LogEntry, 'id' | 'timestamp'>>) => {
    logsStore.addLogs(entries)
  }, [])

  const clearLogs = useCallback(() => {
    logsStore.clearLogs()
  }, [])

  return {
    logs,
    isLogging,
    startLogging,
    stopLogging,
    toggleLogging,
    addLog,
    addLogs,
    clearLogs,
  }
}
