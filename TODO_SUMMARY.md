# TODO Summary - FrostGuard LoRaWAN Emulator

> Comprehensive technical debt and implementation roadmap
> Generated: 2026-01-02
> Total TODOs: 25+ across 9 files

---

## 📊 Overview by Priority

### P0 - Critical (Must Complete for MVP)
- [ ] **Database Schema** - Define all table structures with RLS
  - `src/integrations/supabase/types.ts:19`

### P1 - Important (Core Features)
- [ ] **LoRaWAN Emulator Component** - Main UI orchestrator
  - `src/pages/DeviceEmulator.tsx:26`
- [ ] **TTN Config Store** - Centralized state management
  - `src/lib/ttnConfigStore.ts:5`
- [ ] **TTN Payload Utilities** - Type definitions and helpers
  - `src/lib/ttn-payload.ts:5`
- [ ] **FrostGuard Sync** - API integration
  - `src/lib/frostguardOrgSync.ts:5`
- [ ] **RPC Function Signatures** - Database function types
  - `src/integrations/supabase/types.ts:41`
- [ ] **Enum Types** - Database enums for device types, statuses
  - `src/integrations/supabase/types.ts:46`
- [ ] **Edge Functions** - 17 Deno serverless functions
  - `supabase/functions/.gitkeep`

### P2 - Nice to Have (Enhancements)
- [ ] **Database Views** - Query optimization views
  - `src/integrations/supabase/types.ts:35`
- [ ] **Custom Hooks** - React hooks for cross-cutting concerns
  - `src/hooks/.gitkeep`

---

## 📁 TODOs by File

### Frontend

#### `src/pages/DeviceEmulator.tsx`
**TODO:** Replace placeholder with LoRaWANEmulator component (P1)
- Create orchestrator component at `src/components/emulator/LoRaWANEmulator.tsx`
- Implement DeviceManager panel for CRUD operations
- Add WebhookSettings panel for TTN configuration
- Integrate Recharts for real-time visualization
- Add React Query hooks for data fetching
- **Reference:** CLAUDE.md lines 37-42, NEXT_STEPS.md section 5
- **Lines:** 26-35

#### `src/integrations/supabase/types.ts`
**TODO 1:** Define database schema tables (P0)
- Organizations (multi-tenant with RLS)
- Users and authentication
- TTN settings (org-level with RLS)
- Synced users (user-level TTN settings)
- Devices (virtual LoRaWAN sensors)
- Telemetry (time-series data)
- Sites, units, sensors (FrostGuard entities)
- **Command to regenerate:** `supabase gen types typescript --local > src/integrations/supabase/types.ts`
- **Reference:** NEXT_STEPS.md section 3, CLAUDE.md "Multi-Tenant Design"
- **Lines:** 19-32

**TODO 2:** Add database views (P2)
- active_devices_with_latest_telemetry
- organization_device_summary
- **Lines:** 35-38

**TODO 3:** Define RPC function signatures (P1)
- Link to edge functions in `supabase/functions/`
- **Reference:** supabase/functions/README.md
- **Lines:** 41-43

**TODO 4:** Add enum types (P1)
- device_type: 'temperature' | 'humidity' | 'door'
- sensor_status: 'active' | 'inactive' | 'error'
- telemetry_type: 'uplink' | 'downlink'
- **Lines:** 46-50

#### `src/lib/ttnConfigStore.ts`
**TODO:** Implement TTN config store with listener pattern (P1)
- Create TTNConfig interface
- Implement sessionStorage persistence
- Add listener registration/notification
- Handle local vs. canonical config conflicts
- Provide hooks: `useTTNConfig()`, `useTTNConfigListener()`
- **Reference:** CLAUDE.md "TTN Configuration Flow" section
- **Lines:** 5-24

#### `src/lib/ttn-payload.ts`
**TODO:** Define TTN types and utilities (P1)
- **Types needed:**
  - UplinkMessage: TTN uplink format
  - DownlinkMessage: TTN downlink format
  - DeviceConfig: TTN device configuration
  - WebhookPayload: Webhook callback structure
  - LoRaWANPayload: Binary encoding/decoding
- **Utility functions:**
  - `encodePayload()`: Sensor readings → binary
  - `decodePayload()`: Binary → sensor readings
  - `validateTTNConfig()`: Validate credentials
  - `formatUplink()`: Format message for TTN API
- **Reference:** CLAUDE.md "Key Files", TTN API docs
- **Lines:** 5-22

#### `src/lib/frostguardOrgSync.ts`
**TODO:** Implement FrostGuard API synchronization (P1)
- `fetchOrgState()`: Call fetch-org-state edge function
- `syncToFrostGuard()`: Push updates to FrostGuard
- `handleConflicts()`: Resolve data conflicts
- `getSyncStatus()`: Get sync timestamp and status
- `autoSync()`: Periodic background sync
- **Integration points:**
  - Edge function: `supabase/functions/fetch-org-state`
  - Edge function: `supabase/functions/sync-to-frostguard`
  - Database tables: sites, units, sensors
- **Reference:** CLAUDE.md "Multi-Tenant Design", NEXT_STEPS.md section 9
- **Lines:** 5-28

---

### Components to Create

#### `src/components/emulator/` (5 components)
**Priority:** P1 for core components

1. **LoRaWANEmulator.tsx** (~1600 LOC)
   - Main orchestrator component
   - Device management panel
   - Telemetry simulation controls
   - TTN configuration interface
   - Real-time data visualization
   - WebSocket integration

2. **DeviceManager.tsx** (~1290 LOC)
   - Add/edit/delete virtual devices
   - Configure sensor types
   - Set simulation parameters
   - Device status monitoring
   - Bulk operations

3. **WebhookSettings.tsx** (~1700 LOC)
   - TTN API credentials management
   - Webhook endpoint configuration
   - Connection testing
   - Configuration validation
   - Import/export settings

4. **TelemetryChart.tsx** (P2)
   - Recharts integration
   - Multiple sensor types support
   - Time-range selection
   - Export chart data

5. **UserSelectionGate.tsx** (P1)
   - Organization picker
   - Session storage (1-hour expiry)
   - User authentication state

**Reference:** `src/components/emulator/.gitkeep`

---

### Custom Hooks to Implement

#### `src/hooks/` (6+ hooks)
**Priority:** P2 (Code Quality)

1. **useDevices()** (P1)
   - Device CRUD operations
   - React Query integration
   - Optimistic updates

2. **useTelemetry(deviceId)** (P1)
   - Handle device telemetry
   - Real-time updates
   - Historical data fetching

3. **useTTNConfig()** (P1)
   - Manage TTN configuration
   - Session storage sync
   - Validation

4. **useRealtimeSubscription(table, filter)** (P1)
   - Generic Supabase realtime hook
   - Auto-cleanup
   - Type-safe

5. **useFrostGuardSync()** (P2)
   - Trigger synchronization
   - Monitor sync status
   - Handle conflicts

6. **useTTNWebhook()** (P2)
   - Listen for webhook events
   - Parse payloads
   - Update local state

**Reference:** `src/hooks/.gitkeep`, NEXT_STEPS.md section 10

---

### Backend - Edge Functions

#### `supabase/functions/` (17 functions)
**Priority:** P0-P1 for core functions

**Phase 1: TTN Integration (P0)**
1. ✅ `ttn-simulate/` - Send uplinks to TTN
2. ✅ `ttn-preflight/` - Validate TTN config
3. ✅ `ttn-webhook/` - Receive webhooks (verify_jwt=false)
4. ✅ `manage-ttn-settings/` - Test API connection

**Phase 2: FrostGuard Integration (P1)**
5. ✅ `fetch-org-state/` - Pull canonical data
6. ✅ `sync-to-frostguard/` - Push updates

**Phase 3: Additional Functions (P2)**
7-17. TBD based on development needs:
- Device CRUD operations
- Telemetry aggregation
- User management
- Organization management
- Alert handling
- Report generation
- Webhook management
- Configuration management
- Audit logging
- Health checks
- Scheduled jobs

**Common requirements:**
- CORS headers on all functions
- Service role key for elevated access
- Request ID propagation
- Proper error handling
- Consistent response envelopes
- Logging with debugLogger pattern

**Reference:** `supabase/functions/.gitkeep`, CLAUDE.md "Edge Functions"

---

## 🎯 Suggested Implementation Order

### Week 1: Foundation
1. **Database schema** (P0) - `types.ts` + migrations
2. **TTN types** (P1) - `ttn-payload.ts`
3. **TTN config store** (P1) - `ttnConfigStore.ts`

### Week 2: Core Features
4. **Basic device hooks** (P1) - `useDevices()`, `useTelemetry()`
5. **DeviceManager component** (P1)
6. **Edge functions Phase 1** (P0) - TTN integration

### Week 3: UI & Integration
7. **LoRaWANEmulator component** (P1)
8. **WebhookSettings component** (P1)
9. **Edge functions Phase 2** (P1) - FrostGuard sync

### Week 4: Polish & Testing
10. **Custom hooks refinement** (P2)
11. **TelemetryChart component** (P2)
12. **Additional edge functions** (P2)
13. **Testing & documentation**

---

## 📝 Notes

- All TODOs include priority levels (P0/P1/P2)
- Each TODO references CLAUDE.md or NEXT_STEPS.md for context
- Line-of-code estimates provided where available from CLAUDE.md
- Database schema is the critical path blocker
- Multi-tenant RLS is a key security requirement

---

## 🔄 How to Track These TODOs

You have three options:

1. **Keep as code comments** - Continue development with inline TODOs
2. **Convert to GitHub issues** - Run `/todos-to-issues` command
3. **Hybrid approach** - Convert P0/P1 to issues, keep P2 as comments

All TODOs are committed to git and can be searched with:
```bash
grep -r "TODO:" src/ supabase/ --include="*.ts" --include="*.tsx"
```

---

**Last Updated:** 2026-01-02
**Total Files with TODOs:** 9
**Total Components to Create:** 5
**Total Hooks to Implement:** 6+
**Total Edge Functions:** 17
