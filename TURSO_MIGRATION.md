# Turso Migration Summary

## Overview

This document summarizes the migration from Supabase to Turso database with Cloudflare Workers backend.

## Architecture Changes

### Before (Supabase Stack)
- **Database**: PostgreSQL (Supabase)
- **Backend**: Supabase Edge Functions (Deno)
- **Auth**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Security**: Row-Level Security (RLS) policies

### After (Turso Stack)
- **Database**: Turso (SQLite at edge)
- **Backend**: Cloudflare Workers
- **Auth**: FusionAuth (self-hosted, to be configured)
- **Real-time**: Polling (MVP approach)
- **Security**: Application-level filtering with `organization_id`

## Files Created

### Database Layer
- `db/schema.sql` - SQLite schema with 8 tables, indexes, and triggers
  - Converted PostgreSQL types to SQLite equivalents
  - UUID → TEXT with randomblob(16)
  - TIMESTAMPTZ → INTEGER (Unix epoch seconds)
  - JSONB → TEXT (JSON strings)
  - Enum types → CHECK constraints
  - Added auto-update triggers for timestamps

### Type Definitions
- `src/lib/types.ts` - TypeScript types matching SQLite schema
  - Core database row types (Organization, Device, Telemetry, etc.)
  - Insert types (Omit id/timestamps)
  - Update types (Partial)
  - JSON parsing helpers for simulation_params and telemetry payloads
  - Unix timestamp conversion utilities

### Database Client
- `src/lib/db.ts` - Turso database client
  - Uses `@libsql/client` library
  - Provides `executeQuery` and `executeMutation` helpers
  - Includes `QueryContext` for organization-scoped operations
  - Falls back to `file:local.db` for local development

### Authentication
- `src/lib/auth.ts` - FusionAuth integration placeholders
  - Session storage-based user management
  - JWT token handling (placeholder)
  - Role-based authorization helpers
  - Login/logout functions (to be implemented)

### API Client
- `src/lib/api.ts` - Frontend API client
  - Replaces Supabase client
  - Fetch-based requests to Cloudflare Workers
  - Device CRUD operations
  - Telemetry retrieval
  - TTN simulation (placeholder endpoints)
  - Automatic JWT header injection

### Backend API
- `workers/api/index.ts` - Cloudflare Workers API
  - Built with `itty-router`
  - Device management endpoints (GET, POST, PUT, DELETE)
  - Telemetry retrieval endpoint
  - TTN webhook receiver
  - TTN simulation endpoint (placeholder)
  - CORS support
  - Organization-scoped queries for multi-tenancy

- `workers/wrangler.toml` - Cloudflare Workers configuration
  - Development and production environments
  - Environment variable placeholders for Turso credentials

## Files Removed

- `src/integrations/supabase/` - Entire directory removed
  - `client.ts` - Supabase client
  - `index.ts` - Exports
  - `types.ts` - Auto-generated Supabase types

## Dependencies Changed

### Removed
- `@supabase/supabase-js` - Supabase JavaScript client

### Added
- `@libsql/client` - Turso database client
- `itty-router` - Lightweight router for Cloudflare Workers
- `wrangler` - Cloudflare Workers CLI (dev dependency)

## Environment Variables

### Old (.env)
```env
VITE_SUPABASE_URL=<supabase-url>
VITE_SUPABASE_ANON_KEY=<supabase-key>
```

### New (.env)
```env
# Turso Database
VITE_TURSO_DATABASE_URL=libsql://your-database.turso.io
VITE_TURSO_AUTH_TOKEN=your-turso-auth-token

# Cloudflare Workers API
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev

# FusionAuth (Self-hosted)
VITE_FUSIONAUTH_URL=https://your-fusionauth-instance.com
VITE_FUSIONAUTH_CLIENT_ID=your-fusionauth-client-id
VITE_FUSIONAUTH_TENANT_ID=your-fusionauth-tenant-id

# Development Mode (optional)
# VITE_API_BASE_URL=http://localhost:8787
# VITE_TURSO_DATABASE_URL=file:local.db
```

## Database Schema Comparison

### Key Differences

| Feature | PostgreSQL (Supabase) | SQLite (Turso) |
|---------|----------------------|----------------|
| Primary Keys | UUID | TEXT (hex randomblob) |
| Timestamps | TIMESTAMPTZ | INTEGER (Unix epoch) |
| JSON Fields | JSONB | TEXT |
| Enums | ENUM types | CHECK constraints |
| Auto-update | NOW() | unixepoch() + triggers |
| Security | RLS policies | App-level WHERE clauses |

### Tables Converted
1. `organizations` - Tenant isolation root
2. `profiles` - User profiles with roles
3. `ttn_settings` - The Things Network configuration
4. `devices` - LoRaWAN device definitions
5. `telemetry` - Time-series sensor data
6. `sites` - Physical locations (FrostGuard sync)
7. `units` - Refrigeration units (FrostGuard sync)
8. `sensors` - Sensor mappings (FrostGuard sync)

## Security Model

### Supabase RLS (Before)
```sql
CREATE POLICY "Users can only access their org's devices"
ON devices FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));
```

### Application-Level (After)
```typescript
// In Cloudflare Workers
const { organizationId } = await verifyAuth(request, env)

const devices = await db.execute({
  sql: 'SELECT * FROM devices WHERE organization_id = ?',
  args: [organizationId]
})
```

## Multi-Tenant Isolation

All queries now include explicit `organization_id` filtering:
- Device operations scoped to user's organization
- Telemetry access requires device ownership verification
- TTN settings are organization-specific
- Sites/units/sensors synced per organization

## Next Steps

### Required for Deployment

1. **Turso Database Setup**
   ```bash
   # Install Turso CLI (requires WSL/Linux/macOS)
   # Or use Turso web dashboard
   turso db create frostguard-db
   turso db show frostguard-db
   ```

2. **Apply Database Schema**
   ```bash
   turso db shell frostguard-db < db/schema.sql
   ```

3. **Cloudflare Workers Deployment**
   ```bash
   cd workers
   wrangler login
   wrangler secret put TURSO_DATABASE_URL
   wrangler secret put TURSO_AUTH_TOKEN
   wrangler deploy
   ```

4. **FusionAuth Setup** (Self-hosted)
   - Deploy FusionAuth instance
   - Create application and tenant
   - Configure OAuth2 settings
   - Update environment variables
   - Implement JWT verification in `src/lib/auth.ts` and `workers/api/index.ts`

5. **Frontend Configuration**
   - Create `.env` file from `.env.example`
   - Set `VITE_API_BASE_URL` to your Workers endpoint
   - Set Turso credentials for local development

### Pending Implementation

1. **TTN Settings Endpoints** (workers/api/index.ts)
   - GET /api/ttn-settings
   - POST /api/ttn-settings
   - PUT /api/ttn-settings

2. **FusionAuth Integration**
   - JWT verification middleware
   - User registration flow
   - Token refresh logic
   - OAuth2 callback handling

3. **Frontend Updates**
   - Replace any remaining Supabase references
   - Update state management to use new API
   - Implement polling for "real-time" updates
   - Add error handling for API failures

4. **TTN Integration**
   - Implement actual TTN API calls in simulation endpoint
   - Configure TTN application webhook URL
   - Handle webhook authentication
   - Process uplink messages

## Testing Checklist

- [ ] Local database connectivity (file:local.db)
- [ ] Cloudflare Workers local development (wrangler dev)
- [ ] Device CRUD operations via API
- [ ] Telemetry retrieval
- [ ] Multi-tenant isolation (test with multiple orgs)
- [ ] FusionAuth login flow (when configured)
- [ ] TTN webhook reception
- [ ] TTN uplink simulation

## Rollback Plan

If needed to rollback to Supabase:
1. Restore `src/integrations/supabase/` from git history
2. Reinstall `@supabase/supabase-js`
3. Restore `.env` with Supabase credentials
4. Remove Turso-specific files (db/, workers/, src/lib/api.ts)
5. Restore Supabase migrations from `supabase/migrations/`

## Migration Benefits

1. **Cost Efficiency**: Turso free tier + Cloudflare free tier vs Supabase pricing
2. **Global Performance**: SQLite at edge locations worldwide
3. **Simplified Auth**: Self-hosted FusionAuth with full control
4. **Vendor Independence**: No lock-in to Supabase ecosystem
5. **Familiar Stack**: Standard SQL, REST APIs, JWT auth
