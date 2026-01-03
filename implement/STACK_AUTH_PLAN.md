# Stack Auth Integration Plan
**Created:** 2026-01-03
**Status:** Ready to implement
**Goal:** Replace FusionAuth placeholders with Stack Auth for production-ready authentication

---

## Overview

Stack Auth is an open-source authentication platform that provides:
- Pre-built React components (SignIn, SignUp, UserButton)
- JWT-based authentication with JWKS verification
- Multi-tenant support (teams/organizations)
- Cookie-based token storage
- Simple SDK integration

**Key Advantages:**
- ✅ Open source (can self-host or use managed service)
- ✅ React-first design with hooks
- ✅ Built-in JWT verification via JWKS
- ✅ Multi-tenant support for our organization-scoped data
- ✅ Pre-built UI components
- ✅ No complex OAuth flows needed

---

## Architecture Changes

### Current State (FusionAuth Placeholders)
```
Frontend:
- src/lib/auth.ts → Mock user, no real auth
- No login UI

Backend:
- workers/api/index.ts → verifyAuth() returns mock data
- No JWT verification
```

### Target State (Stack Auth)
```
Frontend:
- Stack Auth SDK installed (@stackframe/react)
- Login/signup components integrated
- User session management via useUser() hook
- Access tokens sent to API via headers

Backend:
- JWT verification via JWKS (jose library)
- Real user ID and organization ID from token
- Role-based access control
```

---

## Implementation Tasks

### Phase 1: Frontend Integration (2-3 hours)

#### Task 1.1: Install Stack Auth SDK
**File:** `package.json`

```bash
npm install @stackframe/react jose
```

**Dependencies:**
- `@stackframe/react` - Client SDK
- `jose` - JWT verification (for backend)

#### Task 1.2: Create Stack Auth Configuration
**File:** `src/lib/stackAuth.ts` (new)

```typescript
import { StackClientApp } from '@stackframe/react'

export const stackClientApp = new StackClientApp({
  projectId: import.meta.env.VITE_STACK_PROJECT_ID,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  tokenStore: 'cookie', // Use cookies for SSR compatibility
})
```

**Environment Variables:**
```env
VITE_STACK_PROJECT_ID=<your-project-id>
VITE_STACK_PUBLISHABLE_CLIENT_KEY=<your-publishable-key>
```

#### Task 1.3: Wrap App with Stack Providers
**File:** `src/App.tsx`

```typescript
import { StackProvider, StackTheme } from '@stackframe/react'
import { stackClientApp } from '@/lib/stackAuth'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StackProvider app={stackClientApp}>
        <StackTheme>
          <HashRouter>
            {/* routes */}
          </HashRouter>
          <Toaster />
        </StackTheme>
      </StackProvider>
    </QueryClientProvider>
  )
}
```

#### Task 1.4: Create Protected Route Component
**File:** `src/components/ProtectedRoute.tsx` (new)

```typescript
import { useUser } from '@stackframe/react'
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

#### Task 1.5: Create Login/Signup Pages
**Files:**
- `src/pages/Login.tsx` (new)
- `src/pages/Signup.tsx` (new)

```typescript
// Login.tsx
import { SignIn } from '@stackframe/react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full">
        <SignIn
          onSignIn={() => navigate('/emulator')}
        />
      </div>
    </div>
  )
}
```

#### Task 1.6: Update Auth Helper
**File:** `src/lib/auth.ts`

```typescript
import { useUser } from '@stackframe/react'

export function useAuth() {
  const user = useUser()

  return {
    user,
    isAuthenticated: !!user,
    userId: user?.id,
    email: user?.primaryEmail,
    organizationId: user?.selectedTeam?.id || user?.id, // Use team or user ID
  }
}

export async function getAuthHeader(): Promise<Record<string, string>> {
  const user = useUser()
  if (!user) return {}

  const authJson = await user.getAuthJson()
  return {
    Authorization: `Bearer ${authJson.accessToken}`,
  }
}
```

#### Task 1.7: Update API Client to Use Stack Auth Tokens
**File:** `src/lib/api.ts`

```typescript
async function apiRequest<T>(endpoint: string, options = {}): Promise<T> {
  // Get fresh access token from Stack Auth
  const user = stackClientApp.useUser()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (user) {
    const authJson = await user.getAuthJson()
    headers['Authorization'] = `Bearer ${authJson.accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })

  // Handle 401 - token expired
  if (response.status === 401) {
    // Stack Auth automatically handles token refresh
    throw new Error('Authentication required')
  }

  return response.json()
}
```

---

### Phase 2: Backend Integration (2-3 hours)

#### Task 2.1: Install JOSE Library for Workers
**File:** `workers/package.json` (create if doesn't exist)

```json
{
  "dependencies": {
    "jose": "^5.0.0"
  }
}
```

Or add to main package.json if using same deps.

#### Task 2.2: Implement JWT Verification
**File:** `workers/api/index.ts`

```typescript
import * as jose from 'jose'

// Cache JWKS for performance
let jwksCache: jose.RemoteJWKSet | null = null

function getJWKS(projectId: string): jose.RemoteJWKSet {
  if (!jwksCache) {
    const jwksUrl = `https://api.stack-auth.com/api/v1/projects/${projectId}/.well-known/jwks.json`
    jwksCache = jose.createRemoteJWKSet(new URL(jwksUrl))
  }
  return jwksCache
}

async function verifyAuth(request: Request, env: Env): Promise<{
  userId: string
  organizationId: string
  role: string
}> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: No token provided')
  }

  const token = authHeader.substring(7)

  try {
    const jwks = getJWKS(env.STACK_PROJECT_ID)
    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: 'https://api.stack-auth.com',
      audience: env.STACK_PROJECT_ID,
    })

    // Extract user info from JWT payload
    const userId = payload.sub as string
    const organizationId = (payload.team_id as string) || userId
    const role = (payload.role as string) || 'viewer'

    console.log('Authenticated user:', {
      userId,
      organizationId,
      role,
    })

    return {
      userId,
      organizationId,
      role,
    }
  } catch (error) {
    console.error('JWT verification failed:', error)
    throw new Error('Unauthorized: Invalid token')
  }
}
```

#### Task 2.3: Update Environment Variables
**File:** `workers/wrangler.toml`

```toml
[env.production]
name = "frostguard-api"
vars = { ENVIRONMENT = "production" }

[env.production.vars]
STACK_PROJECT_ID = "<your-stack-project-id>"

[env.development]
name = "frostguard-api-dev"
vars = { ENVIRONMENT = "development" }

[env.development.vars]
STACK_PROJECT_ID = "<your-stack-project-id>"
```

**File:** `.env.example`

```env
# Frontend - Stack Auth
VITE_STACK_PROJECT_ID=<your-project-id>
VITE_STACK_PUBLISHABLE_CLIENT_KEY=<your-publishable-key>

# Backend - Stack Auth
STACK_PROJECT_ID=<your-project-id>

# Turso Database
VITE_TURSO_DATABASE_URL=libsql://your-database.turso.io
VITE_TURSO_AUTH_TOKEN=your-turso-auth-token

# Cloudflare Workers API
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
```

---

### Phase 3: Multi-Tenant Setup (1-2 hours)

#### Task 3.1: Configure Stack Auth Teams
1. Go to Stack Auth dashboard
2. Enable "Teams" feature
3. Configure team creation settings
4. Set up default roles (admin, manager, viewer)

#### Task 3.2: Update Database Schema for Organizations
**File:** `db/schema.sql`

```sql
-- Add Stack Auth team mapping
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  stack_team_id TEXT UNIQUE, -- Stack Auth team ID
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_organizations_stack_team_id
ON organizations(stack_team_id);
```

#### Task 3.3: Create Organization Sync Endpoint
**File:** `workers/api/index.ts`

```typescript
// Webhook from Stack Auth when team is created
router.post('/webhooks/stack-auth', async (request, env: Env) => {
  const body = await request.json()

  if (body.type === 'team.created') {
    const { team_id, team_name } = body.data

    const db = createDbClient(env)
    await db.execute({
      sql: `INSERT OR IGNORE INTO organizations (id, stack_team_id, name)
            VALUES (?, ?, ?)`,
      args: [team_id, team_id, team_name],
    })
  }

  return jsonResponse({ success: true })
})
```

---

### Phase 4: UI Components (1-2 hours)

#### Task 4.1: Add User Menu to Header
**File:** `src/components/emulator/LoRaWANEmulator.tsx`

```typescript
import { UserButton } from '@stackframe/react'

// In the header section:
<div className="flex items-center justify-between mb-8">
  <div>
    <h1>FrostGuard LoRaWAN Emulator</h1>
  </div>

  <div className="flex items-center gap-4">
    <UserButton />
    <Badge>/* simulation status */</Badge>
    <Button>/* simulation controls */</Button>
  </div>
</div>
```

#### Task 4.2: Add Team Switcher (Multi-tenant)
**File:** `src/components/emulator/LoRaWANEmulator.tsx`

```typescript
import { SelectedTeamSwitcher } from '@stackframe/react'

// Add to header:
<SelectedTeamSwitcher />
```

#### Task 4.3: Update Routes for Auth
**File:** `src/App.tsx`

```typescript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/" element={<Index />} />
  <Route
    path="/emulator"
    element={
      <ProtectedRoute>
        <DeviceEmulator />
      </ProtectedRoute>
    }
  />
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## Testing Checklist

### Frontend Tests
- [ ] User can sign up with email/password
- [ ] User can log in
- [ ] User session persists across page reloads
- [ ] UserButton shows correct user info
- [ ] Protected routes redirect to login when not authenticated
- [ ] Token is sent in API requests
- [ ] Logout works correctly

### Backend Tests
- [ ] JWT verification accepts valid tokens
- [ ] JWT verification rejects invalid tokens
- [ ] JWT verification rejects expired tokens
- [ ] User ID extracted correctly from token
- [ ] Organization ID extracted correctly (team_id)
- [ ] Role extracted correctly
- [ ] All API endpoints protected

### Multi-tenant Tests
- [ ] Different teams see different devices
- [ ] Team switching changes visible data
- [ ] Organization ID filtering works in database queries
- [ ] Team creation webhook creates organization record

---

## Deployment Steps

### 1. Create Stack Auth Project
1. Go to https://stack-auth.com
2. Create new project
3. Copy Project ID and Publishable Client Key
4. Enable Teams feature
5. Configure allowed domains (localhost, production domain)

### 2. Update Environment Variables
```bash
# Frontend (.env)
VITE_STACK_PROJECT_ID=proj_abc123
VITE_STACK_PUBLISHABLE_CLIENT_KEY=pk_abc123

# Backend (Cloudflare Workers secrets)
npx wrangler secret put STACK_PROJECT_ID
```

### 3. Deploy Workers API
```bash
cd workers
npm install jose
npx wrangler deploy
```

### 4. Deploy Frontend
```bash
npm run build
# Deploy dist/ to your hosting (Cloudflare Pages, Vercel, etc.)
```

### 5. Configure Stack Auth Webhooks
1. Go to Stack Auth dashboard → Webhooks
2. Add webhook URL: `https://your-worker.workers.dev/webhooks/stack-auth`
3. Subscribe to: `team.created`, `team.deleted`

---

## Migration from Current State

### No Existing Users
Since we're using mock auth currently, there's no user migration needed. Just:
1. Implement Stack Auth
2. Remove mock auth code
3. Deploy

### Minimal Breaking Changes
- Frontend: Add login flow (no existing users to migrate)
- Backend: JWT verification replaces mock auth (no data migration)
- Database: Organization table already exists

---

## Estimated Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Frontend Integration | 2-3 hours |
| 2 | Backend Integration | 2-3 hours |
| 3 | Multi-tenant Setup | 1-2 hours |
| 4 | UI Components | 1-2 hours |
| **Total** | | **6-10 hours** |

---

## Next Immediate Steps

1. ✅ **Create Stack Auth Account**
   - Sign up at https://stack-auth.com
   - Create project
   - Get credentials

2. ✅ **Install Dependencies**
   ```bash
   npm install @stackframe/react jose
   ```

3. ✅ **Create Stack Auth Config**
   - Create `src/lib/stackAuth.ts`
   - Add environment variables

4. ✅ **Update App.tsx**
   - Add StackProvider and StackTheme

5. ✅ **Create Login Page**
   - Add SignIn component

6. ✅ **Implement JWT Verification**
   - Update `workers/api/index.ts`

7. ✅ **Test End-to-End**
   - Sign up → Create device → Simulate → View telemetry

---

## Resources

- **Stack Auth Docs:** https://docs.stack-auth.com/docs/overview
- **Backend Integration:** https://docs.stack-auth.com/docs/next/concepts/backend-integration
- **JOSE Library:** https://github.com/panva/jose
- **React SDK:** https://www.npmjs.com/package/@stackframe/react

---

## Success Criteria

- [ ] Users can sign up and log in
- [ ] JWT tokens verified on backend
- [ ] Multi-tenant data isolation working
- [ ] No mock auth code remaining
- [ ] All API endpoints protected
- [ ] Tests passing
- [ ] Deployed to production
