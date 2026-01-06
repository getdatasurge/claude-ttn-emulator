/**
 * useSetupStatus - Centralized hook to detect setup completion status
 * Used by Setup Wizard to determine which steps are needed
 */

import { useMemo } from 'react'
import { useDevices } from './useDevices'
import { useGateways } from './useGateways'
import { useQuery } from '@tanstack/react-query'
import { getTTNSettings } from '@/lib/api'

export type SetupStep =
  | 'create-device'
  | 'activate-device'
  | 'create-gateway'
  | 'configure-ttn'
  | 'test-connection'

export interface SetupStatus {
  // Individual status checks
  hasDevices: boolean
  hasActiveDevices: boolean
  hasTemperatureDevices: boolean
  hasDoorDevices: boolean
  hasGateways: boolean
  hasTTNSettings: boolean

  // Aggregate status
  isFullyConfigured: boolean
  isLoading: boolean

  // Missing steps for each context
  missingForSensors: SetupStep[]
  missingForTesting: SetupStep[]
  missingForMonitor: SetupStep[]
  missingForWebhook: SetupStep[]

  // Counts
  deviceCount: number
  activeDeviceCount: number
  gatewayCount: number
}

export function useSetupStatus(): SetupStatus {
  const { devices, isLoading: devicesLoading } = useDevices()
  const { data: gateways, isLoading: gatewaysLoading } = useGateways()

  const { data: ttnSettings, isLoading: ttnLoading } = useQuery({
    queryKey: ['ttn-settings'],
    queryFn: getTTNSettings,
    staleTime: 60000, // 1 minute
    retry: false,
  })

  return useMemo(() => {
    const deviceList = devices || []
    const gatewayList = gateways || []

    // Device checks
    const hasDevices = deviceList.length > 0
    const activeDevices = deviceList.filter(d => d.status === 'active')
    const hasActiveDevices = activeDevices.length > 0
    const hasTemperatureDevices = deviceList.some(d =>
      d.device_type === 'temperature' || d.device_type === 'humidity'
    )
    const hasDoorDevices = deviceList.some(d => d.device_type === 'door')

    // Gateway checks
    const hasGateways = gatewayList.length > 0

    // TTN checks
    const hasTTNSettings = !!(ttnSettings?.app_id && ttnSettings?.api_key)

    // Calculate missing steps for each tab
    const missingForSensors: SetupStep[] = []
    if (!hasDevices) missingForSensors.push('create-device')

    const missingForTesting: SetupStep[] = []
    if (!hasDevices) missingForTesting.push('create-device')
    else if (!hasActiveDevices) missingForTesting.push('activate-device')

    const missingForMonitor: SetupStep[] = []
    if (!hasDevices) missingForMonitor.push('create-device')

    const missingForWebhook: SetupStep[] = []
    if (!hasTTNSettings) {
      missingForWebhook.push('configure-ttn')
      missingForWebhook.push('test-connection')
    }

    // Aggregate status
    const isFullyConfigured = hasActiveDevices && hasTTNSettings
    const isLoading = devicesLoading || gatewaysLoading || ttnLoading

    return {
      hasDevices,
      hasActiveDevices,
      hasTemperatureDevices,
      hasDoorDevices,
      hasGateways,
      hasTTNSettings,
      isFullyConfigured,
      isLoading,
      missingForSensors,
      missingForTesting,
      missingForMonitor,
      missingForWebhook,
      deviceCount: deviceList.length,
      activeDeviceCount: activeDevices.length,
      gatewayCount: gatewayList.length,
    }
  }, [devices, gateways, ttnSettings, devicesLoading, gatewaysLoading, ttnLoading])
}
