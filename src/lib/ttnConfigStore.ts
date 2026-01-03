/**
 * TTN Configuration Store
 * Centralized state management for TTN settings with session persistence
 */

import { TTNConfig, validateTTNConfig } from './ttn-payload'
import { getTTNSettings, saveTTNSettings, updateTTNSettings } from './api'

// ==========================================
// State Types
// ==========================================

export interface TTNConfigState {
  config: TTNConfig | null
  isDirty: boolean // Has local unsaved changes
  isLoading: boolean
  error: string | null
  lastSyncedAt: number | null // Unix timestamp of last server sync
}

type Listener = (state: TTNConfigState) => void

// ==========================================
// Session Storage Keys
// ==========================================

const STORAGE_KEYS = {
  CONFIG: 'ttn_config',
  DIRTY: 'ttn_config_dirty',
  LAST_SYNCED: 'ttn_config_last_synced',
} as const

// ==========================================
// TTN Config Store Class
// ==========================================

class TTNConfigStore {
  private state: TTNConfigState
  private listeners: Set<Listener>

  constructor() {
    this.listeners = new Set()
    this.state = this.loadFromSessionStorage()
  }

  /**
   * Load state from session storage
   */
  private loadFromSessionStorage(): TTNConfigState {
    try {
      const configJson = sessionStorage.getItem(STORAGE_KEYS.CONFIG)
      const isDirty = sessionStorage.getItem(STORAGE_KEYS.DIRTY) === 'true'
      const lastSyncedAt = sessionStorage.getItem(STORAGE_KEYS.LAST_SYNCED)

      return {
        config: configJson ? JSON.parse(configJson) : null,
        isDirty,
        isLoading: false,
        error: null,
        lastSyncedAt: lastSyncedAt ? parseInt(lastSyncedAt, 10) : null,
      }
    } catch (error) {
      console.error('Failed to load TTN config from session storage:', error)
      return {
        config: null,
        isDirty: false,
        isLoading: false,
        error: 'Failed to load saved configuration',
        lastSyncedAt: null,
      }
    }
  }

  /**
   * Save state to session storage
   */
  private saveToSessionStorage(): void {
    try {
      if (this.state.config) {
        sessionStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.state.config))
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.CONFIG)
      }

      sessionStorage.setItem(STORAGE_KEYS.DIRTY, this.state.isDirty.toString())

      if (this.state.lastSyncedAt) {
        sessionStorage.setItem(STORAGE_KEYS.LAST_SYNCED, this.state.lastSyncedAt.toString())
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.LAST_SYNCED)
      }
    } catch (error) {
      console.error('Failed to save TTN config to session storage:', error)
    }
  }

  /**
   * Update state and notify listeners
   */
  private setState(updates: Partial<TTNConfigState>): void {
    this.state = { ...this.state, ...updates }
    this.saveToSessionStorage()
    this.notifyListeners()
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('Error in TTN config listener:', error)
      }
    })
  }

  /**
   * Get current state
   */
  getState(): TTNConfigState {
    return { ...this.state }
  }

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Load configuration from API
   * Merges with local config if dirty
   */
  async loadConfig(): Promise<void> {
    if (this.state.isLoading) {
      return // Already loading
    }

    this.setState({ isLoading: true, error: null })

    try {
      const serverConfig = await getTTNSettings()

      if (!serverConfig) {
        // No config on server yet
        this.setState({
          isLoading: false,
          error: null,
        })
        return
      }

      // If we have unsaved local changes, preserve them
      if (this.state.isDirty && this.state.config) {
        console.warn('TTN config loaded from server, but local changes exist')
        // Keep local config but update lastSyncedAt
        this.setState({
          isLoading: false,
          lastSyncedAt: Date.now(),
        })
      } else {
        // No local changes, use server config
        this.setState({
          config: {
            appId: serverConfig.app_id,
            apiKey: serverConfig.api_key,
            webhookUrl: serverConfig.webhook_url || '',
            region: serverConfig.region,
          },
          isDirty: false,
          isLoading: false,
          lastSyncedAt: Date.now(),
        })
      }
    } catch (error) {
      console.error('Failed to load TTN config:', error)
      this.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load configuration',
      })
    }
  }

  /**
   * Update local configuration (doesn't save to server)
   * Marks config as dirty
   */
  updateLocal(updates: Partial<TTNConfig>): void {
    if (!this.state.config) {
      // Create new config from updates
      this.setState({
        config: {
          appId: updates.appId || '',
          apiKey: updates.apiKey || '',
          webhookUrl: updates.webhookUrl || '',
          region: updates.region || 'eu1',
        },
        isDirty: true,
      })
    } else {
      // Merge with existing config
      this.setState({
        config: { ...this.state.config, ...updates },
        isDirty: true,
      })
    }
  }

  /**
   * Save configuration to server
   * Validates before saving
   */
  async saveConfig(): Promise<void> {
    if (!this.state.config) {
      this.setState({ error: 'No configuration to save' })
      return
    }

    // Validate before saving
    const validation = validateTTNConfig(this.state.config)
    if (!validation.valid) {
      this.setState({
        error: validation.errors?.join(', ') || 'Invalid configuration',
      })
      return
    }

    this.setState({ isLoading: true, error: null })

    try {
      // Check if we're creating or updating
      if (this.state.lastSyncedAt) {
        // Update existing config
        await updateTTNSettings({
          app_id: this.state.config.appId,
          api_key: this.state.config.apiKey,
          webhook_url: this.state.config.webhookUrl,
          region: this.state.config.region,
        })
      } else {
        // Create new config
        await saveTTNSettings({
          app_id: this.state.config.appId,
          api_key: this.state.config.apiKey,
          webhook_url: this.state.config.webhookUrl,
          region: this.state.config.region,
          organization_id: '', // Will be set by API from auth context
        })
      }

      this.setState({
        isDirty: false,
        isLoading: false,
        lastSyncedAt: Date.now(),
      })
    } catch (error) {
      console.error('Failed to save TTN config:', error)
      this.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to save configuration',
      })
    }
  }

  /**
   * Discard local changes and reload from server
   */
  async discardChanges(): Promise<void> {
    this.setState({ isDirty: false })
    await this.loadConfig()
  }

  /**
   * Clear all configuration (local and triggers server delete if exists)
   */
  async clearConfig(): Promise<void> {
    this.setState({
      config: null,
      isDirty: false,
      lastSyncedAt: null,
      error: null,
    })

    // Clear from session storage
    sessionStorage.removeItem(STORAGE_KEYS.CONFIG)
    sessionStorage.removeItem(STORAGE_KEYS.DIRTY)
    sessionStorage.removeItem(STORAGE_KEYS.LAST_SYNCED)
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges(): boolean {
    return this.state.isDirty
  }

  /**
   * Get validation errors for current config
   */
  getValidationErrors(): string[] | null {
    if (!this.state.config) {
      return null
    }

    const validation = validateTTNConfig(this.state.config)
    return validation.errors || null
  }
}

// ==========================================
// Singleton Instance
// ==========================================

export const ttnConfigStore = new TTNConfigStore()

// ==========================================
// Export Type for External Use
// ==========================================

export type { Listener as TTNConfigListener }
