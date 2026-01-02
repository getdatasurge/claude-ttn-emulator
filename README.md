# FrostGuard LoRaWAN Device Emulator

A full-stack development and testing tool for The Things Network (TTN) integration. Web-based simulator for LoRaWAN sensors integrated with Supabase backend, designed to test multi-tenant IoT data flow.

## Overview

**Purpose:** Simulate temperature, humidity, and door sensors in refrigerator/freezer monitoring scenarios, integrating with TTN's LoRaWAN network infrastructure.

## Technology Stack

### Frontend
- React 18.3 + TypeScript 5.8
- Vite 5.4 with SWC compiler
- React Router v6 (hash-based routing)
- shadcn-ui (Radix UI components)
- Tailwind CSS 3.4
- TanStack React Query 5.x
- React Hook Form + Zod validation
- Recharts for data visualization
- Lucide React icons

### Backend
- Supabase (PostgreSQL with Row-Level Security)
- Deno-based Edge Functions
- The Things Network (TTN) v3 HTTP API
- FrostGuard API integration

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
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

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build        # Production build
npm run build:dev    # Development build with source maps
npm run preview      # Preview production build
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── pages/               # Route pages (Index, DeviceEmulator, NotFound)
├── components/
│   ├── ui/              # shadcn-ui component library
│   └── emulator/        # Emulator-specific components
├── lib/                 # Business logic & utilities
│   ├── debugLogger.ts   # Debug logging system
│   └── utils.ts         # Utility functions (cn, etc.)
├── hooks/               # Custom React hooks
└── integrations/supabase/ # Supabase client & types

supabase/
├── functions/           # Deno edge functions
└── migrations/          # Database migrations
```

## Key Features (Planned)

- Device provisioning and management
- Real-time telemetry simulation
- TTN webhook integration
- Multi-tenant organization support
- Historical data visualization
- Alert configuration
- FrostGuard API synchronization

## Development

### Path Aliases

The project uses `@/` as an alias for the `src/` directory:

```typescript
import { Button } from '@/components/ui/button'
import { debugLogger } from '@/lib/debugLogger'
```

### Debug Logging

Use the debug logger for consistent logging:

```typescript
import { debugLogger } from '@/lib/debugLogger'

debugLogger.info('USER_LOGIN', { userId: '123' })
debugLogger.error('API_ERROR', error)
```

### Styling

- Tailwind CSS utility-first approach
- CSS variables for theming (defined in `src/index.css`)
- Use `cn()` utility for conditional classes
- Dark mode support via CSS class

## Supabase Setup

This project requires a Supabase project. To set up:

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy the project URL and anon key to your `.env` file
3. (Optional) Install Supabase CLI for local development:
   ```bash
   npm install -g supabase
   ```

### Database Migrations

Migrations will be added as the schema is developed. See `supabase/migrations/README.md` for details.

### Edge Functions

Edge functions will be implemented in `supabase/functions/`. See the functions README for planned functions.

## Documentation

- `CLAUDE.md` - Comprehensive project context for AI assistants
- `CLAUDE_PRD.md` - PRD template and guidelines
- `TTN_SYNC_SETUP.md` - TTN integration guide (to be created)
- `FROSTGUARD_AUDIT_REPORT.md` - Architecture audit (to be created)

## Contributing

This project follows strict TypeScript typing and React best practices:

- Use functional components with hooks only
- Implement proper error boundaries
- Follow naming conventions (see CLAUDE.md)
- Use React Query for server state
- Implement Row-Level Security (RLS) for multi-tenancy

## License

[Specify your license here]

## Support

For issues, questions, or contributions, please refer to the project's issue tracker.
