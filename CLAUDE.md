# CLAUDE.md - FrostGuard LoRaWAN Device Emulator

 

This file provides context for Claude Code (or other AI assistants) working on this codebase.

 

## Project Overview

 

**FrostGuard LoRaWAN Device Emulator** is a full-stack development and testing tool for The Things Network (TTN) integration. It's a web-based simulator for LoRaWAN sensors with Turso edge database and Cloudflare Workers backend, designed to test multi-tenant IoT data flow between FrostGuard (upstream project) and this emulator.

 

**Real-world context:** Simulates temperature/humidity/door sensors in refrigerator/freezer monitoring scenarios, integrating with TTN's LoRaWAN network infrastructure.

 

## Technology Stack

 

### Frontend

- **Framework:** React 18.3 + TypeScript 5.8

- **Build Tool:** Vite 5.4 with SWC compiler

- **Routing:** React Router v6

- **UI Library:** shadcn-ui (Radix UI components)

- **Styling:** Tailwind CSS 3.4 with CSS variables (HSL color system)

- **State Management:** TanStack React Query 5.x for data fetching

- **Forms:** React Hook Form + Zod validation

- **Charts:** Recharts

- **Icons:** Lucide React

 

### Backend

- **Database:** Turso (SQLite at the edge)

- **API:** Cloudflare Workers (serverless TypeScript API)

- **Authentication:** Stack Auth with webhook-based user mirroring from FrostGuard

- **API Integration:** The Things Network (TTN) v3 HTTP API

- **Cross-project sync:** FrostGuard webhook synchronization (users and organizations)

 

## Quick Commands

 

```bash

# Development

npm install              # Install dependencies

npm run dev              # Start dev server (port 4146)

 

# Production

npm run build            # Production build

npm run build:dev        # Dev build with source maps

npm run preview          # Preview production build

 

# Linting

npm run lint             # Run ESLint

```

 

## Project Structure

 

```

src/

├── pages/               # Route pages (Index, Login, DeviceEmulator, NotFound)

├── components/

│   ├── ui/              # shadcn-ui component library (Button, Card, Alert, etc.)

│   ├── UserProfile.tsx  # User profile display with logout

│   ├── ProtectedRoute.tsx # Authentication guard

│   └── emulator/        # Emulator-specific components

├── lib/                 # Business logic & utilities

│   ├── stackAuth.ts     # Stack Auth configuration and hooks

│   ├── api.ts           # Cloudflare Workers API client

│   ├── db.ts            # Turso database client

│   ├── types.ts         # TypeScript type definitions

│   ├── debugLogger.ts   # Debug logging system

│   └── utils.ts         # Utility functions (cn, etc.)

└── hooks/               # Custom React hooks



workers/

├── api/

│   └── index.ts         # Cloudflare Workers API (devices, TTN, webhooks)

└── wrangler.toml        # Workers configuration



db/

└── schema.sql           # SQLite database schema

```

 

## Key Files & Entry Points



| File | Purpose |

|------|---------|

| `src/lib/stackAuth.ts` | Stack Auth configuration, useStackAuth() hook |

| `src/pages/Login.tsx` | Custom industrial-themed login page (154 LOC) |

| `src/components/UserProfile.tsx` | User profile display with logout (49 LOC) |

| `src/components/ProtectedRoute.tsx` | Authentication guard for protected routes (37 LOC) |

| `src/lib/api.ts` | Cloudflare Workers API client with JWT auth (213 LOC) |

| `workers/api/index.ts` | Workers API with JWT verification and webhooks (500+ LOC) |

| `db/schema.sql` | Complete database schema (organizations, devices, telemetry, TTN settings) |

 

## Coding Conventions

 

### TypeScript

- Use strict typing, especially in critical paths (RLS, TTN operations)

- Define interfaces for all data shapes

- Use discriminated unions for state management

- Types are auto-generated from Supabase schema in `src/integrations/supabase/types.ts`

 

### React Patterns

- Functional components with hooks only (no class components)

- Custom hooks for cross-cutting concerns (prefix: `use*`)

- React Query for server state management

- Error Boundary for error handling

- Hash-based routing with React Router

 

### Styling

- Tailwind CSS utility-first approach

- CSS variables in HSL format (defined in `src/index.css`)

- Use `cn()` utility from `src/lib/utils.ts` for conditional classes

- Dark mode support via CSS class

 

### Naming

- **Components:** PascalCase (`DeviceManager.tsx`)

- **Functions/Variables:** camelCase

- **Constants:** UPPER_SNAKE_CASE

- **Hooks:** `use*` prefix

- **Log Events:** UPPER_SNAKE_CASE (`TTN_CONFIG_LOADED`)

 

## Architecture Notes

 

### Multi-Tenant Design

- **Stack Auth integration** with webhook-based user mirroring from FrostGuard

- **JWT-based authentication** with organizationId in client_metadata

- **Organization-scoped data** - all API requests filtered by organizationId from JWT

- **Webhook sync** - FrostGuard pushes user/org changes to emulator endpoints

- **Database isolation** - Organizations table with frostguard_org_id for mapping

 

### TTN Configuration Flow

1. Canonical config pulled from FrostGuard via `fetch-org-state` edge function

2. Local draft config for UI edits (stored in sessionStorage)

3. Conflict resolution: local dirty tracking prevents overwrites

4. Two sources: `synced_users.ttn` (user-level) + `ttn_settings` (org-level fallback)

 

### State Management

- `ttnConfigStore.ts` - Centralized config with listener pattern

- Session storage for TTN config persistence

- React Query for server state

- Props-based composition for local state

 

## Cloudflare Workers API



All API endpoints are in `workers/api/index.ts`. Key patterns:

- **JWKS-based JWT verification** using jose library

- **CORS headers** on all responses

- **Organization scoping** - extract organizationId from JWT claims

- **Turso database client** for SQLite edge database

- **Webhook security** - verify FROSTGUARD_WEBHOOK_SECRET header



### API Endpoints

| Endpoint | Purpose |

|----------|---------|

| `GET /api/devices` | List devices for user's organization |

| `POST /api/devices` | Create new device |

| `PUT /api/devices/:id` | Update device |

| `DELETE /api/devices/:id` | Delete device |

| `GET /api/devices/:id/telemetry` | Get device telemetry data |

| `POST /api/ttn/simulate/:id` | Simulate TTN uplink for device |

| `GET /api/ttn-settings` | Get organization's TTN settings |

| `POST /api/ttn-settings` | Create/update TTN settings |

| `POST /api/ttn-settings/test` | Test TTN API connection |

| `POST /api/sync/organization` | Webhook: Sync organization from FrostGuard |

| `POST /api/sync/user` | Webhook: Create Stack Auth user from FrostGuard |

| `GET /health` | Health check endpoint |

 

## Known Issues & Technical Debt

 

### Important (P1)

- **Stack Auth project setup required** - Users must create Stack Auth project and configure webhooks

- **FrostGuard webhook integration** - Requires FrostGuard to implement webhook endpoints

- **Organization scoping enforcement** - Need to verify all API endpoints filter by organizationId

- **Error handling** - Improve error messages for webhook failures and JWT verification



### Nice-to-Have (P2)

- **Code splitting** - Bundle size is 990KB, consider dynamic imports

- **Monitoring** - Add logging/monitoring for webhook calls

- **User management UI** - Admin interface to manage users and orgs

- **Testing** - Add unit and integration tests for Workers API

 

## Testing

 

**No testing framework is currently configured.** All testing is manual.

 

If adding tests:

- Recommend Vitest for unit tests (Vite-native)

- React Testing Library for component tests

- Consider Playwright for E2E tests

 

## Environment Variables



**Frontend (.env):**

```

# Stack Auth

VITE_STACK_PROJECT_ID=<your-stack-project-id>

VITE_STACK_PUBLISHABLE_CLIENT_KEY=<your-stack-publishable-key>



# Cloudflare Workers API

VITE_API_BASE_URL=http://localhost:8787



# Turso Database (optional for local dev)

VITE_TURSO_DATABASE_URL=file:local.db

VITE_TURSO_AUTH_TOKEN=

```



**Workers API (Cloudflare secrets):**

```

STACK_PROJECT_ID=<your-stack-project-id>

STACK_SECRET_SERVER_KEY=<your-stack-secret-server-key>

FROSTGUARD_WEBHOOK_SECRET=<generate-strong-random-secret>

TURSO_DATABASE_URL=<your-turso-url>

TURSO_AUTH_TOKEN=<your-turso-token>

```

 

## Development Tips

 

1. **Path alias:** Use `@/` to import from `src/` (e.g., `@/components/ui/button`)

2. **Debug logging:** Use `debugLogger` from `@/lib/debugLogger` for consistent logging

3. **Error messages:** Use `errorExplainer` from `@/lib/errorExplainer` for user-friendly TTN errors

4. **UI components:** Check `src/components/ui/` before creating new components - shadcn has 30+ ready to use

5. **Stack Auth:** Use `useStackAuth()` hook from `@/lib/stackAuth` to get user info and auth state

6. **Database schema:** Update `db/schema.sql` and run migrations on Turso when making schema changes

 

## Related Documentation



- `README.md` - Basic setup instructions and quick start guide

- `STACK_AUTH_IMPLEMENTATION.md` - Complete Stack Auth setup, webhook integration, and testing

- `TURSO_MIGRATION.md` - Details on Supabase to Turso migration

- `TTN_SYNC_SETUP.md` - Detailed TTN integration guide (to be created)

- `db/schema.sql` - Complete database schema with comments