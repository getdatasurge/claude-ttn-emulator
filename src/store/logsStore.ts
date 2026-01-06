/**
 * LogsStore - Global store for logs that persists outside React's component tree
 * This ensures logs survive component unmounts and tab switches
 */

type LogLevel = 'info' | 'warning' | 'error' | 'success' | 'debug'

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  source: 'emulator' | 'ttn' | 'webhook' | 'database' | 'system'
  message: string
  details?: string
}

// Storage keys
const LOGS_STORAGE_KEY = 'emulator-logs'
const LOGS_STATE_KEY = 'emulator-logs-state'
const MAX_STORED_LOGS = 500

// Serialization helpers
const serializeLogs = (logs: LogEntry[]): string => {
  return JSON.stringify(logs.map(log => ({
    ...log,
    timestamp: log.timestamp.toISOString(),
  })))
}

const deserializeLogs = (json: string): LogEntry[] => {
  try {
    const parsed = JSON.parse(json)
    return parsed.map((log: { timestamp: string } & Omit<LogEntry, 'timestamp'>) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }))
  } catch {
    return []
  }
}

// Load initial state from localStorage
const loadLogsFromStorage = (): LogEntry[] => {
  try {
    const saved = localStorage.getItem(LOGS_STORAGE_KEY)
    return saved ? deserializeLogs(saved) : []
  } catch {
    return []
  }
}

const loadLoggingStateFromStorage = (): boolean => {
  try {
    const saved = localStorage.getItem(LOGS_STATE_KEY)
    return saved ? JSON.parse(saved) : false
  } catch {
    return false
  }
}

// Global state - lives outside React
let logs: LogEntry[] = loadLogsFromStorage()
let isLogging: boolean = loadLoggingStateFromStorage()
let loggingInterval: ReturnType<typeof setInterval> | null = null

// Subscribers for React components
type Subscriber = () => void
const subscribers = new Set<Subscriber>()

// Notify all subscribers of state change
const notifySubscribers = () => {
  subscribers.forEach(callback => callback())
}

// Persist logs to localStorage
const persistLogs = () => {
  try {
    const logsToStore = logs.slice(-MAX_STORED_LOGS)
    localStorage.setItem(LOGS_STORAGE_KEY, serializeLogs(logsToStore))
  } catch (e) {
    console.warn('Failed to persist logs:', e)
  }
}

// Persist logging state to localStorage
const persistLoggingState = () => {
  try {
    localStorage.setItem(LOGS_STATE_KEY, JSON.stringify(isLogging))
  } catch (e) {
    console.warn('Failed to persist logging state:', e)
  }
}

// Generate a random log entry
const generateLogEntry = (): LogEntry => {
  const messages = [
    { level: 'info', source: 'emulator', message: 'Sending uplink message', details: 'DevEUI: 70B3D57ED0000001, Port: 1, Payload: 0x48656C6C6F' },
    { level: 'success', source: 'ttn', message: 'Uplink accepted by TTN', details: 'Message ID: abc123, Gateway: US Gateway' },
    { level: 'info', source: 'webhook', message: 'Webhook delivered successfully', details: 'Status: 200, Latency: 145ms' },
    { level: 'success', source: 'database', message: 'Telemetry record inserted', details: 'Table: telemetry_readings, ID: 12345' },
    { level: 'warning', source: 'emulator', message: 'Low battery detected on device', details: 'DevEUI: 70B3D57ED0000002, Battery: 15%' },
    { level: 'error', source: 'ttn', message: 'Failed to send downlink', details: 'Error: Device not in receive window' },
    { level: 'debug', source: 'system', message: 'Configuration loaded', details: 'TTN Host: nam1.cloud.thethings.network' },
    { level: 'info', source: 'emulator', message: 'Temperature reading captured', details: 'Value: 38.5°F, Humidity: 62%' },
    { level: 'warning', source: 'webhook', message: 'Webhook retry triggered', details: 'Attempt 2 of 3, Previous error: Timeout' },
    { level: 'success', source: 'ttn', message: 'Join accept received', details: 'DevEUI: 70B3D57ED0000001, DevAddr: 26011234' },
  ]

  const msg = messages[Math.floor(Math.random() * messages.length)]

  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    level: msg.level as LogLevel,
    source: msg.source as LogEntry['source'],
    message: msg.message,
    details: msg.details,
  }
}

// Start the logging interval
const startLoggingInterval = () => {
  if (loggingInterval) return

  loggingInterval = setInterval(() => {
    logs = [...logs, generateLogEntry()].slice(-MAX_STORED_LOGS)
    persistLogs()
    notifySubscribers()
  }, 1000 + Math.random() * 2000)
}

// Stop the logging interval
const stopLoggingInterval = () => {
  if (loggingInterval) {
    clearInterval(loggingInterval)
    loggingInterval = null
  }
}

// Public API
export const logsStore = {
  // Subscribe to state changes
  subscribe: (callback: Subscriber): (() => void) => {
    subscribers.add(callback)
    // On new subscription, verify state matches localStorage (handles edge cases)
    const storedState = loadLoggingStateFromStorage()
    if (storedState !== isLogging) {
      isLogging = storedState
      if (isLogging && !loggingInterval) {
        startLoggingInterval()
      } else if (!isLogging && loggingInterval) {
        stopLoggingInterval()
      }
      // Notify after sync to ensure UI reflects correct state
      setTimeout(() => notifySubscribers(), 0)
    }
    return () => subscribers.delete(callback)
  },

  // Get current state
  getLogs: () => logs,
  getIsLogging: () => isLogging,

  // Actions
  startLogging: () => {
    if (isLogging) return
    isLogging = true
    persistLoggingState()

    // Add "logging enabled" entry
    logs = [...logs, {
      id: 'start-' + Date.now(),
      timestamp: new Date(),
      level: 'info',
      source: 'system',
      message: 'Logging enabled',
      details: 'Live log feed started',
    }]
    persistLogs()

    startLoggingInterval()
    notifySubscribers()
  },

  stopLogging: () => {
    if (!isLogging) return
    isLogging = false
    persistLoggingState()
    stopLoggingInterval()
    notifySubscribers()
  },

  toggleLogging: () => {
    if (isLogging) {
      logsStore.stopLogging()
    } else {
      logsStore.startLogging()
    }
  },

  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    logs = [...logs, {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    }].slice(-MAX_STORED_LOGS)
    persistLogs()
    notifySubscribers()
  },

  addLogs: (entries: Array<Omit<LogEntry, 'id' | 'timestamp'>>) => {
    const newLogs = entries.map(entry => ({
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    }))
    logs = [...logs, ...newLogs].slice(-MAX_STORED_LOGS)
    persistLogs()
    notifySubscribers()
  },

  clearLogs: () => {
    logs = []
    persistLogs()
    notifySubscribers()
  },
}

// Initialize: if logging was enabled when page was closed, restart it
if (isLogging) {
  startLoggingInterval()
}

// Ensure interval is running when it should be (called by hook on mount)
export const ensureLoggingState = () => {
  if (isLogging && !loggingInterval) {
    startLoggingInterval()
  }
}
