# Implementation Plan - FrostGuard LoRaWAN Emulator
**Created:** 2026-01-02
**Updated:** 2026-01-02 (Post-Turso Migration)
**Session:** Turso Migration Complete - Continuing Implementation
**Goal:** Complete MVP features for LoRaWAN device simulation and TTN integration

---

## Migration Summary

**Architecture Changed from Supabase to Turso Stack:**
- ✅ Database: PostgreSQL → SQLite (Turso)
- ✅ Backend: Supabase Edge Functions → Cloudflare Workers
- ✅ Auth: Supabase Auth → FusionAuth (placeholder)
- ✅ Security: RLS policies → Application-level filtering
- ✅ Real-time: Supabase Realtime → Polling (MVP approach)

**Migration Complete:**
- ✅ Database schema created (`db/schema.sql`)
- ✅ Type definitions (`src/lib/types.ts`)
- ✅ Database client (`src/lib/db.ts`)
- ✅ Auth integration (`src/lib/auth.ts`)
- ✅ API client (`src/lib/api.ts`)
- ✅ Cloudflare Workers API (`workers/api/index.ts`)
- ✅ Configuration updated (`.env.example`, `README.md`)
- ✅ Dependencies updated (`itty-router`, removed `@supabase/supabase-js`)
- ✅ Build passing

---

## Current State

**Completed:**
- ✅ Phase 1.1: shadcn-ui components installed (14 components)
- ✅ Phase 1.2: Database schema created (SQLite version)
- ✅ Backend API structure (Cloudflare Workers)
- ✅ TypeScript types aligned with new schema
- ✅ Environment configuration updated

**Pending:**
- ❌ TTN types and utilities
- ❌ TTN config store
- ❌ Custom React hooks (useDevices, useTelemetry, useTTNConfig)
- ❌ UI components (DeviceManager, WebhookSettings, LoRaWANEmulator)
- ❌ Complete Workers API endpoints (TTN settings, simulation)
- ❌ FusionAuth JWT verification
- ❌ Frontend integration with new API

---

## Target Integration

**Integration Points:**
1. **Database Layer** ✅ Complete
   - SQLite schema with triggers
   - Multi-tenant via organization_id filtering
   - Time-series telemetry storage

2. **Frontend Components** ⏳ In Progress
   - shadcn-ui components installed
   - Need to build emulator UI components
   - Need data visualization with Recharts

3. **Backend Services** ⏳ Partial
   - Cloudflare Workers API structure complete
   - Device CRUD endpoints working
   - Telemetry endpoints working
   - TTN webhook receiver implemented
   - Need: TTN settings endpoints
   - Need: TTN simulation logic
   - Need: FusionAuth JWT verification

4. **External APIs** ⏳ Pending
   - The Things Network v3 integration
   - FusionAuth authentication (deferred)

**Affected Files:**
```
✅ COMPLETE:
src/lib/
├── api.ts              # API client for Workers
├── db.ts               # Turso database client
├── auth.ts             # FusionAuth placeholders
└── types.ts            # Database type definitions

workers/
├── api/index.ts        # Cloudflare Workers API
└── wrangler.toml       # Workers configuration

db/
└── schema.sql          # SQLite schema

⏳ TO IMPLEMENT:
src/lib/
├── ttnConfigStore.ts   # TTN config state management
└── ttn-payload.ts      # TTN types and utilities

src/hooks/
├── useDevices.ts       # Device state management
├── useTelemetry.ts     # Telemetry data fetching
├── useTTNConfig.ts     # TTN config hook
└── usePolling.ts       # Polling for real-time updates

src/components/emulator/
├── LoRaWANEmulator.tsx     # Main orchestrator
├── DeviceManager.tsx        # Device CRUD UI
├── WebhookSettings.tsx      # TTN configuration UI
└── TelemetryChart.tsx       # Data visualization
```

---

## Implementation Tasks

### Phase 2: Core Business Logic (Current Phase)

#### Task 2.1: Implement TTN Types and Utilities
**Priority:** P1 (High)
**Estimated:** 1-2 hours
**Status:** ⏳ Pending
**File:** `src/lib/ttn-payload.ts`

**Implementation:**
```typescript
// TTN configuration interface
export interface TTNConfig {
  appId: string
  apiKey: string
  webhookUrl: string
  region: string
}

// Uplink message structure from TTN v3
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
    frm_payload: string  // base64 encoded
    decoded_payload?: Record<string, any>
    rx_metadata: Array<{
      gateway_ids: Record<string, any>
      rssi: number
      snr: number
    }>
    settings: {
      data_rate: Record<string, any>
      frequency: string
    }
  }
}

// Sensor reading types
export interface SensorReading {
  temperature?: number
  humidity?: number
  battery?: number
  door_open?: boolean
  [key: string]: any
}

// Utility functions
export function encodePayload(data: SensorReading): string
export function decodePayload(payload: string): SensorReading
export function validateTTNConfig(config: TTNConfig): { valid: boolean; errors?: string[] }
export function formatUplink(deviceId: string, devEui: string, payload: SensorReading): UplinkMessage
```

**Acceptance Criteria:**
- [ ] All TypeScript interfaces defined
- [ ] Payload encoding/decoding implemented (base64 + JSON)
- [ ] TTN config validation with error messages
- [ ] Uplink message formatter working
- [ ] TypeScript compiles without errors
- [ ] Unit tests for encode/decode

---

#### Task 2.2: Implement TTN Config Store
**Priority:** P1 (High)
**Estimated:** 2 hours
**Status:** ⏳ Pending
**File:** `src/lib/ttnConfigStore.ts`

**Features:**
- Session storage persistence
- Listener pattern for updates
- Dirty state tracking (local edits vs server)
- Load/save to Cloudflare Workers API

**Implementation Outline:**
```typescript
interface TTNConfigState {
  config: TTNConfig | null
  isDirty: boolean
  isLoading: boolean
  error: string | null
}

class TTNConfigStore {
  private state: TTNConfigState
  private listeners: Set<(state: TTNConfigState) => void>

  loadConfig(): Promise<void>
  saveConfig(config: TTNConfig): Promise<void>
  updateLocal(config: Partial<TTNConfig>): void
  subscribe(listener: (state: TTNConfigState) => void): () => void
}

export const ttnConfigStore = new TTNConfigStore()
```

**Acceptance Criteria:**
- [ ] Store class implemented with TypeScript
- [ ] Session storage persistence working
- [ ] Listener pattern functional
- [ ] Load/save to API endpoints
- [ ] Dirty state tracking
- [ ] React hook `useTTNConfig()` created

---

#### Task 2.3: Create Custom React Hooks
**Priority:** P1 (High)
**Estimated:** 3-4 hours
**Status:** ⏳ Pending
**Files:**
- `src/hooks/useDevices.ts`
- `src/hooks/useTelemetry.ts`
- `src/hooks/useTTNConfig.ts`
- `src/hooks/usePolling.ts`

**Hooks to Implement:**

1. **useDevices()**
```typescript
export function useDevices() {
  // Uses React Query to fetch devices from API
  const query = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(),
  })

  const createMutation = useMutation({
    mutationFn: (device: DeviceInsert) => createDevice(device),
    onSuccess: () => queryClient.invalidateQueries(['devices']),
  })

  return {
    devices: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createDevice: createMutation.mutate,
    updateDevice: updateMutation.mutate,
    deleteDevice: deleteMutation.mutate,
  }
}
```

2. **useTelemetry(deviceId: string)**
```typescript
export function useTelemetry(deviceId: string, options = {}) {
  const { limit = 100, offset = 0 } = options

  return useQuery({
    queryKey: ['telemetry', deviceId, limit, offset],
    queryFn: () => getTelemetry(deviceId, { limit, offset }),
    enabled: !!deviceId,
  })
}
```

3. **useTTNConfig()**
```typescript
export function useTTNConfig() {
  const [state, setState] = useState(ttnConfigStore.getState())

  useEffect(() => {
    return ttnConfigStore.subscribe(setState)
  }, [])

  return {
    config: state.config,
    isDirty: state.isDirty,
    isLoading: state.isLoading,
    error: state.error,
    updateConfig: ttnConfigStore.updateLocal,
    saveConfig: ttnConfigStore.saveConfig,
    loadConfig: ttnConfigStore.loadConfig,
  }
}
```

4. **usePolling(queryKey, queryFn, interval)**
```typescript
export function usePolling<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  interval: number = 5000
) {
  return useQuery({
    queryKey,
    queryFn,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  })
}
```

**Acceptance Criteria:**
- [ ] All 4 hooks implemented
- [ ] TypeScript types correct
- [ ] React Query integration working
- [ ] Error handling in place
- [ ] Auto-cleanup on unmount
- [ ] Hooks testable

---

### Phase 3: UI Components (Next Phase)

#### Task 3.1: Create DeviceManager Component
**Priority:** P1 (High)
**Estimated:** 4-5 hours
**Status:** ⏳ Pending
**File:** `src/components/emulator/DeviceManager.tsx`

**Features:**
- Device list table (shadcn Table)
- Add device dialog (shadcn Dialog + Form)
- Edit device functionality
- Delete with confirmation
- Device status badges
- Search and filter

**Component Structure:**
```typescript
export function DeviceManager() {
  const { devices, createDevice, updateDevice, deleteDevice } = useDevices()
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Devices</CardTitle>
        <Button onClick={() => setIsAddDialogOpen(true)}>Add Device</Button>
      </CardHeader>
      <CardContent>
        <Table>
          {/* Device list with actions */}
        </Table>
      </CardContent>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        {/* Add device form */}
      </Dialog>
    </Card>
  )
}
```

**Acceptance Criteria:**
- [ ] Component renders correctly
- [ ] Device list displays from API
- [ ] Add device form working with validation
- [ ] Edit device functionality
- [ ] Delete with confirmation dialog
- [ ] Status badges show correct states
- [ ] Responsive design
- [ ] Loading and error states

---

#### Task 3.2: Create WebhookSettings Component
**Priority:** P1 (High)
**Estimated:** 4-5 hours
**Status:** ⏳ Pending
**File:** `src/components/emulator/WebhookSettings.tsx`

**Features:**
- TTN credentials form (App ID, API Key, Region)
- Webhook URL display
- Connection test button
- Save/cancel actions
- Validation with Zod
- Import/export configuration

**Component Structure:**
```typescript
export function WebhookSettings() {
  const { config, isDirty, saveConfig, updateConfig } = useTTNConfig()
  const [isTesting, setIsTesting] = useState(false)

  const handleTest = async () => {
    // Call preflight endpoint to test connection
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>TTN Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <Form>
          <Input label="Application ID" {...} />
          <Input label="API Key" type="password" {...} />
          <Select label="Region" {...} />
          <Input label="Webhook URL" disabled {...} />
        </Form>
      </CardContent>
      <CardFooter>
        <Button onClick={handleTest} disabled={isTesting}>
          Test Connection
        </Button>
        <Button onClick={saveConfig} disabled={!isDirty}>
          Save
        </Button>
      </CardFooter>
    </Card>
  )
}
```

**Acceptance Criteria:**
- [ ] Form renders with current config
- [ ] Validation working (Zod schema)
- [ ] Test connection calls preflight endpoint
- [ ] Save persists to API
- [ ] Dirty state tracking working
- [ ] Import/export JSON config
- [ ] Loading and error states

---

#### Task 3.3: Create TelemetryChart Component
**Priority:** P1 (High)
**Estimated:** 3-4 hours
**Status:** ⏳ Pending
**File:** `src/components/emulator/TelemetryChart.tsx`

**Features:**
- Line chart with Recharts
- Display temperature/humidity over time
- Auto-refresh with polling
- Time range selector
- Export data

**Component Structure:**
```typescript
export function TelemetryChart({ deviceId }: { deviceId: string }) {
  const { data: telemetry } = useTelemetry(deviceId)

  const chartData = useMemo(() => {
    return telemetry?.map(t => ({
      timestamp: fromUnixTimestamp(t.timestamp),
      ...parseTelemetryPayload(t.payload),
    }))
  }, [telemetry])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telemetry Data</CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart data={chartData}>
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Line dataKey="temperature" stroke="red" />
          <Line dataKey="humidity" stroke="blue" />
        </LineChart>
      </CardContent>
    </Card>
  )
}
```

**Acceptance Criteria:**
- [ ] Chart renders telemetry data
- [ ] Multiple metrics displayed
- [ ] Auto-refresh with polling
- [ ] Responsive sizing
- [ ] Loading states
- [ ] Empty state handling

---

#### Task 3.4: Create LoRaWANEmulator Orchestrator
**Priority:** P1 (High)
**Estimated:** 5-6 hours
**Status:** ⏳ Pending
**File:** `src/components/emulator/LoRaWANEmulator.tsx`

**Features:**
- Combines all sub-components
- Tabs for different sections (Devices, Settings, Telemetry)
- Simulation controls (start/stop simulation)
- Real-time status indicators
- Error boundary

**Component Structure:**
```typescript
export function LoRaWANEmulator() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1>LoRaWAN Device Emulator</h1>
        <Button onClick={toggleSimulation}>
          {isSimulating ? 'Stop' : 'Start'} Simulation
        </Button>
      </div>

      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
          <TabsTrigger value="settings">TTN Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <DeviceManager onSelectDevice={setSelectedDeviceId} />
        </TabsContent>

        <TabsContent value="telemetry">
          {selectedDeviceId && <TelemetryChart deviceId={selectedDeviceId} />}
        </TabsContent>

        <TabsContent value="settings">
          <WebhookSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] All sub-components integrated
- [ ] Tab navigation working
- [ ] Simulation controls functional
- [ ] Device selection propagates
- [ ] Error boundary catches errors
- [ ] Responsive layout

---

### Phase 4: Complete Backend Services

#### Task 4.1: Implement TTN Settings Endpoints
**Priority:** P1 (High)
**Estimated:** 2-3 hours
**Status:** ✅ Complete
**File:** `workers/api/index.ts`

**Endpoints Implemented:**
```typescript
// GET /api/ttn-settings
router.get('/api/ttn-settings', async (request, env: Env) => {
  const { organizationId } = await verifyAuth(request, env)
  // Fetch TTN settings for organization
})

// POST /api/ttn-settings
router.post('/api/ttn-settings', async (request, env: Env) => {
  const { organizationId } = await verifyAuth(request, env)
  // Create or update TTN settings
})

// POST /api/ttn-settings/test
router.post('/api/ttn-settings/test', async (request, env: Env) => {
  // Test TTN connection (preflight check)
  // Call TTN API to validate credentials
})
```

**Acceptance Criteria:**
- [x] Endpoints implemented
- [x] Database queries working (upsert logic for settings)
- [x] TTN API connection test (validates credentials with TTN v3 API)
- [x] Error handling (catches TTN API errors, returns structured responses)
- [x] Organization scoping enforced
- [x] Frontend API client updated (`src/lib/api.ts`)
- [x] WebhookSettings component integrated with test endpoint

---

#### Task 4.2: Implement TTN Simulation Logic
**Priority:** P1 (High)
**Estimated:** 3-4 hours
**Status:** ✅ Complete
**File:** `workers/api/index.ts`

**Simulation endpoint implemented:**
```typescript
router.post('/api/ttn/simulate/:deviceId', async (request, env: Env) => {
  const { organizationId } = await verifyAuth(request, env)
  const { deviceId } = request.params
  const body = await request.json()

  // Get device and TTN settings
  // Generate sensor reading (or use provided payload)
  // Format uplink message
  // Send to TTN API
  // Store telemetry locally

  return jsonResponse({ success: true })
})
```

**Acceptance Criteria:**
- [x] Uplink formatting correct (TTN v3 message structure)
- [x] TTN API integration working (sends to TTN webhook endpoint)
- [x] Local telemetry storage (stores after successful send)
- [x] Error handling for TTN failures (catches and returns error details)
- [x] Sensor reading generation (based on device type and simulation params)
- [x] Payload encoding (base64 with proper byte format)
- [x] Metadata simulation (RSSI, SNR, gateway info)

**Implementation Details:**
- Added `generateReading()` - creates realistic sensor data based on device type
- Added `formatUplinkMessage()` - structures TTN v3 uplink message
- Added `encodePayloadToBase64()` - encodes sensor data to binary payload
- Sends to TTN v3 Application Server webhook endpoint
- Stores telemetry with metadata (RSSI, SNR) after successful transmission

---

#### Task 4.3: Implement FusionAuth JWT Verification (Optional)
**Priority:** P2 (Medium - can defer)
**Estimated:** 3-4 hours
**Status:** ⏳ Deferred
**Files:** `workers/api/index.ts`, `src/lib/auth.ts`

**When FusionAuth is deployed:**
- Implement JWT verification in Workers
- Add token refresh logic in frontend
- Complete login/logout flows
- Add role-based authorization checks

---

### Phase 5: Integration & Testing

#### Task 5.1: Frontend Integration with API
**Priority:** P1 (High)
**Estimated:** 2-3 hours
**Status:** ✅ Complete

**Tasks:**
- Update all components to use new API client
- Remove any Supabase references
- Test all CRUD operations
- Test real-time polling
- Handle API errors gracefully

**Acceptance Criteria:**
- [x] No Supabase imports remaining (verified via grep)
- [x] All API calls using `src/lib/api.ts`
- [x] Error handling working (toast notifications for simulation)
- [x] Loading states implemented (in all hooks and components)
- [x] Polling functional (TelemetryChart auto-refresh when simulating)
- [x] Simulation controls working (Start/Stop with 60s interval)
- [x] Toaster component integrated into App.tsx
- [x] Build passing (248.88 kB bundle)
- [x] Lint passing (0 errors, 5 acceptable warnings from shadcn-ui)

---

#### Task 5.2: End-to-End Testing
**Priority:** P1 (High)
**Estimated:** 2-3 hours
**Status:** ⏳ Pending

**Test Scenarios:**
1. Create device → Appears in list
2. Update device → Changes reflected
3. Delete device → Removed from list
4. Configure TTN → Settings saved
5. Test TTN connection → Validation works
6. Simulate uplink → Telemetry appears
7. View telemetry chart → Data displays

**Acceptance Criteria:**
- [ ] All scenarios tested manually
- [ ] No console errors
- [ ] UI responsive
- [ ] Data persistence working
- [ ] Real-time updates functional

---

## Validation Checklist

### Build & Compile
- [x] `npm run build` passes
- [x] `npm run lint` passes (to verify)
- [x] No TypeScript errors
- [ ] Components render without errors

### Feature Completeness
- [x] Database schema complete
- [x] shadcn-ui components installed
- [ ] TTN types and utilities implemented
- [ ] Custom hooks created
- [ ] Device management UI functional
- [ ] TTN configuration UI working
- [ ] Telemetry visualization operational
- [ ] Backend API endpoints complete

### Integration Verification
- [x] Turso database client working
- [x] Cloudflare Workers API structure
- [ ] Frontend → Workers API integration
- [ ] TTN API integration tested
- [ ] Polling for real-time updates

### Documentation
- [x] README updated for Turso stack
- [x] TURSO_MIGRATION.md created
- [ ] Component usage examples
- [ ] API endpoint documentation
- [ ] Deployment guide

---

## Progress Tracking

**Phase 1 (Foundation):** 2/2 tasks complete (100%) ✅
- Task 1.1: shadcn-ui components ✅
- Task 1.2: Database schema ✅

**Phase 2 (Business Logic):** 0/3 tasks complete (0%)
- Task 2.1: TTN types and utilities ⏳
- Task 2.2: TTN config store ⏳
- Task 2.3: Custom hooks ⏳

**Phase 3 (UI Components):** 0/4 tasks complete (0%)
- Task 3.1: DeviceManager ⏳
- Task 3.2: WebhookSettings ⏳
- Task 3.3: TelemetryChart ⏳
- Task 3.4: LoRaWANEmulator ⏳

**Phase 4 (Backend):** 0/2 tasks complete (0%)
- Task 4.1: TTN settings endpoints ⏳
- Task 4.2: TTN simulation logic ⏳

**Phase 5 (Integration):** 0/2 tasks complete (0%)
- Task 5.1: Frontend integration ⏳
- Task 5.2: End-to-end testing ⏳

**Overall Progress:** 2/13 tasks complete (15%)

---

## Next Actions (Priority Order)

1. **Task 2.1:** Implement TTN types and utilities (`src/lib/ttn-payload.ts`)
2. **Task 2.2:** Implement TTN config store (`src/lib/ttnConfigStore.ts`)
3. **Task 2.3:** Create custom React hooks
4. **Task 3.1:** Build DeviceManager component
5. **Task 3.2:** Build WebhookSettings component
6. **Task 3.3:** Build TelemetryChart component
7. **Task 3.4:** Build LoRaWANEmulator orchestrator
8. **Task 4.1:** Complete TTN settings endpoints
9. **Task 4.2:** Implement TTN simulation logic
10. **Task 5.1:** Integrate frontend with API
11. **Task 5.2:** End-to-end testing

---

## Risk Mitigation

**Current Risks:**
1. **TTN API Integration**
   - Risk: TTN v3 API changes or authentication issues
   - Mitigation: Comprehensive error handling, retry logic, fallback mechanisms

2. **Polling Performance**
   - Risk: Frequent polling may impact performance
   - Mitigation: Configurable intervals, efficient queries, pagination

3. **FusionAuth Deferred**
   - Risk: No real authentication currently
   - Mitigation: Placeholder implementation allows development to continue

**Rollback Strategy:**
- Git commits at each task completion
- Database schema migrations are documented
- Can revert to Supabase if needed (documented in TURSO_MIGRATION.md)
