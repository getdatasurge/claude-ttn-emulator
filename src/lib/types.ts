/**
 * Database type definitions for Turso/SQLite
 * Based on the schema in db/schema.sql
 */

export type DeviceType = 'temperature' | 'humidity' | 'door'
export type SensorStatus = 'active' | 'inactive' | 'error'
export type UserRole = 'admin' | 'manager' | 'viewer'

// Core database row types (matching SQLite schema)
export interface Organization {
  id: string
  name: string
  created_at: number
  updated_at: number
}

export interface Profile {
  id: string
  organization_id: string
  full_name: string | null
  role: UserRole
  created_at: number
  updated_at: number
}

export interface TTNSettings {
  id: string
  organization_id: string
  app_id: string
  api_key: string
  webhook_url: string | null
  region: string
  created_at: number
  updated_at: number
}

export interface Device {
  id: string
  organization_id: string
  dev_eui: string
  app_eui?: string // Optional for TTN integration
  application_id?: string // Optional TTN application reference
  name: string
  device_type: DeviceType
  status: SensorStatus
  simulation_params: string // JSON string in SQLite
  created_at: number
  updated_at: number
}

export interface Telemetry {
  id: string
  device_id: string
  timestamp: number
  payload: string // JSON string in SQLite
  rssi: number | null
  snr: number | null
  created_at: number
}

export interface Site {
  id: string
  organization_id: string
  name: string
  address: string | null
  frostguard_id: string | null
  created_at: number
  updated_at: number
}

export interface Unit {
  id: string
  site_id: string
  name: string
  unit_type: string | null
  frostguard_id: string | null
  created_at: number
  updated_at: number
}

export interface Sensor {
  id: string
  unit_id: string
  device_id: string | null
  name: string
  sensor_type: string | null
  frostguard_id: string | null
  created_at: number
  updated_at: number
}

// Insert types (for creating new records)
export type DeviceInsert = Omit<Device, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: number
  updated_at?: number
  app_eui?: string // Explicitly include optional app_eui
  application_id?: string // Explicitly include optional application_id
}

export type TelemetryInsert = Omit<Telemetry, 'id' | 'created_at'> & {
  id?: string
  created_at?: number
}

export type TTNSettingsInsert = Omit<TTNSettings, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: number
  updated_at?: number
}

// Update types (for updating existing records)
export type DeviceUpdate = Partial<Omit<Device, 'id' | 'organization_id' | 'created_at'>>
export type TTNSettingsUpdate = Partial<Omit<TTNSettings, 'id' | 'organization_id' | 'created_at'>>

// Helpers for JSON fields
export interface DeviceSimulationParams {
  interval?: number // seconds between simulated readings
  min_value?: number
  max_value?: number
  unit?: string
}

export interface TelemetryPayload {
  temperature?: number
  humidity?: number
  battery?: number
  door_open?: boolean
  [key: string]: any
}

// Helper functions for JSON parsing
export function parseSimulationParams(json: string): DeviceSimulationParams {
  try {
    return JSON.parse(json)
  } catch {
    return {}
  }
}

export function parseTelemetryPayload(json: string): TelemetryPayload {
  try {
    return JSON.parse(json)
  } catch {
    return {}
  }
}

export function stringifySimulationParams(params: DeviceSimulationParams): string {
  return JSON.stringify(params)
}

export function stringifyTelemetryPayload(payload: TelemetryPayload): string {
  return JSON.stringify(payload)
}

// Timestamp helpers (SQLite uses Unix epoch seconds)
export function toUnixTimestamp(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 1000)
}

export function fromUnixTimestamp(timestamp: number): Date {
  return new Date(timestamp * 1000)
}
