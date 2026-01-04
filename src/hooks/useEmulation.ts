/**
 * useEmulation Hook
 * Manages device emulation - start/stop continuous readings and single readings
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDevices } from './useDevices'
import { simulateTTNUplink } from '@/lib/api'
import { generateRandomReading, type SensorReading } from '@/lib/ttn-payload'
import { parseSimulationParams, type Device } from '@/lib/types'
import { useToast } from './use-toast'

export type EmulatorStatus = 'stopped' | 'running' | 'error'

export interface EmulationLog {
  id: string
  timestamp: Date
  deviceId: string
  deviceName: string
  deviceType: string
  reading: SensorReading
  success: boolean
  message: string
}

interface UseEmulationOptions {
  /** Default interval in ms between readings per device (default: 30000 = 30 seconds) */
  defaultInterval?: number
  /** Maximum logs to keep in memory */
  maxLogs?: number
}

export function useEmulation(options: UseEmulationOptions = {}) {
  const { defaultInterval = 30000, maxLogs = 100 } = options

  const { devices, isLoading: devicesLoading } = useDevices()
  const { toast } = useToast()

  const [status, setStatus] = useState<EmulatorStatus>('stopped')
  const [readingsCount, setReadingsCount] = useState(0)
  const [logs, setLogs] = useState<EmulationLog[]>([])
  const [lastError, setLastError] = useState<string | null>(null)

  // Track intervals for each device
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  // Track frame counter for each device
  const frameCountersRef = useRef<Map<string, number>>(new Map())

  /**
   * Add a log entry
   */
  const addLog = useCallback((log: Omit<EmulationLog, 'id' | 'timestamp'>) => {
    setLogs(prev => {
      const newLog: EmulationLog = {
        ...log,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      }
      const updated = [newLog, ...prev]
      return updated.slice(0, maxLogs)
    })
  }, [maxLogs])

  /**
   * Generate reading based on device type and simulation params
   */
  const generateReading = useCallback((device: Device): SensorReading => {
    const params = parseSimulationParams(device.simulation_params)

    // Generate base reading for device type
    const reading = generateRandomReading(device.device_type, {
      minTemp: params.min_value ?? -5,
      maxTemp: params.max_value ?? 10,
      minHumidity: params.min_value ?? 40,
      maxHumidity: params.max_value ?? 80,
    })

    return reading
  }, [])

  /**
   * Send a single reading for a specific device
   */
  const sendReading = useCallback(async (device: Device): Promise<boolean> => {
    try {
      const reading = generateReading(device)

      // Increment frame counter
      const currentCount = frameCountersRef.current.get(device.id) || 0
      frameCountersRef.current.set(device.id, currentCount + 1)

      // Send to API
      const result = await simulateTTNUplink(device.id, {
        ...reading,
        f_cnt: currentCount + 1,
      })

      setReadingsCount(prev => prev + 1)

      addLog({
        deviceId: device.id,
        deviceName: device.name,
        deviceType: device.device_type,
        reading,
        success: result.success,
        message: result.message || 'Reading sent successfully',
      })

      return result.success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      addLog({
        deviceId: device.id,
        deviceName: device.name,
        deviceType: device.device_type,
        reading: {},
        success: false,
        message: `Error: ${errorMessage}`,
      })

      setLastError(errorMessage)
      return false
    }
  }, [generateReading, addLog])

  /**
   * Send a single reading for all active devices
   */
  const sendSingleReading = useCallback(async () => {
    const activeDevices = devices.filter(d => d.status === 'active')

    if (activeDevices.length === 0) {
      toast({
        title: 'No active devices',
        description: 'Please add and activate devices before sending readings.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Sending readings...',
      description: `Sending to ${activeDevices.length} device(s)`,
    })

    const results = await Promise.all(
      activeDevices.map(device => sendReading(device))
    )

    const successCount = results.filter(Boolean).length
    const failCount = results.length - successCount

    if (failCount > 0) {
      toast({
        title: 'Readings sent',
        description: `${successCount} succeeded, ${failCount} failed`,
        variant: failCount === results.length ? 'destructive' : 'default',
      })
    } else {
      toast({
        title: 'Readings sent',
        description: `Successfully sent ${successCount} reading(s)`,
      })
    }
  }, [devices, sendReading, toast])

  /**
   * Start continuous emulation for all active devices
   */
  const startEmulation = useCallback(() => {
    const activeDevices = devices.filter(d => d.status === 'active')

    if (activeDevices.length === 0) {
      toast({
        title: 'No active devices',
        description: 'Please add and activate devices before starting emulation.',
        variant: 'destructive',
      })
      return
    }

    // Clear any existing intervals
    intervalsRef.current.forEach(interval => clearInterval(interval))
    intervalsRef.current.clear()

    setStatus('running')
    setLastError(null)

    toast({
      title: 'Emulation started',
      description: `Emulating ${activeDevices.length} device(s)`,
    })

    // Start emulation for each active device
    activeDevices.forEach(device => {
      // Get device-specific interval from simulation params, or use default
      const params = parseSimulationParams(device.simulation_params)
      const intervalMs = (params.interval || defaultInterval / 1000) * 1000

      // Send initial reading immediately
      sendReading(device)

      // Set up interval for continuous readings
      const intervalId = setInterval(() => {
        sendReading(device)
      }, intervalMs)

      intervalsRef.current.set(device.id, intervalId)
    })
  }, [devices, defaultInterval, sendReading, toast])

  /**
   * Stop all emulation
   */
  const stopEmulation = useCallback(() => {
    intervalsRef.current.forEach(interval => clearInterval(interval))
    intervalsRef.current.clear()

    setStatus('stopped')

    toast({
      title: 'Emulation stopped',
      description: `Total readings sent: ${readingsCount}`,
    })
  }, [readingsCount, toast])

  /**
   * Reset counters and logs
   */
  const resetEmulation = useCallback(() => {
    setReadingsCount(0)
    setLogs([])
    setLastError(null)
    frameCountersRef.current.clear()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(interval => clearInterval(interval))
      intervalsRef.current.clear()
    }
  }, [])

  // Update emulation when devices change (add/remove active devices)
  useEffect(() => {
    if (status !== 'running') return

    const activeDevices = devices.filter(d => d.status === 'active')
    const runningDeviceIds = new Set(intervalsRef.current.keys())
    const activeDeviceIds = new Set(activeDevices.map(d => d.id))

    // Stop emulation for devices that are no longer active
    runningDeviceIds.forEach(id => {
      if (!activeDeviceIds.has(id)) {
        const interval = intervalsRef.current.get(id)
        if (interval) {
          clearInterval(interval)
          intervalsRef.current.delete(id)
        }
      }
    })

    // Start emulation for newly active devices
    activeDevices.forEach(device => {
      if (!runningDeviceIds.has(device.id)) {
        const params = parseSimulationParams(device.simulation_params)
        const intervalMs = (params.interval || defaultInterval / 1000) * 1000

        sendReading(device)

        const intervalId = setInterval(() => {
          sendReading(device)
        }, intervalMs)

        intervalsRef.current.set(device.id, intervalId)
      }
    })
  }, [devices, status, defaultInterval, sendReading])

  return {
    // State
    status,
    readingsCount,
    logs,
    lastError,
    devicesLoading,
    activeDeviceCount: devices.filter(d => d.status === 'active').length,

    // Actions
    startEmulation,
    stopEmulation,
    sendSingleReading,
    resetEmulation,
  }
}
