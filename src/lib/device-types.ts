/**
 * Device types and schemas for LoRaWAN device management
 */
import { z } from 'zod'

// Device type enum
export const DEVICE_TYPES = ['temperature', 'humidity', 'door'] as const
export type DeviceType = typeof DEVICE_TYPES[number]

// Device status enum
export const DEVICE_STATUSES = ['active', 'inactive', 'error'] as const
export type DeviceStatus = typeof DEVICE_STATUSES[number]

// Simulation parameters for different device types
export const simulationParamsSchema = z.object({
  // Temperature simulation
  baseTemp: z.number().optional(),
  tempVariance: z.number().optional(),

  // Humidity simulation
  baseHumidity: z.number().optional(),
  humidityVariance: z.number().optional(),

  // Door simulation
  openProbability: z.number().min(0).max(1).optional(),

  // Common parameters
  interval: z.number().min(60).optional(), // Seconds between transmissions
  battery: z.number().min(0).max(100).optional(),
})

export type SimulationParams = z.infer<typeof simulationParamsSchema>

// Default simulation parameters by device type
export const defaultSimulationParams: Record<DeviceType, SimulationParams> = {
  temperature: {
    baseTemp: 4.0, // Refrigerator temp in Celsius
    tempVariance: 2.0,
    interval: 300, // 5 minutes
    battery: 95,
  },
  humidity: {
    baseHumidity: 75.0,
    humidityVariance: 10.0,
    interval: 300,
    battery: 95,
  },
  door: {
    openProbability: 0.1, // 10% chance of being open
    interval: 60, // 1 minute
    battery: 90,
  },
}

// Device database model
export interface Device {
  id: string
  organization_id: string
  dev_eui: string
  app_eui: string
  app_key: string
  name: string
  device_type: DeviceType
  status: DeviceStatus
  simulation_params: string // JSON string
  created_at: number
  updated_at: number
}

// Parsed device with typed simulation params
export interface DeviceWithParams extends Omit<Device, 'simulation_params'> {
  simulation_params: SimulationParams
}

// Device creation schema
export const createDeviceSchema = z.object({
  dev_eui: z
    .string()
    .min(16, 'DevEUI must be 16 hex characters')
    .max(16, 'DevEUI must be 16 hex characters')
    .regex(/^[0-9A-Fa-f]{16}$/, 'DevEUI must be valid hex (0-9, A-F)'),
  app_eui: z
    .string()
    .min(16, 'AppEUI must be 16 hex characters')
    .max(16, 'AppEUI must be 16 hex characters')
    .regex(/^[0-9A-Fa-f]{16}$/, 'AppEUI must be valid hex (0-9, A-F)'),
  app_key: z
    .string()
    .min(32, 'AppKey must be 32 hex characters')
    .max(32, 'AppKey must be 32 hex characters')
    .regex(/^[0-9A-Fa-f]{32}$/, 'AppKey must be valid hex (0-9, A-F)'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  device_type: z.enum(DEVICE_TYPES, {
    errorMap: () => ({ message: 'Invalid device type' }),
  }),
  simulation_params: simulationParamsSchema.optional(),
})

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>

// Device update schema (all fields optional except what's required)
export const updateDeviceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  device_type: z.enum(DEVICE_TYPES).optional(),
  status: z.enum(DEVICE_STATUSES).optional(),
  simulation_params: simulationParamsSchema.optional(),
})

export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>

// Helper functions
export function parseSimulationParams(paramsJson: string): SimulationParams {
  try {
    return JSON.parse(paramsJson || '{}')
  } catch {
    return {}
  }
}

export function deviceWithParams(device: Device): DeviceWithParams {
  return {
    ...device,
    simulation_params: parseSimulationParams(device.simulation_params),
  }
}

export function generateDevEUI(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

export function generateAppEUI(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

export function generateAppKey(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

// Device type labels and descriptions
export const deviceTypeLabels: Record<DeviceType, string> = {
  temperature: 'Temperature Sensor',
  humidity: 'Humidity Sensor',
  door: 'Door Sensor',
}

export const deviceTypeDescriptions: Record<DeviceType, string> = {
  temperature: 'Monitors temperature in refrigeration units',
  humidity: 'Measures relative humidity levels',
  door: 'Detects door open/close events',
}

// Status badges
export const deviceStatusLabels: Record<DeviceStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  error: 'Error',
}

export const deviceStatusColors: Record<DeviceStatus, string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-500',
  error: 'bg-red-500',
}
