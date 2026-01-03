-- Add Applications table for TTN architecture
-- Migration: 20260102_add_applications
-- Description: Create applications table and update devices to reference applications

-- Applications table (TTN Application entity)
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  organization_id TEXT NOT NULL,
  app_id TEXT NOT NULL, -- TTN Application ID
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE(organization_id, app_id)
);

-- Gateways table (TTN Gateway entity)
CREATE TABLE IF NOT EXISTS gateways (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  organization_id TEXT NOT NULL,
  gateway_eui TEXT NOT NULL, -- 16 hex characters
  gateway_id TEXT NOT NULL, -- Human-readable ID
  name TEXT NOT NULL,
  description TEXT,
  frequency_plan TEXT DEFAULT 'US_902_928',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE(organization_id, gateway_eui)
);

-- Add application_id to devices table
ALTER TABLE devices ADD COLUMN application_id TEXT;

-- Add foreign key constraint (will reference applications table)
-- Note: SQLite doesn't support adding FK constraints to existing tables
-- So we'll handle this in the application layer

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_organization ON applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_gateways_organization ON gateways(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_application ON devices(application_id);

-- Triggers for auto-update timestamps
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
