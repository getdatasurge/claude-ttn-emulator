# Implementation Plan - FrostGuard LoRaWAN Emulator
**Created:** 2026-01-02
**Session:** Initial Implementation
**Goal:** Build core MVP features for LoRaWAN device simulation and TTN integration

---

## Source Analysis

**Project Type:** New full-stack application - React + TypeScript + Supabase + TTN
**Core Purpose:** Web-based simulator for LoRaWAN sensors with TTN integration
**Architecture:** Multi-tenant SaaS with Row-Level Security (RLS)
**Current State:**
- ✅ Project foundation complete (Vite, React, TypeScript, Tailwind, shadcn-ui config)
- ✅ Basic routing and pages created
- ✅ Supabase client infrastructure
- ✅ Git repository initialized with 10 GitHub issues
- ❌ No database schema
- ❌ No UI components installed
- ❌ No business logic implemented
- ❌ No edge functions created

**Dependencies Already Installed:**
- React 18.3.1, TypeScript 5.8
- Vite 5.4 with SWC
- TanStack React Query 5.x
- shadcn-ui components (configured, not installed)
- Supabase JS client 2.39.3
- React Hook Form + Zod
- Recharts 2.12.0

---

## Target Integration

**Integration Points:**
1. **Database Layer**
   - PostgreSQL schema with RLS policies
   - Multi-tenant data isolation
   - Time-series telemetry storage

2. **Frontend Components**
   - shadcn-ui component library
   - LoRaWAN device emulator UI
   - Real-time data visualization

3. **Backend Services**
   - Supabase Edge Functions (Deno)
   - TTN v3 HTTP API integration
   - FrostGuard API sync

4. **External APIs**
   - The Things Network v3
   - FrostGuard (upstream project)

**Affected Files:**
```
src/
├── components/
│   ├── ui/                    # shadcn-ui components (to install)
│   └── emulator/
│       ├── LoRaWANEmulator.tsx     # New - orchestrator
│       ├── DeviceManager.tsx        # New - device CRUD
│       ├── WebhookSettings.tsx      # New - TTN config
│       └── TelemetryChart.tsx       # New - visualization
├── lib/
│   ├── ttnConfigStore.ts      # Implement - state management
│   ├── ttn-payload.ts         # Implement - TTN types
│   └── frostguardOrgSync.ts   # Implement - API sync
├── hooks/
│   ├── useDevices.ts          # New - device state
│   ├── useTelemetry.ts        # New - telemetry data
│   └── useTTNConfig.ts        # New - TTN config hook
└── integrations/supabase/
    └── types.ts               # Update - database types

supabase/
├── migrations/
│   └── YYYYMMDDHHMMSS_initial_schema.sql  # New
└── functions/
    ├── ttn-simulate/          # New
    ├── ttn-preflight/         # New
    ├── ttn-webhook/           # New
    ├── manage-ttn-settings/   # New
    ├── fetch-org-state/       # New
    └── sync-to-frostguard/    # New
```

**Pattern Matching:**
- Follow existing React functional component patterns
- Use React Query for server state
- Maintain Tailwind CSS utility-first approach
- Follow debugLogger pattern for logging
- Use cn() utility for className merging

---

## Implementation Tasks

### Phase 1: Foundation (P0 - Critical Path)

#### Task 1.1: Install shadcn-ui Components
**Priority:** P0 (Blocker for UI development)
**Estimated:** 10 minutes
**Status:** ✅ Complete

Components to install:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add table
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add form
npx shadcn-ui@latest add label
npx shadcn-ui@latest add badge
```

**Acceptance Criteria:**
- [ ] All components installed in src/components/ui/
- [ ] Components compile without errors
- [ ] Can import and use components

---

#### Task 1.2: Define Database Schema
**Priority:** P0 (Critical - all features depend on this)
**Estimated:** 2-3 hours
**Status:** ⏳ Pending
**GitHub Issue:** #1

**Tables to Create:**

1. **organizations**
   - id (uuid, primary key)
   - name (text)
   - created_at (timestamp)
   - updated_at (timestamp)
   - RLS: Users can only access their org

2. **profiles** (extends Supabase auth.users)
   - id (uuid, references auth.users)
   - organization_id (uuid, references organizations)
   - full_name (text)
   - role (enum: admin, manager, viewer)
   - created_at (timestamp)

3. **ttn_settings**
   - id (uuid, primary key)
   - organization_id (uuid, references organizations)
   - app_id (text)
   - api_key (text, encrypted)
   - webhook_url (text)
   - region (text)
   - created_at (timestamp)
   - updated_at (timestamp)
   - RLS: Organization-scoped

4. **devices**
   - id (uuid, primary key)
   - organization_id (uuid, references organizations)
   - dev_eui (text, unique)
   - name (text)
   - device_type (enum: temperature, humidity, door)
   - status (enum: active, inactive, error)
   - simulation_params (jsonb)
   - created_at (timestamp)
   - updated_at (timestamp)
   - RLS: Organization-scoped

5. **telemetry**
   - id (uuid, primary key)
   - device_id (uuid, references devices)
   - timestamp (timestamptz)
   - payload (jsonb)
   - rssi (integer)
   - snr (float)
   - created_at (timestamp)
   - RLS: Via device → organization

**Enums:**
- device_type: 'temperature' | 'humidity' | 'door'
- sensor_status: 'active' | 'inactive' | 'error'
- user_role: 'admin' | 'manager' | 'viewer'

**Indexes:**
- telemetry(device_id, timestamp DESC) for time-series queries
- devices(organization_id)
- profiles(organization_id)

**Acceptance Criteria:**
- [ ] Migration file created
- [ ] All tables created with proper schema
- [ ] RLS policies implemented and tested
- [ ] Enums defined
- [ ] Indexes created
- [ ] TypeScript types regenerated
- [ ] Schema compiles without errors

---

### Phase 2: Core Business Logic (P1)

#### Task 2.1: Implement TTN Types and Utilities
**Priority:** P1
**Estimated:** 1-2 hours
**Status:** ⏳ Pending
**GitHub Issue:** #4
**File:** src/lib/ttn-payload.ts

**Implementation:**
```typescript
// TTN configuration interface
export interface TTNConfig {
  appId: string
  apiKey: string
  webhookUrl: string
  region: string
}

// Uplink message from TTN
export interface UplinkMessage {
  end_device_ids: {
    device_id: string
    dev_eui: string
    application_ids: {
      application_id: string
    }
  }
  uplink_message: {
    f_port: number
    f_cnt: number
    frm_payload: string  // base64
    decoded_payload?: object
    rx_metadata: Array<{
      gateway_ids: object
      rssi: number
      snr: number
    }>
    settings: {
      data_rate: object
      frequency: string
    }
  }
}

// Utility functions
export function encodePayload(data: SensorReading): string
export function decodePayload(payload: string): SensorReading
export function validateTTNConfig(config: TTNConfig): ValidationResult
export function formatUplink(deviceId: string, payload: object): UplinkMessage
```

**Acceptance Criteria:**
- [ ] All interfaces defined
- [ ] Payload encoding/decoding works
- [ ] Config validation implemented
- [ ] TypeScript compiles without errors

---

#### Task 2.2: Implement TTN Config Store
**Priority:** P1
**Estimated:** 2 hours
**Status:** ⏳ Pending
**GitHub Issue:** #3
**File:** src/lib/ttnConfigStore.ts

**Features:**
- Session storage persistence
- Listener pattern for updates
- Conflict resolution (local vs. server)
- Two-source fallback (user + org settings)

**Acceptance Criteria:**
- [ ] Store implemented with listeners
- [ ] Session storage working
- [ ] Conflict resolution logic
- [ ] React hooks created (useTTNConfig)

---

#### Task 2.3: Create Custom Hooks
**Priority:** P1
**Estimated:** 2-3 hours
**Status:** ⏳ Pending
**GitHub Issue:** #8

**Hooks to implement:**
1. `useDevices()` - Device CRUD with React Query
2. `useTelemetry(deviceId)` - Telemetry data with realtime
3. `useTTNConfig()` - TTN configuration state
4. `useRealtimeSubscription(table, filter)` - Generic realtime hook

**Acceptance Criteria:**
- [ ] All hooks implemented
- [ ] TypeScript types correct
- [ ] Error handling robust
- [ ] Auto-cleanup on unmount

---

### Phase 3: UI Components (P1)

#### Task 3.1: Create DeviceManager Component
**Priority:** P1
**Estimated:** 4-5 hours
**Status:** ⏳ Pending
**GitHub Issue:** #6
**File:** src/components/emulator/DeviceManager.tsx

**Features:**
- Device list with search/filter
- Add/edit/delete devices
- Device status indicators
- Bulk operations

**Acceptance Criteria:**
- [ ] Component renders correctly
- [ ] CRUD operations work
- [ ] Real-time updates functional
- [ ] Responsive design

---

#### Task 3.2: Create WebhookSettings Component
**Priority:** P1
**Estimated:** 4-5 hours
**Status:** ⏳ Pending
**GitHub Issue:** #10
**File:** src/components/emulator/WebhookSettings.tsx

**Features:**
- TTN credentials form
- Connection testing
- Import/export config
- Validation

**Acceptance Criteria:**
- [ ] Form functional
- [ ] Test connection works
- [ ] Import/export working
- [ ] Validation complete

---

#### Task 3.3: Create LoRaWANEmulator Orchestrator
**Priority:** P1
**Estimated:** 6-8 hours
**Status:** ⏳ Pending
**GitHub Issue:** #2
**File:** src/components/emulator/LoRaWANEmulator.tsx

**Integration:**
- Combines DeviceManager + WebhookSettings
- Adds telemetry simulation controls
- Recharts visualization
- Real-time updates

**Acceptance Criteria:**
- [ ] Component integrates all sub-components
- [ ] Simulation controls work
- [ ] Charts display data
- [ ] Real-time updates working

---

### Phase 4: Backend Services (P1)

#### Task 4.1: Implement Edge Functions Phase 1
**Priority:** P1
**Estimated:** 6-8 hours
**Status:** ⏳ Pending
**GitHub Issue:** #5

**Functions:**
1. `ttn-simulate` - Send uplinks to TTN
2. `ttn-preflight` - Validate config
3. `ttn-webhook` - Receive webhooks
4. `manage-ttn-settings` - Test connection

**Acceptance Criteria:**
- [ ] All 4 functions created
- [ ] CORS configured
- [ ] Error handling implemented
- [ ] Deployed to Supabase

---

## Validation Checklist

### Build & Test
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] No TypeScript errors
- [ ] All components render without errors

### Feature Completeness
- [ ] Database schema complete with RLS
- [ ] UI components installed
- [ ] Device management functional
- [ ] TTN configuration working
- [ ] Telemetry simulation operational
- [ ] Real-time updates working

### Integration Verification
- [ ] Supabase client connects
- [ ] Database queries work
- [ ] TTN API integration tested
- [ ] Real-time subscriptions functional

### Documentation
- [ ] README updated with new features
- [ ] Component usage documented
- [ ] API endpoints documented
- [ ] Environment variables documented

---

## Risk Mitigation

**Potential Issues:**
1. **Database Schema Complexity**
   - Risk: RLS policies may be complex
   - Mitigation: Test RLS thoroughly, use Supabase dashboard

2. **TTN API Integration**
   - Risk: TTN API changes or rate limits
   - Mitigation: Add proper error handling, implement retry logic

3. **Real-time Performance**
   - Risk: High telemetry volume may impact performance
   - Mitigation: Implement pagination, data aggregation

**Rollback Strategy:**
- Git tags at each phase completion
- Database migrations are reversible
- Feature flags for new functionality

---

## Progress Tracking

**Phase 1:** 0/2 tasks complete (0%)
**Phase 2:** 0/3 tasks complete (0%)
**Phase 3:** 0/3 tasks complete (0%)
**Phase 4:** 0/1 tasks complete (0%)

**Overall Progress:** 0/9 tasks complete (0%)

---

## Next Actions

1. Install shadcn-ui components (Task 1.1)
2. Create database schema (Task 1.2)
3. Implement TTN types (Task 2.1)
4. Create custom hooks (Task 2.3)
5. Build UI components (Phase 3)
6. Implement edge functions (Phase 4)
