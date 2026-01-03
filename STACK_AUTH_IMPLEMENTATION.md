# Stack Auth Implementation Guide

## Overview

This document describes the Stack Auth integration with webhook-based user mirroring from FrostGuard.

**Architecture:** FrostGuard (main app with Supabase Auth) → Webhook → Emulator (Stack Auth)

## Implementation Summary

### ✅ Completed Components

#### 1. Frontend Authentication
- **Stack Auth SDK**: `@stackframe/react` v2.8.56
- **Configuration**: `src/lib/stackAuth.ts`
- **Custom Login Page**: `src/pages/Login.tsx` (industrial-themed, cyan/amber aesthetic)
- **Protected Routes**: `src/components/ProtectedRoute.tsx`
- **App Integration**: Wrapped with `StackProvider` and `StackTheme`

#### 2. Webhook Endpoints (Cloudflare Workers)
Created in `workers/api/index.ts`:

**POST /api/sync/organization**
- Syncs organization data from FrostGuard
- Creates/updates organizations table
- Handles soft deletes via `deleted_at` field
- Security: Verifies `FROSTGUARD_WEBHOOK_SECRET`

**POST /api/sync/user**
- Creates Stack Auth users via REST API
- Stores FrostGuard user metadata in JWT `client_metadata`
- Returns Stack Auth user ID for tracking
- Security: Verifies `FROSTGUARD_WEBHOOK_SECRET`

#### 3. JWT Verification
- Implemented JWKS-based verification using `jose` library
- Caches JWKS for performance
- Extracts user metadata: `userId`, `organizationId`, `role`, `frostguardUserId`
- Validates issuer and audience

#### 4. Database Schema
Updated `db/schema.sql`:
```sql
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,              -- FrostGuard org UUID
  frostguard_org_id TEXT UNIQUE,    -- Reference to FrostGuard
  name TEXT NOT NULL,
  slug TEXT,                        -- URL-friendly identifier
  ttn_app_id TEXT,                  -- TTN application ID
  deleted_at INTEGER,               -- Soft delete timestamp
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
```

#### 5. API Client
Updated `src/lib/api.ts`:
- Uses `stackClientApp.getUser()` to retrieve current user
- Calls `user.getAuthJson()` to get access token
- Automatically attaches `Authorization: Bearer <token>` header

#### 6. UI Components
Created `src/components/ui/alert.tsx`:
- Alert, AlertTitle, AlertDescription
- Supports variants: default, destructive
- Uses class-variance-authority for styling

---

## Configuration Required

### 1. Stack Auth Project Setup

1. **Create Stack Auth project** at https://app.stack-auth.com
2. **Configure project settings:**
   - Enable password authentication
   - Set allowed redirect URLs (e.g., `http://localhost:4146/`)
   - Configure token expiration

3. **Copy credentials:**
   - Project ID
   - Publishable Client Key
   - Secret Server Key

### 2. Environment Variables

#### Frontend (.env)
```bash
VITE_STACK_PROJECT_ID=<your-stack-project-id>
VITE_STACK_PUBLISHABLE_CLIENT_KEY=<your-stack-publishable-key>
VITE_API_BASE_URL=http://localhost:8787
```

#### Workers API (.env or Cloudflare secrets)
```bash
STACK_PROJECT_ID=<your-stack-project-id>
STACK_SECRET_SERVER_KEY=<your-stack-secret-server-key>
FROSTGUARD_WEBHOOK_SECRET=<generate-strong-random-secret>
TURSO_DATABASE_URL=<your-turso-url>
TURSO_AUTH_TOKEN=<your-turso-token>
```

### 3. FrostGuard Webhook Integration

Add webhooks to FrostGuard to call the emulator endpoints when users/orgs are created:

#### Organization Sync Webhook
**Trigger:** When organization is created/updated/deleted in FrostGuard

**Endpoint:** `POST https://your-emulator.workers.dev/api/sync/organization`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-webhook-secret": "<FROSTGUARD_WEBHOOK_SECRET>"
}
```

**Payload:**
```json
{
  "id": "uuid-from-frostguard",
  "name": "Organization Name",
  "slug": "organization-name",
  "ttn_application_id": "ttn-app-id",
  "deleted_at": null
}
```

#### User Sync Webhook
**Trigger:** When user is created in FrostGuard

**Endpoint:** `POST https://your-emulator.workers.dev/api/sync/user`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-webhook-secret": "<FROSTGUARD_WEBHOOK_SECRET>"
}
```

**Payload:**
```json
{
  "user_id": "uuid-from-frostguard",
  "email": "user@example.com",
  "full_name": "User Name",
  "organization_id": "org-uuid",
  "role": "admin"
}
```

**Response on success:**
```json
{
  "success": true,
  "stackUserId": "stack-auth-user-id"
}
```

---

## Testing the Integration

### 1. Manual Testing

#### Test Login Flow
1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:4146/#/`
3. Click on protected route `/emulator` → Should redirect to `/login`
4. Try to sign in (will fail without Stack Auth project setup)

#### Test Webhook Endpoints

**Create Organization:**
```bash
curl -X POST http://localhost:8787/api/sync/organization \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret" \
  -d '{
    "id": "test-org-123",
    "name": "Test Organization",
    "slug": "test-org",
    "ttn_application_id": "ttn-test-app"
  }'
```

**Create User:**
```bash
curl -X POST http://localhost:8787/api/sync/user \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret" \
  -d '{
    "user_id": "test-user-123",
    "email": "test@example.com",
    "full_name": "Test User",
    "organization_id": "test-org-123",
    "role": "admin"
  }'
```

### 2. End-to-End Testing

1. **Setup Stack Auth project** with credentials in .env
2. **Create test user in FrostGuard**
3. **Verify webhook fires** and creates user in Stack Auth
4. **Test login** in emulator with FrostGuard credentials
5. **Verify JWT verification** works in API calls
6. **Test protected routes** and authentication flow

---

## Security Considerations

### Webhook Secret
- Generate a strong random secret (32+ characters)
- Store securely in environment variables
- Verify on every webhook request
- Rotate periodically

### JWT Verification
- JWKS URL is cached for performance
- Tokens are verified with issuer and audience claims
- Token expiration is enforced by Stack Auth
- Invalid tokens return 401 Unauthorized

### User Metadata
The following data is stored in JWT `client_metadata`:
- `frostguardUserId`: Original FrostGuard user UUID
- `organizationId`: Organization UUID for multi-tenancy
- `role`: User role (owner, admin, manager, staff, viewer, inspector)

This metadata is used for authorization in the Workers API.

---

## Deployment Checklist

- [ ] Create Stack Auth project
- [ ] Configure Stack Auth settings (redirects, auth methods)
- [ ] Set frontend environment variables (.env)
- [ ] Set Workers environment variables (Cloudflare secrets)
- [ ] Deploy Workers API to Cloudflare
- [ ] Configure FrostGuard webhooks
- [ ] Test organization sync webhook
- [ ] Test user sync webhook
- [ ] Test login flow
- [ ] Verify JWT verification in API calls
- [ ] Test protected routes
- [ ] Update README with Stack Auth setup instructions

---

## Troubleshooting

### Login fails with "Sign in failed"
- Verify Stack Auth project ID and publishable key
- Check browser console for errors
- Ensure Stack Auth project has password auth enabled
- Verify user exists in Stack Auth (check dashboard)

### Webhook returns 401 Unauthorized
- Check `x-webhook-secret` header matches environment variable
- Verify secret is set in Workers environment
- Check Cloudflare Workers logs for errors

### JWT verification fails
- Verify `STACK_PROJECT_ID` matches Stack Auth project
- Check token is being sent in `Authorization: Bearer` header
- Verify JWKS URL is accessible
- Check Cloudflare Workers logs for verification errors

### API calls return 401
- Verify user is logged in
- Check `getAuthHeaders()` is returning token
- Verify JWT is valid and not expired
- Check Workers JWT verification logic

---

## Next Steps

1. **Complete Stack Auth project setup**
2. **Configure FrostGuard webhooks** to call emulator endpoints
3. **Test full user sync flow** from FrostGuard to emulator
4. **Add user profile display** in emulator header
5. **Implement logout functionality**
6. **Add organization switcher** for users with multiple orgs
7. **Create deployment documentation**
8. **Add error logging and monitoring**

---

## Technical Details

### Stack Auth SDK Methods Used

```typescript
// In React components (hook)
const user = stackClientApp.useUser()

// In non-component code (async)
const user = await stackClientApp.getUser()

// Sign in
const result = await stackClientApp.signInWithCredential({ email, password })

// Get auth token
const authJson = await user.getAuthJson()
const token = authJson.accessToken
```

### JWT Claims Structure

```json
{
  "sub": "stack-auth-user-id",
  "iss": "https://api.stack-auth.com",
  "aud": "stack-project-id",
  "exp": 1234567890,
  "client_metadata": {
    "frostguardUserId": "frostguard-user-uuid",
    "organizationId": "org-uuid",
    "role": "admin"
  }
}
```

### Database Relationships

```
organizations
  ├─ id (PK) = frostguard_org_id
  ├─ frostguard_org_id (UNIQUE)
  └─ ttn_app_id

devices
  ├─ organization_id (FK → organizations.id)
  └─ ...

ttn_settings
  ├─ organization_id (FK → organizations.id)
  └─ ...
```

---

## Files Modified/Created

### Created
- `src/lib/stackAuth.ts` - Stack Auth configuration
- `src/pages/Login.tsx` - Custom login page
- `src/components/ProtectedRoute.tsx` - Auth guard
- `src/components/ui/alert.tsx` - Alert component
- `STACK_AUTH_IMPLEMENTATION.md` - This document

### Modified
- `src/App.tsx` - Wrapped with Stack Auth providers
- `src/lib/api.ts` - Updated to use Stack Auth tokens
- `workers/api/index.ts` - Added webhook endpoints and JWT verification
- `db/schema.sql` - Updated organizations table
- `package.json` - Added Stack Auth dependencies

---

**Implementation Status:** ✅ Complete - Ready for Stack Auth project configuration and webhook integration testing.
