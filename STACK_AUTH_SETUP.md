# Stack Auth Setup Guide

## Overview

The FrostGuard LoRaWAN Device Emulator uses Stack Auth for authentication and user management. This guide will help you set up your Stack Auth project and configure the application.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Access to Stack Auth dashboard (https://stack-auth.com)

## Step 1: Create Stack Auth Project

1. Go to https://stack-auth.com and sign up/login
2. Click "Create New Project"
3. Enter project details:
   - **Project Name**: FrostGuard Emulator
   - **Project Type**: Web Application
   - **Enable Teams**: Yes (for multi-tenant support)

## Step 2: Configure Authentication Settings

### Basic Configuration

1. Go to **Settings > Authentication**
2. Configure allowed authentication methods:
   - ✅ Email/Password
   - ✅ Magic Link (optional)
   - ✅ OAuth Providers (optional)

### Security Settings

1. Go to **Settings > Security**
2. Configure:
   - **Session Duration**: 7 days
   - **Require Email Verification**: Yes
   - **Password Requirements**: 
     - Minimum 8 characters
     - At least one uppercase letter
     - At least one number

### Team Settings

1. Go to **Settings > Teams**
2. Enable team features:
   - **Allow Team Creation**: Yes
   - **Default Role**: member
   - **Roles**: owner, admin, manager, staff, viewer, inspector

## Step 3: Get API Credentials

1. Go to **Settings > API Keys**
2. Copy your credentials:
   - **Project ID**: `16f63eb0-a0a5-4387-9c2f-9dc47df6a1f1` (example)
   - **Publishable Client Key**: `pck_w315y6fqrp67bptv02fcpsxbb9pp8n3z90jmd7qhzm51g` (example)
   - **Secret Server Key**: Keep this secure for backend operations

## Step 4: Configure Application

### Frontend Configuration (.env)

```env
# Stack Auth
VITE_STACK_PROJECT_ID=your-project-id-here
VITE_STACK_PUBLISHABLE_CLIENT_KEY=your-publishable-key-here

# API
VITE_API_BASE_URL=http://localhost:8787

# Turso Database
VITE_TURSO_DATABASE_URL=libsql://your-database.turso.io
VITE_TURSO_AUTH_TOKEN=your-auth-token
```

### Backend Configuration (Cloudflare Workers)

Set up environment variables in `wrangler.toml`:

```toml
[vars]
STACK_PROJECT_ID = "your-project-id-here"

# Use wrangler secret for sensitive data
# npx wrangler secret put STACK_SECRET_SERVER_KEY
# npx wrangler secret put TURSO_AUTH_TOKEN
# npx wrangler secret put FROSTGUARD_WEBHOOK_SECRET
```

## Step 5: Configure Webhooks

### Stack Auth Webhooks

1. Go to **Settings > Webhooks**
2. Add webhook endpoint:
   - **URL**: `https://your-api.workers.dev/api/sync/stack-auth`
   - **Events**: 
     - `user.created`
     - `user.updated`
     - `team.created`
     - `team.updated`

### FrostGuard Integration Webhooks

Configure FrostGuard to send user/organization updates:

```bash
# FrostGuard webhook endpoint
POST https://your-api.workers.dev/api/sync/organization
Headers:
  X-Webhook-Secret: your-shared-secret
  Content-Type: application/json

Body:
{
  "organization": {
    "id": "org-123",
    "name": "Example Organization"
  },
  "users": [
    {
      "id": "user-123",
      "email": "user@example.com",
      "role": "admin"
    }
  ]
}
```

## Step 6: Test Authentication Flow

### 1. Start Development Server

```bash
# Frontend
npm run dev

# Backend (in workers directory)
npx wrangler dev
```

### 2. Test Login Flow

1. Navigate to http://localhost:4146
2. Click "Sign In"
3. Create a new account or login
4. Verify redirect to /emulator

### 3. Test Protected Routes

```javascript
// Protected route should redirect to login
http://localhost:4146/emulator

// After login, should have access
// Check browser DevTools for auth token
```

### 4. Test API Authentication

```bash
# Get auth token from browser
# DevTools > Application > Cookies > stackframe_access_token

# Test API with token
curl http://localhost:8787/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 7: Production Deployment

### Deploy Cloudflare Workers

```bash
cd workers
npx wrangler deploy --env production
```

### Deploy Frontend

```bash
# Build production bundle
npm run build

# Deploy to hosting (Vercel, Netlify, Cloudflare Pages)
# Example for Cloudflare Pages:
npx wrangler pages deploy dist
```

### Update Production URLs

1. Update Stack Auth allowed URLs:
   - Go to **Settings > URLs**
   - Add production domain: `https://your-app.com`
   
2. Update environment variables for production

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**
   - Check Stack Auth project ID matches in frontend and backend
   - Verify JWT is being sent in Authorization header
   - Check JWKS URL is correct

2. **Login redirect not working**
   - Verify callback URL in Stack Auth settings
   - Check ProtectedRoute component implementation

3. **Team/Organization not syncing**
   - Verify webhook secret matches
   - Check webhook endpoint logs
   - Ensure database schema includes organization mapping

### Debug Mode

Enable debug logging:

```javascript
// In src/lib/stackAuth.ts
export const stackClientApp = new StackClientApp({
  projectId: import.meta.env.VITE_STACK_PROJECT_ID,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  tokenStore: 'cookie',
  debug: true, // Enable debug logging
})
```

## Security Best Practices

1. **Never expose Secret Server Key** in frontend code
2. **Use environment variables** for all sensitive configuration
3. **Enable HTTPS** in production
4. **Implement rate limiting** on API endpoints
5. **Regular security audits** of authentication flow

## Support

- **Stack Auth Documentation**: https://docs.stack-auth.com
- **Stack Auth Support**: support@stack-auth.com
- **GitHub Issues**: https://github.com/stack-auth/stack

## Next Steps

1. ✅ Configure user roles and permissions
2. ✅ Set up organization/team hierarchy
3. ✅ Implement webhook sync with FrostGuard
4. ✅ Add user profile management UI
5. ✅ Test end-to-end authentication flow