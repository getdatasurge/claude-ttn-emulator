/**
 * Database type definitions
 * Auto-generated from Supabase schema
 *
 * To regenerate: run `supabase gen types typescript --local > src/integrations/supabase/types.ts`
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // TODO: Define database schema tables (P0 - Critical)
      // Required tables based on CLAUDE.md architecture:
      // - organizations: Multi-tenant hierarchy with RLS
      // - users: Authentication and user profiles
      // - ttn_settings: TTN configuration (org-level with RLS)
      // - synced_users: User-level TTN settings
      // - devices: Virtual LoRaWAN sensors
      // - telemetry: Time-series sensor data
      // - sites: FrostGuard site entities
      // - units: Refrigeration units
      // - sensors: Physical sensor mappings
      // After creating migrations, regenerate types with:
      // supabase gen types typescript --local > src/integrations/supabase/types.ts
      // Reference: NEXT_STEPS.md section 3, CLAUDE.md "Multi-Tenant Design"
    }
    Views: {
      // TODO: Add database views as needed (P2)
      // Potential views:
      // - active_devices_with_latest_telemetry
      // - organization_device_summary
    }
    Functions: {
      // TODO: Define RPC function signatures (P1)
      // Functions will be created as Supabase edge functions
      // Reference: supabase/functions/README.md
    }
    Enums: {
      // TODO: Add enum types (P1)
      // Potential enums:
      // - device_type: 'temperature' | 'humidity' | 'door'
      // - sensor_status: 'active' | 'inactive' | 'error'
      // - telemetry_type: 'uplink' | 'downlink'
    }
  }
}
