/**
 * TTN Configuration State Management
 * Replaces the ttnConfigStore with Redux integration
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getTTNSettings, saveTTNSettings, updateTTNSettings, testTTNConnection } from '@/lib/api'
import { validateTTNConfig, TTNConfig } from '@/lib/ttn-payload'
import type { TTNSettings } from '@/lib/types'

export interface TTNConfigState {
  // Configuration data
  config: TTNConfig | null
  serverConfig: TTNSettings | null
  
  // State flags
  isDirty: boolean
  hasUnsavedChanges: boolean
  isLoading: boolean
  isSaving: boolean
  isTesting: boolean
  
  // Error states
  error: string | null
  validationErrors: string[]
  testError: string | null
  
  // Sync state
  lastSyncedAt: number | null
  lastTestedAt: number | null
  
  // Test results
  testResult: {
    success: boolean
    applicationInfo?: {
      id: string
      name: string
      description: string
    }
  } | null
  
  // Connection status
  isConnected: boolean
  connectionCheckedAt: number | null
}

const initialState: TTNConfigState = {
  config: null,
  serverConfig: null,
  isDirty: false,
  hasUnsavedChanges: false,
  isLoading: false,
  isSaving: false,
  isTesting: false,
  error: null,
  validationErrors: [],
  testError: null,
  lastSyncedAt: null,
  lastTestedAt: null,
  testResult: null,
  isConnected: false,
  connectionCheckedAt: null,
}

// Helper function to load from session storage
const loadFromSessionStorage = (): Partial<TTNConfigState> => {
  try {
    const configJson = sessionStorage.getItem('ttn_config')
    const isDirty = sessionStorage.getItem('ttn_config_dirty') === 'true'
    const lastSyncedAt = sessionStorage.getItem('ttn_config_last_synced')

    return {
      config: configJson ? JSON.parse(configJson) : null,
      isDirty,
      lastSyncedAt: lastSyncedAt ? parseInt(lastSyncedAt, 10) : null,
    }
  } catch (error) {
    console.error('Failed to load TTN config from session storage:', error)
    return {}
  }
}

// Helper function to save to session storage
const saveToSessionStorage = (state: TTNConfigState) => {
  try {
    if (state.config) {
      sessionStorage.setItem('ttn_config', JSON.stringify(state.config))
    } else {
      sessionStorage.removeItem('ttn_config')
    }

    sessionStorage.setItem('ttn_config_dirty', state.isDirty.toString())

    if (state.lastSyncedAt) {
      sessionStorage.setItem('ttn_config_last_synced', state.lastSyncedAt.toString())
    } else {
      sessionStorage.removeItem('ttn_config_last_synced')
    }
  } catch (error) {
    console.error('Failed to save TTN config to session storage:', error)
  }
}

// Async thunks
export const loadTTNConfig = createAsyncThunk(
  'ttnConfig/loadConfig',
  async (_, { getState, rejectWithValue }) => {
    try {
      const serverConfig = await getTTNSettings()
      return { serverConfig }
    } catch (error) {
      console.error('Load TTN config failed:', error)
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load configuration')
    }
  }
)

export const saveTTNConfig = createAsyncThunk(
  'ttnConfig/saveConfig',
  async (_, { getState, rejectWithValue }) => {
    const state = (getState() as { ttnConfig: TTNConfigState }).ttnConfig
    
    if (!state.config) {
      return rejectWithValue('No configuration to save')
    }

    // Validate before saving
    const validation = validateTTNConfig(state.config)
    if (!validation.valid) {
      return rejectWithValue(validation.errors?.join(', ') || 'Invalid configuration')
    }

    try {
      let savedConfig: TTNSettings

      if (state.lastSyncedAt && state.serverConfig) {
        // Update existing config
        savedConfig = await updateTTNSettings({
          app_id: state.config.appId,
          api_key: state.config.apiKey,
          webhook_url: state.config.webhookUrl,
          region: state.config.region,
        })
      } else {
        // Create new config
        savedConfig = await saveTTNSettings({
          app_id: state.config.appId,
          api_key: state.config.apiKey,
          webhook_url: state.config.webhookUrl,
          region: state.config.region,
          organization_id: '', // Will be set by API from auth context
        })
      }

      return { savedConfig }
    } catch (error) {
      console.error('Save TTN config failed:', error)
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save configuration')
    }
  }
)

export const testTTNConfig = createAsyncThunk(
  'ttnConfig/testConfig',
  async (config?: TTNConfig, { getState, rejectWithValue }) => {
    const state = (getState() as { ttnConfig: TTNConfigState }).ttnConfig
    const testConfig = config || state.config
    
    if (!testConfig) {
      return rejectWithValue('No configuration to test')
    }

    // Validate before testing
    const validation = validateTTNConfig(testConfig)
    if (!validation.valid) {
      return rejectWithValue(validation.errors?.join(', ') || 'Invalid configuration')
    }

    try {
      const result = await testTTNConnection({
        app_id: testConfig.appId,
        api_key: testConfig.apiKey,
        region: testConfig.region,
      })

      return { result, testedAt: Date.now() }
    } catch (error) {
      console.error('Test TTN config failed:', error)
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to test configuration')
    }
  }
)

const ttnConfigSlice = createSlice({
  name: 'ttnConfig',
  initialState: {
    ...initialState,
    ...loadFromSessionStorage(),
  },
  reducers: {
    // Local config updates
    updateConfig: (state, action: PayloadAction<Partial<TTNConfig>>) => {
      if (!state.config) {
        state.config = {
          appId: action.payload.appId || '',
          apiKey: action.payload.apiKey || '',
          webhookUrl: action.payload.webhookUrl || '',
          region: action.payload.region || 'eu1',
        }
      } else {
        state.config = { ...state.config, ...action.payload }
      }
      
      state.isDirty = true
      state.hasUnsavedChanges = true
      
      // Clear previous validation errors
      state.validationErrors = []
      
      // Validate the updated config
      const validation = validateTTNConfig(state.config)
      if (!validation.valid) {
        state.validationErrors = validation.errors || []
      }
      
      // Clear test results when config changes
      state.testResult = null
      state.lastTestedAt = null
      state.testError = null
      
      saveToSessionStorage(state)
    },
    
    // Reset to server config
    resetToServer: (state) => {
      if (state.serverConfig) {
        state.config = {
          appId: state.serverConfig.app_id,
          apiKey: state.serverConfig.api_key,
          webhookUrl: state.serverConfig.webhook_url || '',
          region: state.serverConfig.region,
        }
      } else {
        state.config = null
      }
      
      state.isDirty = false
      state.hasUnsavedChanges = false
      state.validationErrors = []
      state.error = null
      
      saveToSessionStorage(state)
    },
    
    // Clear all config
    clearConfig: (state) => {
      state.config = null
      state.serverConfig = null
      state.isDirty = false
      state.hasUnsavedChanges = false
      state.lastSyncedAt = null
      state.validationErrors = []
      state.error = null
      state.testResult = null
      state.lastTestedAt = null
      state.testError = null
      
      // Clear session storage
      sessionStorage.removeItem('ttn_config')
      sessionStorage.removeItem('ttn_config_dirty')
      sessionStorage.removeItem('ttn_config_last_synced')
    },
    
    // Error management
    clearError: (state) => {
      state.error = null
      state.testError = null
    },
    
    clearValidationErrors: (state) => {
      state.validationErrors = []
    },
    
    // Connection status
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload
      state.connectionCheckedAt = Date.now()
    },
  },
  extraReducers: (builder) => {
    builder
      // Load Config
      .addCase(loadTTNConfig.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loadTTNConfig.fulfilled, (state, action) => {
        state.isLoading = false
        state.serverConfig = action.payload.serverConfig
        
        // If we have unsaved local changes, preserve them
        if (!state.isDirty || !state.config) {
          if (action.payload.serverConfig) {
            state.config = {
              appId: action.payload.serverConfig.app_id,
              apiKey: action.payload.serverConfig.api_key,
              webhookUrl: action.payload.serverConfig.webhook_url || '',
              region: action.payload.serverConfig.region,
            }
          }
          state.isDirty = false
          state.hasUnsavedChanges = false
        }
        
        state.lastSyncedAt = Date.now()
        saveToSessionStorage(state)
      })
      .addCase(loadTTNConfig.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Save Config
      .addCase(saveTTNConfig.pending, (state) => {
        state.isSaving = true
        state.error = null
      })
      .addCase(saveTTNConfig.fulfilled, (state, action) => {
        state.isSaving = false
        state.serverConfig = action.payload.savedConfig
        state.isDirty = false
        state.hasUnsavedChanges = false
        state.lastSyncedAt = Date.now()
        saveToSessionStorage(state)
      })
      .addCase(saveTTNConfig.rejected, (state, action) => {
        state.isSaving = false
        state.error = action.payload as string
      })
      
      // Test Config
      .addCase(testTTNConfig.pending, (state) => {
        state.isTesting = true
        state.testError = null
        state.testResult = null
      })
      .addCase(testTTNConfig.fulfilled, (state, action) => {
        state.isTesting = false
        state.testResult = action.payload.result
        state.lastTestedAt = action.payload.testedAt
        state.isConnected = action.payload.result.success
        state.connectionCheckedAt = action.payload.testedAt
      })
      .addCase(testTTNConfig.rejected, (state, action) => {
        state.isTesting = false
        state.testError = action.payload as string
        state.isConnected = false
        state.connectionCheckedAt = Date.now()
      })
  },
})

export const {
  updateConfig,
  resetToServer,
  clearConfig,
  clearError,
  clearValidationErrors,
  setConnectionStatus,
} = ttnConfigSlice.actions

// Selectors
export const selectTTNConfig = (state: { ttnConfig: TTNConfigState }) => state.ttnConfig
export const selectConfig = (state: { ttnConfig: TTNConfigState }) => state.ttnConfig.config
export const selectServerConfig = (state: { ttnConfig: TTNConfigState }) => state.ttnConfig.serverConfig
export const selectIsDirty = (state: { ttnConfig: TTNConfigState }) => state.ttnConfig.isDirty
export const selectHasUnsavedChanges = (state: { ttnConfig: TTNConfigState }) => state.ttnConfig.hasUnsavedChanges
export const selectIsLoading = (state: { ttnConfig: TTNConfigState }) => state.ttnConfig.isLoading
export const selectIsSaving = (state: { ttnConfig: TTNConfigState }) => state.ttnConfig.isSaving
export const selectIsTesting = (state: { ttnConfig: TTNConfigState }) => state.ttnConfig.isTesting
export const selectConfigError = (state: { ttnConfig: TTNConfigState }) => state.ttnConfig.error
export const selectValidationErrors = (state: { ttnConfig: TTNConfigState }) => state.ttnConfig.validationErrors
export const selectTestResult = (state: { ttnConfig: TTNConfigState }) => state.ttnConfig.testResult
export const selectIsConnected = (state: { ttnConfig: TTNConfigState }) => state.ttnConfig.isConnected

// Helper selectors
export const selectIsConfigValid = (state: { ttnConfig: TTNConfigState }) => {
  const config = state.ttnConfig.config
  if (!config) return false
  
  const validation = validateTTNConfig(config)
  return validation.valid
}

export const selectCanSave = (state: { ttnConfig: TTNConfigState }) => {
  return state.ttnConfig.hasUnsavedChanges && 
         state.ttnConfig.validationErrors.length === 0 &&
         !state.ttnConfig.isSaving
}

export const selectCanTest = (state: { ttnConfig: TTNConfigState }) => {
  return state.ttnConfig.config !== null &&
         state.ttnConfig.validationErrors.length === 0 &&
         !state.ttnConfig.isTesting
}

export const selectLastSyncStatus = (state: { ttnConfig: TTNConfigState }) => {
  const { lastSyncedAt, isDirty } = state.ttnConfig
  
  if (!lastSyncedAt) return 'never-synced'
  if (isDirty) return 'has-changes'
  return 'synced'
}

export const selectConnectionInfo = (state: { ttnConfig: TTNConfigState }) => ({
  isConnected: state.ttnConfig.isConnected,
  lastChecked: state.ttnConfig.connectionCheckedAt,
  testResult: state.ttnConfig.testResult,
})

export default ttnConfigSlice.reducer