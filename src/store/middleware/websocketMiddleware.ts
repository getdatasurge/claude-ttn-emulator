/**
 * WebSocket Middleware
 * Manages real-time connections for device telemetry and system updates
 */

import { Middleware } from '@reduxjs/toolkit'
import { addTelemetryData, updateDeviceStatus } from '../slices/devicesSlice'
import { addNotification } from '../slices/uiSlice'
import { updateUser } from '../slices/authSlice'

interface WebSocketMessage {
  type: string
  payload: any
  timestamp: number
}

interface DeviceTelemetryMessage extends WebSocketMessage {
  type: 'device_telemetry'
  payload: {
    device_id: string
    telemetry: {
      id: string
      device_id: string
      timestamp: number
      payload: string
      rssi?: number
      snr?: number
      created_at: number
    }
  }
}

interface DeviceStatusMessage extends WebSocketMessage {
  type: 'device_status'
  payload: {
    device_id: string
    status: 'active' | 'inactive' | 'error'
  }
}

interface SystemNotificationMessage extends WebSocketMessage {
  type: 'system_notification'
  payload: {
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
  }
}

interface UserUpdateMessage extends WebSocketMessage {
  type: 'user_update'
  payload: {
    user: any
    organizationId?: string
    role?: string
  }
}

class WebSocketManager {
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private heartbeatInterval: number | null = null
  private store: any = null
  private shouldReconnect = true

  setStore(store: any) {
    this.store = store
  }

  connect(url: string, token: string) {
    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true
    
    try {
      const wsUrl = `${url}?token=${encodeURIComponent(token)}`
      this.socket = new WebSocket(wsUrl)

      this.socket.onopen = this.handleOpen.bind(this)
      this.socket.onmessage = this.handleMessage.bind(this)
      this.socket.onclose = this.handleClose.bind(this)
      this.socket.onerror = this.handleError.bind(this)

    } catch (error) {
      console.error('WebSocket connection failed:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  private handleOpen(event: Event) {
    console.log('WebSocket connected')
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.startHeartbeat()

    if (this.store) {
      this.store.dispatch(addNotification({
        title: 'Connected',
        message: 'Real-time updates enabled',
        type: 'success',
      }))
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      this.processMessage(message)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private handleClose(event: CloseEvent) {
    console.log('WebSocket disconnected:', event.code, event.reason)
    this.isConnecting = false
    this.stopHeartbeat()

    if (this.store && event.code !== 1000) { // Not a normal closure
      this.store.dispatch(addNotification({
        title: 'Connection Lost',
        message: 'Attempting to reconnect...',
        type: 'warning',
      }))
    }

    if (this.shouldReconnect && event.code !== 1000) {
      this.scheduleReconnect()
    }
  }

  private handleError(event: Event) {
    console.error('WebSocket error:', event)
    this.isConnecting = false
    
    if (this.store) {
      this.store.dispatch(addNotification({
        title: 'Connection Error',
        message: 'Failed to establish real-time connection',
        type: 'error',
      }))
    }
  }

  private processMessage(message: WebSocketMessage) {
    if (!this.store) return

    switch (message.type) {
      case 'device_telemetry':
        this.handleDeviceTelemetry(message as DeviceTelemetryMessage)
        break

      case 'device_status':
        this.handleDeviceStatus(message as DeviceStatusMessage)
        break

      case 'system_notification':
        this.handleSystemNotification(message as SystemNotificationMessage)
        break

      case 'user_update':
        this.handleUserUpdate(message as UserUpdateMessage)
        break

      case 'heartbeat':
        // Echo back heartbeat
        this.send({ type: 'heartbeat_response', payload: {}, timestamp: Date.now() })
        break

      default:
        console.warn('Unknown WebSocket message type:', message.type)
    }
  }

  private handleDeviceTelemetry(message: DeviceTelemetryMessage) {
    this.store.dispatch(addTelemetryData({
      deviceId: message.payload.device_id,
      telemetry: message.payload.telemetry,
    }))
  }

  private handleDeviceStatus(message: DeviceStatusMessage) {
    this.store.dispatch(updateDeviceStatus({
      deviceId: message.payload.device_id,
      status: message.payload.status,
    }))
  }

  private handleSystemNotification(message: SystemNotificationMessage) {
    this.store.dispatch(addNotification({
      title: message.payload.title,
      message: message.payload.message,
      type: message.payload.type,
    }))
  }

  private handleUserUpdate(message: UserUpdateMessage) {
    this.store.dispatch(updateUser({
      user: message.payload.user,
      organizationId: message.payload.organizationId,
      role: message.payload.role,
    }))
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          payload: {},
          timestamp: Date.now(),
        })
      }
    }, 30000) // Send heartbeat every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      if (this.store) {
        this.store.dispatch(addNotification({
          title: 'Connection Failed',
          message: 'Unable to establish real-time connection after multiple attempts',
          type: 'error',
        }))
      }
      return
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)

    setTimeout(() => {
      if (this.shouldReconnect) {
        // Get current auth state to reconnect
        if (this.store) {
          const state = this.store.getState()
          if (state.auth.isAuthenticated && state.auth.user) {
            // Extract token from user auth data
            // This would need to be adapted based on Stack Auth implementation
            this.connect(this.getWebSocketUrl(), this.getAuthToken(state.auth.user))
          }
        }
      }
    }, delay)
  }

  private getWebSocketUrl(): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'
    return baseUrl.replace('http', 'ws') + '/ws'
  }

  private getAuthToken(user: any): string {
    // This would need to be implemented based on how Stack Auth provides tokens
    // for WebSocket connections
    return user.accessToken || ''
  }

  send(message: WebSocketMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    }
  }

  disconnect() {
    this.shouldReconnect = false
    this.stopHeartbeat()
    
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect')
      this.socket = null
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  getConnectionState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.socket) return 'closed'
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'connecting'
      case WebSocket.OPEN: return 'open'
      case WebSocket.CLOSING: return 'closing'
      case WebSocket.CLOSED: return 'closed'
      default: return 'closed'
    }
  }
}

// Global WebSocket manager instance
const wsManager = new WebSocketManager()

// WebSocket middleware
const websocketMiddleware: Middleware = (store) => {
  wsManager.setStore(store)

  // Listen for auth state changes to manage connection
  let isAuthenticated = false
  
  return (next) => (action) => {
    const result = next(action)
    const state = store.getState()

    // Handle authentication changes
    if (action.type?.startsWith('auth/')) {
      const newAuthState = state.auth.isAuthenticated
      
      if (newAuthState !== isAuthenticated) {
        isAuthenticated = newAuthState
        
        if (isAuthenticated && state.auth.user) {
          // Connect WebSocket when user authenticates
          const token = wsManager.getAuthToken(state.auth.user)
          wsManager.connect(wsManager.getWebSocketUrl(), token)
        } else {
          // Disconnect WebSocket when user logs out
          wsManager.disconnect()
        }
      }
    }

    // Handle manual WebSocket actions
    if (action.type === 'websocket/connect' && state.auth.isAuthenticated) {
      const token = wsManager.getAuthToken(state.auth.user)
      wsManager.connect(wsManager.getWebSocketUrl(), token)
    }

    if (action.type === 'websocket/disconnect') {
      wsManager.disconnect()
    }

    if (action.type === 'websocket/send') {
      wsManager.send(action.payload)
    }

    return result
  }
}

// Action creators for manual WebSocket control
export const websocketActions = {
  connect: () => ({ type: 'websocket/connect' }),
  disconnect: () => ({ type: 'websocket/disconnect' }),
  send: (message: WebSocketMessage) => ({ type: 'websocket/send', payload: message }),
}

// WebSocket status selector
export const selectWebSocketStatus = () => ({
  isConnected: wsManager.isConnected(),
  connectionState: wsManager.getConnectionState(),
})

export default websocketMiddleware