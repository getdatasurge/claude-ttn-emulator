# Getting Started - FrostGuard LoRaWAN Emulator

## Current Status ✅

**Stack Auth Integration Complete**
- Custom login page with industrial theme
- JWT-based authentication and authorization
- Webhook endpoints for FrostGuard user sync
- Protected routes and user profile component
- Cloudflare Workers API with JWKS verification
- Build passing, dev server running

**What's Ready:**
- ✅ Frontend (React + TypeScript + Tailwind + Stack Auth)
- ✅ Workers API (Cloudflare Workers + Turso + JWT)
- ✅ Database schema (SQLite/Turso)
- ✅ Authentication flow
- ✅ Documentation

**What's Needed:**
- ⏳ Stack Auth project configuration
- ⏳ Database setup (local or Turso)
- ⏳ Environment variables
- ⏳ Device emulator UI implementation

---

## Quick Start (Local Development)

### 1. Create Stack Auth Project (10 min)

1. Visit https://app.stack-auth.com → Sign up
2. Create new project → "FrostGuard Emulator Dev"
3. Enable password authentication
4. Add redirect URL: `http://localhost:4146`
5. Copy credentials:
   - Project ID
   - Publishable Client Key
   - Secret Server Key

### 2. Configure Environment (2 min)

**Edit `.env`** (already created):
```bash
VITE_STACK_PROJECT_ID=proj_xxxxx  # Replace with your Project ID
VITE_STACK_PUBLISHABLE_CLIENT_KEY=pk_xxxxx  # Replace with Publishable Key
```

**Edit `workers/.dev.vars`** (already created):
```bash
STACK_PROJECT_ID=proj_xxxxx  # Same Project ID
STACK_SECRET_SERVER_KEY=sk_xxxxx  # Replace with Secret Server Key
```

### 3. Install Turso CLI & Create Database (5 min)

**Windows (PowerShell):**
```powershell
irm https://get.tur.so/install.ps1 | iex
```

**Linux/macOS:**
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

**Create local database:**
```bash
turso db create frostguard-local --location local
turso db shell frostguard-local < db/schema.sql
```

**Or skip database temporarily** (app will run, API calls will fail)

### 4. Start Development Servers (1 min)

**Terminal 1 - Frontend:**
```bash
npm run dev
```
Runs on: http://localhost:4146

**Terminal 2 - Workers API:**
```bash
cd workers
npx wrangler dev
```
Runs on: http://localhost:8787

### 5. Test Authentication (3 min)

1. Visit http://localhost:4146
2. Click "Launch Emulator" → Redirects to `/login`
3. Create test user in Stack Auth dashboard:
   - Go to **Users** → **Create User**
   - Email: `test@example.com`
   - Password: `Test123!`
4. Sign in at http://localhost:4146/#/login
5. Should redirect to emulator page
6. See user profile in top-right corner

**✅ Authentication working!**

---

## Next: Implement Device Emulator

The authentication foundation is complete. Now build the actual emulator features:

### Priority 1: Device Management UI

Create device list and form components:

```bash
# Components to create:
src/components/emulator/DeviceList.tsx
src/components/emulator/DeviceForm.tsx
src/components/emulator/DeviceCard.tsx
```

**Features:**
- List all devices for user's organization
- Add/edit/delete devices
- Device types: temperature, humidity, door sensor
- Device status indicators

### Priority 2: Telemetry Simulator

Create telemetry simulation controls:

```bash
# Components to create:
src/components/emulator/TelemetrySimulator.tsx
src/components/emulator/TelemetryChart.tsx
src/components/emulator/SimulationControls.tsx
```

**Features:**
- Manual data point generation
- Automated simulation with intervals
- Real-time chart visualization (Recharts)
- Historical data view

### Priority 3: TTN Integration

Create TTN configuration and testing:

```bash
# Components to create:
src/components/emulator/TTNSettings.tsx
src/components/emulator/TTNTestConnection.tsx
src/components/emulator/TTNUplinkSimulator.tsx
```

**Features:**
- TTN credentials configuration
- Connection testing
- Uplink simulation
- Webhook data display

---

## Production Deployment (Later)

After local testing, deploy to production:

1. **Create production Stack Auth project**
2. **Create Turso production database**
3. **Deploy Workers API:**
   ```bash
   cd workers
   wrangler login
   wrangler secret put STACK_PROJECT_ID
   wrangler secret put STACK_SECRET_SERVER_KEY
   wrangler secret put FROSTGUARD_WEBHOOK_SECRET
   wrangler secret put TURSO_DATABASE_URL
   wrangler secret put TURSO_AUTH_TOKEN
   wrangler deploy
   ```
4. **Deploy frontend** (Cloudflare Pages, Vercel, or Netlify)
5. **Configure FrostGuard webhooks**

See `STACK_AUTH_IMPLEMENTATION.md` for complete deployment guide.

---

## Troubleshooting

**Build errors:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Authentication not working:**
- Check Stack Auth credentials in `.env` and `workers/.dev.vars`
- Verify redirect URLs in Stack Auth dashboard
- Check browser console for errors

**Workers API errors:**
- Ensure `wrangler dev` is running
- Check `workers/.dev.vars` has correct credentials
- Verify database schema was applied

**Need help?**
- `STACK_AUTH_IMPLEMENTATION.md` - Complete auth guide
- `CLAUDE.md` - Project architecture reference
- `README.md` - Setup instructions

---

## Development Commands

```bash
# Frontend
npm run dev          # Dev server
npm run build        # Production build
npm run preview      # Preview build
npm run lint         # Run ESLint

# Workers API
cd workers
npx wrangler dev     # Local dev server
npx wrangler deploy  # Deploy to Cloudflare

# Database
turso db shell frostguard-local  # Open database shell
turso db show frostguard-local   # Show database info
```

---

**Ready to start?** → Follow steps 1-5 above to get the app running locally.

**Already running?** → Start building the device emulator UI (Priority 1).
