/**
 * Database type definitions
 * Generated from Supabase schema
 *
 * To regenerate after schema changes:
 * supabase gen types typescript --local > src/integrations/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DeviceType = 'temperature' | 'humidity' | 'door'
export type SensorStatus = 'active' | 'inactive' | 'error'
export type UserRole = 'admin' | 'manager' | 'viewer'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          organization_id: string
          full_name: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          full_name?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          full_name?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
      }
      ttn_settings: {
        Row: {
          id: string
          organization_id: string
          app_id: string
          api_key: string
          webhook_url: string | null
          region: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          app_id: string
          api_key: string
          webhook_url?: string | null
          region?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          app_id?: string
          api_key?: string
          webhook_url?: string | null
          region?: string
          created_at?: string
          updated_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          organization_id: string
          dev_eui: string
          name: string
          device_type: DeviceType
          status: SensorStatus
          simulation_params: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          dev_eui: string
          name: string
          device_type: DeviceType
          status?: SensorStatus
          simulation_params?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          dev_eui?: string
          name?: string
          device_type?: DeviceType
          status?: SensorStatus
          simulation_params?: Json
          created_at?: string
          updated_at?: string
        }
      }
      telemetry: {
        Row: {
          id: string
          device_id: string
          timestamp: string
          payload: Json
          rssi: number | null
          snr: number | null
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          timestamp?: string
          payload: Json
          rssi?: number | null
          snr?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          timestamp?: string
          payload?: Json
          rssi?: number | null
          snr?: number | null
          created_at?: string
        }
      }
      sites: {
        Row: {
          id: string
          organization_id: string
          name: string
          address: string | null
          frostguard_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          address?: string | null
          frostguard_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          address?: string | null
          frostguard_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          site_id: string
          name: string
          unit_type: string | null
          frostguard_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_id: string
          name: string
          unit_type?: string | null
          frostguard_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          name?: string
          unit_type?: string | null
          frostguard_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sensors: {
        Row: {
          id: string
          unit_id: string
          device_id: string | null
          name: string
          sensor_type: string | null
          frostguard_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          device_id?: string | null
          name: string
          sensor_type?: string | null
          frostguard_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          device_id?: string | null
          name?: string
          sensor_type?: string | null
          frostguard_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      // Views can be added here as needed
    }
    Functions: {
      // Edge function type signatures can be defined here
    }
    Enums: {
      device_type: DeviceType
      sensor_status: SensorStatus
      user_role: UserRole
    }
  }
}

// Helper types for easier use
export type Organization = Database['public']['Tables']['organizations']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type TTNSettings = Database['public']['Tables']['ttn_settings']['Row']
export type Device = Database['public']['Tables']['devices']['Row']
export type Telemetry = Database['public']['Tables']['telemetry']['Row']
export type Site = Database['public']['Tables']['sites']['Row']
export type Unit = Database['public']['Tables']['units']['Row']
export type Sensor = Database['public']['Tables']['sensors']['Row']

// Insert types
export type DeviceInsert = Database['public']['Tables']['devices']['Insert']
export type TelemetryInsert = Database['public']['Tables']['telemetry']['Insert']
export type TTNSettingsInsert = Database['public']['Tables']['ttn_settings']['Insert']

// Update types
export type DeviceUpdate = Database['public']['Tables']['devices']['Update']
export type TTNSettingsUpdate = Database['public']['Tables']['ttn_settings']['Update']
