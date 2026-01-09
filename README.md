# FrostGuard LoRaWAN Device Emulator 🚀

[![CI/CD](https://github.com/your-org/frostguard-emulator/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-org/frostguard-emulator/actions/workflows/ci-cd.yml)
[![Coverage](https://codecov.io/gh/your-org/frostguard-emulator/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/frostguard-emulator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

A **production-ready** full-stack development and testing tool for The Things Network (TTN) integration. Web-based simulator for LoRaWAN sensors with enterprise-grade architecture featuring Redux state management, comprehensive testing, and cloud-native deployment.

## 🎯 Overview

**Purpose:** Simulate temperature, humidity, and door sensors in refrigerator/freezer monitoring scenarios, integrating with TTN's LoRaWAN network infrastructure.

**Production Features:**
- 🔄 **Real-time state management** with Redux Toolkit + WebSocket middleware
- 🛡️ **Role-based access control** with enhanced authentication flows
- 📊 **Performance monitoring** with Core Web Vitals tracking
- 🧪 **Comprehensive testing** with Vitest unit tests + Playwright E2E
- 🐳 **Docker containerization** with multi-stage builds
- ⚡ **PWA support** with offline capabilities
- 🔍 **Bundle optimization** with code splitting and lazy loading
- 🚀 **CI/CD pipeline** with GitHub Actions

## 🛠️ Technology Stack

### Frontend (Production-Ready)
- **Core:** React 18.3 + TypeScript 5.8 (strict mode)
- **Build:** Vite 5.4 with SWC compiler + advanced optimizations
- **Routing:** React Router v6 (browser routing for production)
- **State Management:** Redux Toolkit + React Query 5.x
- **UI Framework:** shadcn-ui (Radix UI) + Tailwind CSS 3.4
- **Forms:** React Hook Form + Zod validation
- **Testing:** Vitest + React Testing Library + Playwright
- **Performance:** Web Vitals monitoring + bundle analysis
- **PWA:** Service workers + offline support

### Backend & Infrastructure
- **Database:** Turso (SQLite at the edge)
- **API:** Cloudflare Workers (serverless TypeScript API)
- **Authentication:** Stack Auth + JWT verification
- **Real-time:** WebSocket integration
- **Monitoring:** Performance tracking + error reporting
- **Deployment:** Docker + GitHub Actions CI/CD

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Turso account (free tier available at [turso.tech](https://turso.tech))
- Cloudflare account (free tier available)
- Stack Auth account (free tier available at [stack-auth.com](https://stack-auth.com))
- The Things Network account (optional for full functionality)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd claude-ttn-emulator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure your services:
```env
# Stack Auth Configuration
VITE_STACK_PROJECT_ID=<your-stack-project-id>
VITE_STACK_PUBLISHABLE_CLIENT_KEY=<your-stack-publishable-key>

# Cloudflare Workers API (for local development, use http://localhost:8787)
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev

# Turso Database (for local development, use file:local.db)
VITE_TURSO_DATABASE_URL=libsql://your-database.turso.io
VITE_TURSO_AUTH_TOKEN=your-turso-auth-token
```

**For local development without Turso/Cloudflare:**
```env
VITE_TURSO_DATABASE_URL=file:local.db
VITE_API_BASE_URL=http://localhost:8787
```

4. Set up the database (local SQLite):
```bash
# Create local database from schema
sqlite3 local.db < db/schema.sql
```

5. Start the development servers:

**Frontend:**
```bash
npm run dev
```

**Backend (Cloudflare Workers):**
```bash
cd workers
npx wrangler dev
```

The frontend will be available at `http://localhost:8080` and the API at `http://localhost:8787`

### Production Commands

```bash
# Development
npm run dev              # Start dev server
npm run type-check       # TypeScript checking
npm run lint            # ESLint checking
npm run lint:fix        # Fix linting issues

# Testing
npm run test            # Run unit tests
npm run test:ui         # Run tests with UI
npm run test:coverage   # Run tests with coverage
npm run test:e2e        # Run E2E tests
npm run test:e2e:ui     # Run E2E tests with UI

# Building
npm run build           # Production build
npm run build:dev       # Development build with source maps
npm run build:analyze   # Build with bundle analyzer
npm run preview         # Preview production build
```

### Docker Development

```bash
# Development with Docker
docker-compose --profile dev up

# Production with Docker
docker-compose --profile prod up

# With monitoring stack
docker-compose --profile prod --profile monitoring up
```

## 🏗️ Production Architecture

```
src/
├── pages/               # Route pages with lazy loading
├── components/
│   ├── ui/              # shadcn-ui component library
│   ├── emulator/        # Feature-specific components
│   ├── ErrorBoundary.tsx    # Production error handling
│   ├── GlobalToaster.tsx    # Toast notification system
│   ├── PerformanceMonitor.tsx # Web Vitals tracking
│   └── ProtectedRoute.tsx   # Enhanced auth protection
├── store/               # Redux Toolkit store
│   ├── index.ts         # Store configuration
│   ├── slices/          # State slices
│   │   ├── authSlice.ts     # Authentication state
│   │   ├── devicesSlice.ts  # Device management
│   │   ├── ttnConfigSlice.ts # TTN configuration
│   │   └── uiSlice.ts       # UI state management
│   └── middleware/      # Custom middleware
│       ├── websocketMiddleware.ts # Real-time updates
│       └── persistenceMiddleware.ts # State persistence
├── lib/                 # Business logic & utilities
│   ├── api.ts           # Enhanced API client with error handling
│   ├── stackAuth.ts     # Stack Auth + JWT verification
│   ├── types.ts         # Complete type definitions
│   └── utils.ts         # Utility functions
├── hooks/               # Custom React hooks
├── test/                # Testing utilities
│   ├── setup.ts         # Vitest configuration
│   └── utils.tsx        # Test helpers
└── __tests__/           # Unit and integration tests

# Production Infrastructure
docker-compose.yml       # Multi-environment containers
Dockerfile              # Multi-stage production build
nginx.conf              # Production web server config
.github/workflows/      # CI/CD pipelines
  └── ci-cd.yml         # Automated testing & deployment
e2e/                    # Playwright E2E tests
playwright.config.ts    # E2E test configuration
vitest.config.ts        # Unit test configuration

# Database & API
db/
└── schema.sql          # Complete database schema

workers/
├── api/
│   └── index.ts        # Production-ready Cloudflare Workers API
└── wrangler.toml       # Workers configuration
```

## ✨ Production Features

### Core Functionality
- 📱 **Device Management:** Full CRUD operations with real-time updates
- 📊 **Telemetry Simulation:** Real-time sensor data generation and visualization  
- 🌐 **TTN Integration:** Complete webhook and API integration with The Things Network
- 🏢 **Multi-tenant Support:** Organization-scoped data with role-based access control
- 📈 **Data Visualization:** Interactive charts and historical data analysis
- 🚨 **Alert System:** Configurable alerts and notifications

### Production Enhancements
- 🔄 **State Management:** Redux Toolkit with optimistic updates and error handling
- ⚡ **Real-time Updates:** WebSocket integration with automatic reconnection
- 🛡️ **Security:** JWT verification, RBAC, input validation, and CORS protection
- 📱 **PWA Support:** Offline functionality and app-like experience
- 🎯 **Performance:** Code splitting, lazy loading, and Web Vitals monitoring
- 🧪 **Testing:** 80%+ code coverage with unit, integration, and E2E tests
- 🐳 **DevOps:** Docker containerization with CI/CD pipeline

## 🚀 Development

### State Management Architecture

The application uses Redux Toolkit for predictable state management:

```typescript
// Using typed hooks
import { useAppSelector, useAppDispatch } from '@/store'
import { fetchDevices, selectDevices } from '@/store/slices/devicesSlice'

function DeviceList() {
  const dispatch = useAppDispatch()
  const devices = useAppSelector(selectDevices)
  
  useEffect(() => {
    dispatch(fetchDevices())
  }, [dispatch])
  
  return <div>{/* Component logic */}</div>
}
```

### Error Handling

Production-grade error boundaries and error reporting:

```typescript
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '@/components/ErrorBoundary'

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <YourComponent />
</ErrorBoundary>
```

### Performance Monitoring

Built-in performance tracking with Web Vitals:

```typescript
import { usePerformanceTracking } from '@/components/PerformanceMonitor'

function MyComponent() {
  const { startMark, endMark } = usePerformanceTracking()
  
  useEffect(() => {
    startMark('component-mount')
    // Component logic
    endMark('component-mount')
  }, [])
}
```

### Path Aliases & Code Organization

```typescript
// Enhanced path aliases for better organization
import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/store'
import { selectUser } from '@/store/slices/authSlice'
import { apiClient } from '@/lib/api'
```

## Turso Database Setup

### Local Development (SQLite)

For local development, the project uses a local SQLite database:

```bash
# Create database from schema
sqlite3 local.db < db/schema.sql

# Set in .env
VITE_TURSO_DATABASE_URL=file:local.db
```

### Production (Turso Cloud)

1. Create a Turso database:
   ```bash
   # Install Turso CLI (Linux/macOS/WSL)
   curl -sSfL https://get.tur.so/install.sh | bash

   # Or use the web dashboard at https://turso.tech
   ```

2. Create and configure database:
   ```bash
   turso db create frostguard-db
   turso db show frostguard-db  # Get the URL
   turso db tokens create frostguard-db  # Get auth token
   ```

3. Apply schema:
   ```bash
   turso db shell frostguard-db < db/schema.sql
   ```

4. Update `.env` with Turso credentials

## Cloudflare Workers Deployment

### Local Development

```bash
cd workers
npx wrangler dev  # Runs on http://localhost:8787
```

### Production Deployment

```bash
cd workers
wrangler login
wrangler secret put TURSO_DATABASE_URL
wrangler secret put TURSO_AUTH_TOKEN
wrangler deploy
```

## Stack Auth Setup

Stack Auth is used for authentication with webhook-based user mirroring from FrostGuard.

**Quick Setup:**

1. Create account at [stack-auth.com](https://stack-auth.com)
2. Create a new project
3. Enable password authentication
4. Configure allowed redirect URLs:
   - Local: `http://localhost:4145/`
   - GitHub Pages: `https://<username>.github.io/claude-ttn-emulator/`
5. Copy Project ID and Publishable Client Key to `.env`
6. Set up webhook endpoints in FrostGuard to sync users/organizations

**Detailed Documentation:**
See `STACK_AUTH_IMPLEMENTATION.md` for complete setup instructions, webhook integration, and testing guide.

## GitHub Pages Deployment

The app is automatically deployed to GitHub Pages on push to `main` or `master`.

### Enabling Authentication on GitHub Pages

By default, GitHub Pages runs in **demo mode** (no authentication). To enable Stack Auth:

1. **Go to your GitHub repository settings:**
   - Navigate to `Settings` → `Secrets and variables` → `Actions`

2. **Add the following Repository Secrets:**

   | Secret Name | Description |
   |-------------|-------------|
   | `VITE_STACK_PROJECT_ID` | Your Stack Auth project UUID (from Stack Auth dashboard) |
   | `VITE_STACK_PUBLISHABLE_CLIENT_KEY` | Your Stack Auth publishable client key |

3. **Configure Stack Auth redirect URLs:**
   - In your Stack Auth project dashboard, add the GitHub Pages URL to trusted domains:
   - `https://<username>.github.io/claude-ttn-emulator/`

4. **Trigger a new deployment:**
   - Push a commit to `main`/`master`, or
   - Go to `Actions` → `Deploy to GitHub Pages` → `Run workflow`

5. **Verify deployment:**
   - Visit `https://<username>.github.io/claude-ttn-emulator/`
   - The login form should appear (not "Demo Mode" message)

### Optional: API Configuration for GitHub Pages

For full functionality with backend API, also add these secrets:

| Secret Name | Description |
|-------------|-------------|
| `VITE_API_BASE_URL` | Your Cloudflare Workers API URL |
| `VITE_TURSO_DATABASE_URL` | Turso database URL (libsql://...) |
| `VITE_TURSO_AUTH_TOKEN` | Turso authentication token |

## Documentation

- `CLAUDE.md` - Comprehensive project context for AI assistants
- `STACK_AUTH_IMPLEMENTATION.md` - Complete Stack Auth setup and webhook integration guide
- `TURSO_MIGRATION.md` - Details on Supabase to Turso migration
- `TTN_SYNC_SETUP.md` - TTN integration guide (to be created)
- `db/schema.sql` - Complete database schema with comments

## Contributing

This project follows strict TypeScript typing and React best practices:

- Use functional components with hooks only
- Implement proper error boundaries
- Follow naming conventions (see CLAUDE.md)
- Use React Query for server state
- Implement application-level multi-tenant security (organization_id filtering)
- All database queries must include organization context for data isolation

## License

[Specify your license here]

## Support

For issues, questions, or contributions, please refer to the project's issue tracker.
