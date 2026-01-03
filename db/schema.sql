-- FrostGuard LoRaWAN Emulator - Turso/SQLite Schema
-- Migration: 20260102_initial_schema
-- Description: Create core tables for multi-tenant LoRaWAN device emulation

-- =====================================================
-- TABLES
-- =====================================================

-- Organizations table (synced from FrostGuard)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY, -- FrostGuard organization UUID
  frostguard_org_id TEXT UNIQUE, -- Reference to FrostGuard org
  name TEXT NOT NULL,
  slug TEXT,
  ttn_app_id TEXT, -- TTN application ID from FrostGuard
  deleted_at INTEGER, -- Soft delete timestamp
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Profiles table (user profiles with roles)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('admin', 'manager', 'viewer')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- TTN Settings table
CREATE TABLE IF NOT EXISTS ttn_settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  organization_id TEXT NOT NULL UNIQUE,
  app_id TEXT NOT NULL,
  api_key TEXT NOT NULL,
  webhook_url TEXT,
  region TEXT DEFAULT 'eu1',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Applications table (TTN architecture)
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  organization_id TEXT NOT NULL,
  app_id TEXT NOT NULL, -- TTN Application ID (e.g., "frostguard-prod")
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE(organization_id, app_id)
);

-- Gateways table (TTN architecture)
CREATE TABLE IF NOT EXISTS gateways (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  organization_id TEXT NOT NULL,
  gateway_id TEXT NOT NULL, -- TTN Gateway ID
  gateway_eui TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency_plan TEXT DEFAULT 'EU_863_870',
  location_latitude REAL,
  location_longitude REAL,
  location_altitude REAL,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK(status IN ('connected', 'disconnected', 'other')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE(organization_id, gateway_id)
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  organization_id TEXT NOT NULL,
  application_id TEXT, -- FK to applications table
  dev_eui TEXT NOT NULL,
  app_eui TEXT NOT NULL DEFAULT '',
  app_key TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK(device_type IN ('temperature', 'humidity', 'door')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'error')),
  simulation_params TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
  UNIQUE(organization_id, dev_eui)
);

-- Telemetry table (time-series data)
CREATE TABLE IF NOT EXISTS telemetry (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  device_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
  payload TEXT NOT NULL,
  rssi INTEGER,
  snr REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Sites table (FrostGuard integration)
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  frostguard_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Units table (refrigeration units)
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  site_id TEXT NOT NULL,
  name TEXT NOT NULL,
  unit_type TEXT,
  frostguard_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Sensors table (physical sensor mappings)
CREATE TABLE IF NOT EXISTS sensors (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  unit_id TEXT NOT NULL,
  device_id TEXT,
  name TEXT NOT NULL,
  sensor_type TEXT,
  frostguard_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_applications_organization ON applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_gateways_organization ON gateways(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_organization ON devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_application ON devices(application_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_telemetry_device_timestamp ON telemetry(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sites_organization ON sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_units_site ON units(site_id);
CREATE INDEX IF NOT EXISTS idx_sensors_unit ON sensors(unit_id);
CREATE INDEX IF NOT EXISTS idx_sensors_device ON sensors(device_id);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE timestamps
-- =====================================================

CREATE TRIGGER IF NOT EXISTS update_organizations_updated_at
AFTER UPDATE ON organizations
BEGIN
  UPDATE organizations SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
AFTER UPDATE ON profiles
BEGIN
  UPDATE profiles SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_ttn_settings_updated_at
AFTER UPDATE ON ttn_settings
BEGIN
  UPDATE ttn_settings SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_applications_updated_at
AFTER UPDATE ON applications
BEGIN
  UPDATE applications SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_gateways_updated_at
AFTER UPDATE ON gateways
BEGIN
  UPDATE gateways SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_devices_updated_at
AFTER UPDATE ON devices
BEGIN
  UPDATE devices SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_sites_updated_at
AFTER UPDATE ON sites
BEGIN
  UPDATE sites SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_units_updated_at
AFTER UPDATE ON units
BEGIN
  UPDATE units SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_sensors_updated_at
AFTER UPDATE ON sensors
BEGIN
  UPDATE sensors SET updated_at = unixepoch() WHERE id = NEW.id;
END;

-- =====================================================
-- SEED DATA (Optional - for development)
-- =====================================================

-- Uncomment to create a demo organization for testing
-- INSERT OR IGNORE INTO organizations (id, name) VALUES ('demo-org', 'Demo Organization');
