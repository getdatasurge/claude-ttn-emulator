-- FrostGuard LoRaWAN Emulator - Initial Schema
-- Migration: 20260102000001
-- Description: Create core tables with Row-Level Security for multi-tenant architecture

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- Device type enum
CREATE TYPE device_type AS ENUM (
  'temperature',
  'humidity',
  'door'
);

-- Sensor status enum
CREATE TYPE sensor_status AS ENUM (
  'active',
  'inactive',
  'error'
);

-- User role enum
CREATE TYPE user_role AS ENUM (
  'admin',
  'manager',
  'viewer'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TTN Settings table
CREATE TABLE ttn_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  api_key TEXT NOT NULL, -- Will be encrypted at application level
  webhook_url TEXT,
  region TEXT DEFAULT 'eu1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id) -- One TTN config per organization
);

-- Devices table
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dev_eui TEXT NOT NULL,
  name TEXT NOT NULL,
  device_type device_type NOT NULL,
  status sensor_status NOT NULL DEFAULT 'active',
  simulation_params JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, dev_eui)
);

-- Telemetry table (time-series data)
CREATE TABLE telemetry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL,
  rssi INTEGER,
  snr FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sites table (FrostGuard integration)
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  frostguard_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Units table (refrigeration units)
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_type TEXT,
  frostguard_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sensors table (physical sensor mappings)
CREATE TABLE sensors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sensor_type TEXT,
  frostguard_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Performance indexes for common queries
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_devices_organization ON devices(organization_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_telemetry_device_timestamp ON telemetry(device_id, timestamp DESC);
CREATE INDEX idx_sites_organization ON sites(organization_id);
CREATE INDEX idx_units_site ON units(site_id);
CREATE INDEX idx_sensors_unit ON sensors(unit_id);
CREATE INDEX idx_sensors_device ON sensors(device_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ttn_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Profiles policies
CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- TTN Settings policies
CREATE POLICY "Users can view TTN settings for their organization"
  ON ttn_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage TTN settings for their organization"
  ON ttn_settings FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Devices policies
CREATE POLICY "Users can view devices in their organization"
  ON devices FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers and admins can manage devices"
  ON devices FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Telemetry policies
CREATE POLICY "Users can view telemetry for devices in their organization"
  ON telemetry FOR SELECT
  USING (
    device_id IN (
      SELECT d.id FROM devices d
      INNER JOIN profiles p ON d.organization_id = p.organization_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "System can insert telemetry"
  ON telemetry FOR INSERT
  WITH CHECK (true); -- Edge functions will use service role

-- Sites policies
CREATE POLICY "Users can view sites in their organization"
  ON sites FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage sites"
  ON sites FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Units policies
CREATE POLICY "Users can view units in their organization"
  ON units FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      INNER JOIN profiles p ON s.organization_id = p.organization_id
      WHERE p.id = auth.uid()
    )
  );

-- Sensors policies
CREATE POLICY "Users can view sensors in their organization"
  ON sensors FOR SELECT
  USING (
    unit_id IN (
      SELECT u.id FROM units u
      INNER JOIN sites s ON u.site_id = s.id
      INNER JOIN profiles p ON s.organization_id = p.organization_id
      WHERE p.id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Add updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ttn_settings_updated_at
  BEFORE UPDATE ON ttn_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sensors_updated_at
  BEFORE UPDATE ON sensors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA (Optional - for development)
-- =====================================================

-- Create a default organization for testing
-- INSERT INTO organizations (name) VALUES ('Demo Organization');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
