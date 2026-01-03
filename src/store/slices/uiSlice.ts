/**
 * UI State Management
 * Handles global UI state including toasts, modals, loading indicators
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Toast {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface Modal {
  id: string
  type: string
  isOpen: boolean
  data?: any
  onClose?: () => void
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: number
  read: boolean
  actions?: Array<{
    label: string
    onClick: () => void
  }>
}

export interface UIState {
  // Global loading state
  isPageLoading: boolean
  loadingMessage: string | null
  
  // Theme and appearance
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  
  // Toast notifications
  toasts: Toast[]
  
  // Modal system
  modals: Modal[]
  
  // Notifications
  notifications: Notification[]
  unreadNotificationCount: number
  
  // Global error handling
  globalError: {
    error: string
    details?: string
    timestamp: number
  } | null
  
  // Network status
  isOnline: boolean
  lastOnlineCheck: number
  
  // Performance monitoring
  performanceMetrics: {
    pageLoadTime?: number
    renderTime?: number
    bundleSize?: number
    memoryUsage?: number
  }
  
  // Feature flags
  features: {
    realTimeUpdates: boolean
    advancedSimulation: boolean
    bulkOperations: boolean
    exportData: boolean
  }
  
  // Layout preferences
  layout: {
    deviceViewMode: 'grid' | 'list' | 'table'
    telemetryChartType: 'line' | 'area' | 'bar'
    dashboardColumns: number
    compactMode: boolean
  }
  
  // User preferences
  preferences: {
    autoRefresh: boolean
    refreshInterval: number // seconds
    defaultPageSize: number
    showWelcomeMessage: boolean
    enableAnimations: boolean
    enableSounds: boolean
  }
}

const initialState: UIState = {
  isPageLoading: false,
  loadingMessage: null,
  theme: 'system',
  sidebarCollapsed: false,
  toasts: [],
  modals: [],
  notifications: [],
  unreadNotificationCount: 0,
  globalError: null,
  isOnline: navigator.onLine,
  lastOnlineCheck: Date.now(),
  performanceMetrics: {},
  features: {
    realTimeUpdates: true,
    advancedSimulation: true,
    bulkOperations: false,
    exportData: true,
  },
  layout: {
    deviceViewMode: 'grid',
    telemetryChartType: 'line',
    dashboardColumns: 3,
    compactMode: false,
  },
  preferences: {
    autoRefresh: true,
    refreshInterval: 30,
    defaultPageSize: 20,
    showWelcomeMessage: true,
    enableAnimations: true,
    enableSounds: false,
  },
}

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9)

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Loading states
    setPageLoading: (state, action: PayloadAction<{ isLoading: boolean; message?: string }>) => {
      state.isPageLoading = action.payload.isLoading
      state.loadingMessage = action.payload.message || null
    },
    
    // Theme management
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload
    },
    
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload
    },
    
    // Toast management
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        id: generateId(),
        ...action.payload,
      }
      state.toasts.push(toast)
    },
    
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload)
    },
    
    clearAllToasts: (state) => {
      state.toasts = []
    },
    
    // Modal management
    openModal: (state, action: PayloadAction<Omit<Modal, 'id' | 'isOpen'>>) => {
      const modal: Modal = {
        id: generateId(),
        isOpen: true,
        ...action.payload,
      }
      state.modals.push(modal)
    },
    
    closeModal: (state, action: PayloadAction<string>) => {
      const modalIndex = state.modals.findIndex(modal => modal.id === action.payload)
      if (modalIndex !== -1) {
        state.modals[modalIndex].isOpen = false
      }
    },
    
    removeModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(modal => modal.id !== action.payload)
    },
    
    clearAllModals: (state) => {
      state.modals = []
    },
    
    // Notification management
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        id: generateId(),
        timestamp: Date.now(),
        read: false,
        ...action.payload,
      }
      state.notifications.unshift(notification)
      state.unreadNotificationCount += 1
    },
    
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification && !notification.read) {
        notification.read = true
        state.unreadNotificationCount = Math.max(0, state.unreadNotificationCount - 1)
      }
    },
    
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true
      })
      state.unreadNotificationCount = 0
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification && !notification.read) {
        state.unreadNotificationCount = Math.max(0, state.unreadNotificationCount - 1)
      }
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    
    clearOldNotifications: (state) => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      const removedCount = state.notifications.filter(n => n.timestamp < oneDayAgo && !n.read).length
      state.notifications = state.notifications.filter(n => n.timestamp >= oneDayAgo)
      state.unreadNotificationCount = Math.max(0, state.unreadNotificationCount - removedCount)
    },
    
    // Global error handling
    setGlobalError: (state, action: PayloadAction<{ error: string; details?: string }>) => {
      state.globalError = {
        ...action.payload,
        timestamp: Date.now(),
      }
    },
    
    clearGlobalError: (state) => {
      state.globalError = null
    },
    
    // Network status
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload
      state.lastOnlineCheck = Date.now()
    },
    
    // Performance metrics
    setPerformanceMetrics: (state, action: PayloadAction<Partial<UIState['performanceMetrics']>>) => {
      state.performanceMetrics = { ...state.performanceMetrics, ...action.payload }
    },
    
    // Feature flags
    setFeatureFlag: (state, action: PayloadAction<{ feature: keyof UIState['features']; enabled: boolean }>) => {
      state.features[action.payload.feature] = action.payload.enabled
    },
    
    // Layout preferences
    setLayoutPreference: (state, action: PayloadAction<Partial<UIState['layout']>>) => {
      state.layout = { ...state.layout, ...action.payload }
    },
    
    // User preferences
    setUserPreference: (state, action: PayloadAction<Partial<UIState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload }
    },
    
    // Bulk preference updates
    updatePreferences: (state, action: PayloadAction<{
      layout?: Partial<UIState['layout']>
      preferences?: Partial<UIState['preferences']>
      features?: Partial<UIState['features']>
    }>) => {
      if (action.payload.layout) {
        state.layout = { ...state.layout, ...action.payload.layout }
      }
      if (action.payload.preferences) {
        state.preferences = { ...state.preferences, ...action.payload.preferences }
      }
      if (action.payload.features) {
        state.features = { ...state.features, ...action.payload.features }
      }
    },
  },
})

export const {
  setPageLoading,
  setTheme,
  setSidebarCollapsed,
  addToast,
  removeToast,
  clearAllToasts,
  openModal,
  closeModal,
  removeModal,
  clearAllModals,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearOldNotifications,
  setGlobalError,
  clearGlobalError,
  setOnlineStatus,
  setPerformanceMetrics,
  setFeatureFlag,
  setLayoutPreference,
  setUserPreference,
  updatePreferences,
} = uiSlice.actions

// Selectors
export const selectUI = (state: { ui: UIState }) => state.ui
export const selectIsPageLoading = (state: { ui: UIState }) => state.ui.isPageLoading
export const selectLoadingMessage = (state: { ui: UIState }) => state.ui.loadingMessage
export const selectTheme = (state: { ui: UIState }) => state.ui.theme
export const selectSidebarCollapsed = (state: { ui: UIState }) => state.ui.sidebarCollapsed
export const selectToasts = (state: { ui: UIState }) => state.ui.toasts
export const selectModals = (state: { ui: UIState }) => state.ui.modals
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications
export const selectUnreadNotificationCount = (state: { ui: UIState }) => state.ui.unreadNotificationCount
export const selectGlobalError = (state: { ui: UIState }) => state.ui.globalError
export const selectIsOnline = (state: { ui: UIState }) => state.ui.isOnline
export const selectPerformanceMetrics = (state: { ui: UIState }) => state.ui.performanceMetrics
export const selectFeatures = (state: { ui: UIState }) => state.ui.features
export const selectLayout = (state: { ui: UIState }) => state.ui.layout
export const selectPreferences = (state: { ui: UIState }) => state.ui.preferences

// Helper selectors
export const selectOpenModals = (state: { ui: UIState }) => 
  state.ui.modals.filter(modal => modal.isOpen)

export const selectModalByType = (type: string) => (state: { ui: UIState }) =>
  state.ui.modals.find(modal => modal.type === type && modal.isOpen)

export const selectUnreadNotifications = (state: { ui: UIState }) =>
  state.ui.notifications.filter(notification => !notification.read)

export const selectRecentNotifications = (state: { ui: UIState }) => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  return state.ui.notifications.filter(notification => notification.timestamp > oneHourAgo)
}

export const selectIsFeatureEnabled = (feature: keyof UIState['features']) => (state: { ui: UIState }) =>
  state.ui.features[feature]

export const selectShouldAutoRefresh = (state: { ui: UIState }) =>
  state.ui.preferences.autoRefresh && state.ui.isOnline

export default uiSlice.reducer