-- Migration: Add FrostGuard Webhook Sync Support
-- Date: 2026-01-02
-- Purpose: Enable webhook-based synchronization from FrostGuard

-- 1. Add FrostGuard reference columns to existing tables
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS frostguard_org_id TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS synced_at TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sync_source TEXT DEFAULT 'manual';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS frostguard_user_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS synced_at TEXT;

-- 2. Create webhook_events table for tracking all incoming webhooks
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Event metadata
  event_type TEXT NOT NULL,
  event_id TEXT UNIQUE,  -- From FrostGuard payload
  payload TEXT NOT NULL,  -- JSON as TEXT for SQLite
  signature TEXT NOT NULL,

  -- Processing status
  processed INTEGER DEFAULT 0,  -- SQLite boolean (0/1)
  processed_at TEXT,
  error_message TEXT,

  -- Request metadata
  source_ip TEXT,
  user_agent TEXT,
  received_at TEXT DEFAULT (datetime('now')),

  -- Indexes will be created below
  organization_id TEXT REFERENCES organizations(id)
);

-- 3. Create webhook_secrets table for HMAC verification
CREATE TABLE IF NOT EXISTS webhook_secrets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,

  secret_key TEXT NOT NULL,
  active INTEGER DEFAULT 1,  -- SQLite boolean

  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed) WHERE processed = 0;
CREATE INDEX IF NOT EXISTS idx_webhook_events_org ON webhook_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_secrets_org ON webhook_secrets(organization_id) WHERE active = 1;
CREATE INDEX IF NOT EXISTS idx_orgs_frostguard_id ON organizations(frostguard_org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_frostguard_id ON profiles(frostguard_user_id);

-- 5. Add comment documentation (SQLite doesn't support COMMENT but we document here)
-- webhook_events.event_type: Type of event (org.created, user.added, etc.)
-- webhook_events.event_id: Unique event ID from FrostGuard for idempotency
-- webhook_events.payload: Full JSON payload as TEXT
-- webhook_events.signature: HMAC-SHA256 signature for verification
-- webhook_events.processed: 0 = pending, 1 = processed
-- webhook_secrets.secret_key: Shared HMAC secret with FrostGuard
-- organizations.frostguard_org_id: UUID from FrostGuard's organizations table
-- organizations.sync_source: 'webhook' | 'manual' | 'api'
