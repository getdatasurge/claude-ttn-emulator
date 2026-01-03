# FrostGuard LoRaWAN Device Emulator - Completion Plan
**Created:** 2026-01-03
**Status:** Final Sprint to Production
**Current Completion:** 92% (Core features complete, authentication pending)

---

## Executive Summary

Based on review of CLAUDE.md, CLAUDE_PRD.md, and MAIN-APP-SCHEMA.md, the FrostGuard LoRaWAN Device Emulator is nearly complete with all core functionality implemented. The remaining 8% involves critical authentication, production deployment, and integration with the Claude Chrome Extension.

---

## Gap Analysis

### ✅ Completed Features (92%)
1. **Frontend Components**
   - React 18 + TypeScript + Vite setup
   - shadcn-ui component library integrated
   - Device management UI (DeviceManager, TTNEmulator)
   - Telemetry visualization (TelemetryChart with Recharts)
   - TTN configuration UI (WebhookSettings)
   - Redux store with slices for state management

2. **Backend Services**
   - Cloudflare Workers API with 12 endpoints
   - Turso SQLite database integration
   - TTN v3 API integration
   - Device CRUD operations
   - Telemetry simulation and storage
   - WebSocket middleware for real-time updates

3. **Core Business Logic**
   - TTN payload encoding/decoding
   - Device simulation with realistic sensor data
   - Multi-device type support (temperature, humidity, door)
   - Polling mechanism for real-time updates

### ❌ Missing Critical Features (8%)

1. **Authentication & Security**
   - Stack Auth integration not implemented
   - JWT verification using mock data
   - No actual login/signup UI
   - Protected routes not enforced
   - No user session management

2. **Multi-tenancy & RBAC**
   - Organization scoping not enforced
   - No role-based access control
   - User profiles not connected
   - FrostGuard webhook sync not implemented

3. **Production Readiness**
   - Environment variables not configured
   - No production deployment setup
   - Missing monitoring and error tracking
   - No CI/CD pipeline

4. **Claude Chrome Extension**
   - Not integrated or configured
   - No context awareness setup

---

## Implementation Priorities

### Phase 1: Authentication Foundation (P0 - Blocker)
**Timeline:** 4-6 hours
**Why Critical:** No security = can't deploy to production

1. **Stack Auth Setup**
   - Create Stack Auth project
   - Configure environment variables
   - Install @stackframe/react and jose

2. **Frontend Auth Implementation**
   - Wrap app with StackProvider
   - Create Login/Signup pages
   - Implement ProtectedRoute component
   - Add UserButton to header

3. **Backend JWT Verification**
   - Implement JWKS-based JWT verification
   - Extract organizationId from tokens
   - Update all API endpoints to use real auth

### Phase 2: Multi-tenant Organization Support (P1)
**Timeline:** 2-3 hours
**Why Critical:** Data isolation for multiple customers

1. **Database Updates**
   - Add organization mapping table
   - Update queries with organizationId filtering
   - Implement proper RLS-style filtering

2. **FrostGuard Integration**
   - Webhook endpoints for user/org sync
   - Organization creation on team setup
   - User profile synchronization

3. **UI Updates**
   - Team switcher component
   - Organization context in all operations
   - Scoped data display

### Phase 3: Role-Based Access Control (P1)
**Timeline:** 2-3 hours
**Why Critical:** Permission management per MAIN-APP-SCHEMA.md

1. **Role Implementation**
   - Implement role hierarchy (owner, admin, manager, staff, viewer, inspector)
   - Add role checks to API endpoints
   - Frontend permission guards

2. **Permission Matrix**
   - Device management (admin+)
   - TTN settings (admin+)
   - Telemetry viewing (all roles)
   - Export capabilities (manager+, inspector)

### Phase 4: Claude Chrome Extension Integration (P2)
**Timeline:** 1-2 hours
**Why Important:** Enhanced developer experience

1. **Extension Setup**
   - Install Claude Chrome Extension
   - Configure project context
   - Set up quick actions

2. **Integration Points**
   - Code generation helpers
   - Documentation lookup
   - Quick debugging

### Phase 5: Production Deployment (P0)
**Timeline:** 3-4 hours
**Why Critical:** Make application accessible

1. **Environment Configuration**
   - Production environment variables
   - Turso production database
   - Cloudflare Workers deployment

2. **Deployment Pipeline**
   - GitHub Actions CI/CD
   - Automated testing
   - Production monitoring

3. **Documentation**
   - Deployment guide
   - API documentation
   - User manual

---

## Technical Implementation Details

### Stack Auth Integration Steps

```typescript
// 1. Install dependencies
npm install @stackframe/react jose

// 2. Create stackAuth.ts
import { StackClientApp } from '@stackframe/react'

export const stackClientApp = new StackClientApp({
  projectId: import.meta.env.VITE_STACK_PROJECT_ID,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  tokenStore: 'cookie',
})

// 3. Update App.tsx
<StackProvider app={stackClientApp}>
  <StackTheme>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/emulator" element={
          <ProtectedRoute>
            <DeviceEmulator />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  </StackTheme>
</StackProvider>

// 4. Backend JWT verification
import * as jose from 'jose'

async function verifyAuth(request: Request, env: Env) {
  const token = request.headers.get('Authorization')?.substring(7)
  const jwks = jose.createRemoteJWKSet(new URL(jwksUrl))
  const { payload } = await jose.jwtVerify(token, jwks)
  
  return {
    userId: payload.sub,
    organizationId: payload.team_id || payload.sub,
    role: payload.role || 'viewer'
  }
}
```

### FrostGuard Webhook Integration

```typescript
// Webhook endpoint for user/org sync
router.post('/api/sync/organization', async (request, env) => {
  const secret = request.headers.get('X-Webhook-Secret')
  if (secret !== env.FROSTGUARD_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const { organization, users } = await request.json()
  
  // Create or update organization
  await db.execute({
    sql: 'INSERT OR REPLACE INTO organizations ...',
    args: [organization.id, organization.name]
  })
  
  // Sync users via Stack Auth API
  for (const user of users) {
    await stackAuth.createOrUpdateUser(user)
  }
})
```

### Role-Based Access Control

```typescript
// Role hierarchy from MAIN-APP-SCHEMA.md
enum Role {
  OWNER = 'owner',
  ADMIN = 'admin', 
  MANAGER = 'manager',
  STAFF = 'staff',
  VIEWER = 'viewer',
  INSPECTOR = 'inspector'
}

// Permission checks
function canManageDevices(role: Role): boolean {
  return [Role.OWNER, Role.ADMIN].includes(role)
}

function canExportData(role: Role): boolean {
  return [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.INSPECTOR].includes(role)
}

// API endpoint protection
router.post('/api/devices', async (request, env) => {
  const { role } = await verifyAuth(request, env)
  
  if (!canManageDevices(role)) {
    return new Response('Forbidden', { status: 403 })
  }
  
  // Create device...
})
```

---

## Success Metrics

### Technical Metrics
- [ ] All TypeScript errors resolved
- [ ] Bundle size < 500KB (currently 248KB ✅)
- [ ] API response time < 500ms
- [ ] 100% of endpoints authenticated
- [ ] Zero security vulnerabilities

### Functional Metrics
- [ ] Users can sign up and log in
- [ ] Devices scoped to organizations
- [ ] TTN simulation working end-to-end
- [ ] Real-time telemetry updates
- [ ] Role-based permissions enforced

### Business Metrics
- [ ] Multi-tenant isolation working
- [ ] FrostGuard integration complete
- [ ] Production deployment successful
- [ ] Documentation complete

---

## Risk Mitigation

### Risk 1: Stack Auth Complexity
**Mitigation:** Follow the detailed STACK_AUTH_PLAN.md already created

### Risk 2: Breaking Changes
**Mitigation:** Git commits at each milestone, comprehensive testing

### Risk 3: Performance Issues
**Mitigation:** Already optimized with code splitting and lazy loading

### Risk 4: Deployment Issues
**Mitigation:** Test in staging environment first

---

## Timeline Summary

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Stack Auth Integration | 4-6h | P0 |
| 2 | Multi-tenant Support | 2-3h | P1 |
| 3 | RBAC Implementation | 2-3h | P1 |
| 4 | Claude Extension | 1-2h | P2 |
| 5 | Production Deployment | 3-4h | P0 |
| **Total** | **Complete Project** | **12-18h** | - |

---

## Next Immediate Actions

1. ✅ Review this plan
2. 🚀 Start Stack Auth integration (Task 1)
3. 📝 Update implement/state.json with progress
4. 🧪 Test each phase before moving to next
5. 📦 Deploy to production
6. 📚 Complete documentation

---

## Command Sequence

```bash
# 1. Install Stack Auth
npm install @stackframe/react jose

# 2. Set up environment
cp .env.example .env
# Edit .env with Stack Auth credentials

# 3. Update frontend auth
# Implement login/signup pages

# 4. Update backend auth
# Add JWT verification

# 5. Test authentication
npm run dev
# Test login flow

# 6. Deploy
npm run build
npx wrangler deploy

# 7. Verify production
curl https://api.frostguard.workers.dev/health
```

This plan provides a clear path to 100% completion with production-ready authentication, multi-tenancy, and all requirements from the documentation fulfilled.