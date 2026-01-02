# Next Steps

The FrostGuard LoRaWAN Device Emulator foundation has been successfully created! Here's what has been completed and what comes next.

## ✅ Completed Setup

### Project Infrastructure
- [x] Git repository initialized with comprehensive `.gitignore`
- [x] Vite + React 18 + TypeScript 5.8 project structure
- [x] Tailwind CSS 3.4 with custom theme and CSS variables
- [x] shadcn-ui component system configured
- [x] Path aliases configured (`@/` → `src/`)
- [x] ESLint with TypeScript support

### Core Application
- [x] React Router v6 with hash-based routing
- [x] TanStack React Query configured for data fetching
- [x] Three initial pages: Index (landing), DeviceEmulator, NotFound
- [x] Supabase client infrastructure with TypeScript types
- [x] Debug logging utility (`debugLogger`)
- [x] Common utilities (`cn()` for className merging)

### Directories Created
```
src/
├── pages/          ✅ Basic pages created
├── components/
│   ├── ui/         ✅ Ready for shadcn-ui components
│   └── emulator/   ✅ Ready for emulator-specific components
├── lib/            ✅ debugLogger and utils created
├── hooks/          ✅ Ready for custom hooks
└── integrations/supabase/  ✅ Client and types infrastructure

supabase/
├── functions/      ✅ Directory ready for edge functions
└── migrations/     ✅ Directory ready for database migrations
```

### Documentation
- [x] `README.md` - Comprehensive setup and usage guide
- [x] `CLAUDE.md` - AI assistant context (pre-existing)
- [x] `CLAUDE_PRD.md` - PRD template (pre-existing)
- [x] `.env.example` - Environment variable template

## 🚀 Next Steps (Priority Order)

### 1. Environment Setup (P0 - Required)
**What:** Set up your Supabase project and configure environment variables

**Steps:**
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env`
3. Add your Supabase URL and anon key to `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 2. Test the Application (P0 - Validation)
**What:** Verify the application runs correctly

**Steps:**
```bash
npm run dev
```
Visit `http://localhost:4145` - you should see the landing page with three feature cards and a "Launch Emulator" button.

### 3. Database Schema Design (P0 - Critical)
**What:** Design and implement the PostgreSQL schema

**Tables to create:**
- Organizations (multi-tenant hierarchy)
- Users and authentication
- TTN settings (with Row-Level Security)
- Devices (virtual sensors)
- Telemetry data (time-series)
- Sites and units (from FrostGuard sync)

**Tools:**
- Use Supabase Dashboard for initial schema design
- Generate migrations using `supabase migration new <name>`
- Implement Row-Level Security (RLS) policies

### 4. Install shadcn-ui Components (P1 - Important)
**What:** Add the UI components you'll need

**Recommended components to add:**
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
```

These will be installed to `src/components/ui/`

### 5. Build the Main Emulator Component (P1 - Core Feature)
**What:** Create the `LoRaWANEmulator.tsx` orchestrator component

**Key features:**
- Device management panel
- Telemetry simulation controls
- TTN configuration panel
- Real-time data visualization (using Recharts)
- WebSocket integration for live updates

**File:** `src/components/emulator/LoRaWANEmulator.tsx`

### 6. Implement Edge Functions (P1 - Backend Logic)
**What:** Create the 17 Deno edge functions

**Priority functions:**
1. `ttn-simulate` - Send simulated uplinks to TTN
2. `ttn-preflight` - Validate TTN config
3. `ttn-webhook` - Receive TTN webhooks
4. `fetch-org-state` - Pull data from FrostGuard
5. `manage-ttn-settings` - Test TTN API connection

**Setup:**
```bash
npm install -g supabase  # Install Supabase CLI
supabase functions new <function-name>
```

### 7. Implement TTN Integration (P1 - Critical Integration)
**What:** Create TTN API client and payload utilities

**Files to create:**
- `src/lib/ttn-payload.ts` - TTN types and utilities
- `src/lib/ttnConfigStore.ts` - TTN config state management
- `src/components/emulator/WebhookSettings.tsx` - TTN configuration UI

### 8. Build Device Manager (P1 - Core Feature)
**What:** Create the device management interface

**File:** `src/components/emulator/DeviceManager.tsx`

**Features:**
- Add/edit/delete virtual devices
- Configure sensor types (temperature, humidity, door)
- Set simulation parameters
- Device status monitoring

### 9. FrostGuard Sync Integration (P1 - External Integration)
**What:** Implement FrostGuard API synchronization

**File:** `src/lib/frostguardOrgSync.ts`

**Features:**
- Pull canonical organization data
- Sync sites, units, sensors
- Handle conflicts and updates

### 10. Implement Custom Hooks (P2 - Code Quality)
**What:** Extract reusable logic into custom hooks

**Example hooks:**
- `useDevices()` - Manage device state
- `useTTNConfig()` - Manage TTN configuration
- `useTelemetry()` - Handle telemetry data
- `useRealtimeSubscription()` - Supabase realtime subscriptions

### 11. Testing Setup (P2 - Quality Assurance)
**What:** Add testing framework

**Recommended:**
- Vitest for unit tests (Vite-native)
- React Testing Library for component tests
- Optional: Playwright for E2E tests

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### 12. Additional Documentation (P2 - Documentation)
**Files to create:**
- `TTN_SYNC_SETUP.md` - Detailed TTN integration guide
- `FROSTGUARD_AUDIT_REPORT.md` - Architecture audit
- API documentation for edge functions

## 📋 Development Workflow

1. **Feature Development:**
   - Create a new branch: `git checkout -b feature/your-feature`
   - Develop and test locally
   - Commit with descriptive messages
   - Merge to main when complete

2. **Database Changes:**
   - Create migration: `supabase migration new description`
   - Test locally: `supabase db reset`
   - Push to remote: `supabase db push`

3. **Edge Functions:**
   - Create: `supabase functions new function-name`
   - Test locally: `supabase functions serve function-name`
   - Deploy: `supabase functions deploy function-name`

## 🔍 Quick Checks

**Verify build:**
```bash
npm run build
```

**Run linter:**
```bash
npm run lint
```

**Start dev server:**
```bash
npm run dev
```

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn-ui](https://ui.shadcn.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [The Things Network](https://www.thethingsnetwork.org/docs/)

## 🎯 MVP Scope Recommendation

For a functional MVP, prioritize:
1. Basic device creation and management
2. Simple telemetry simulation (manual trigger)
3. TTN uplink simulation (one-way)
4. Basic data visualization
5. Single-tenant support (multi-tenant can come later)

Defer to v2:
- FrostGuard synchronization
- Advanced simulation (automated, scheduled)
- Webhook handling (two-way communication)
- Complex reporting and analytics
- Full multi-tenant with RLS

---

**Status:** Project foundation complete ✅
**Next Action:** Set up Supabase environment variables and test the application
