# GitHub Issues - FrostGuard LoRaWAN Emulator Improvements

This file contains prepared GitHub issues for enhancements identified during the UI functionality audit.
To create these issues, run `gh auth login` to refresh authentication, then use `gh issue create`.

---

## Issue 1: Add real telemetry data to MonitorTab live feed

**Labels:** `enhancement`, `frontend`

**Title:** Connect MonitorTab live telemetry feed to real database readings

**Description:**
The MonitorTab currently shows the device list from real data, but the live telemetry feed section uses simulated/mock data generation.

### Current Behavior
- Device Status section: Connected to real devices via `useDevices` hook
- Live Telemetry Feed: Uses `generateMockReading()` function with random values
- Telemetry History Chart: Uses mock data points

### Expected Behavior
- Live Telemetry Feed should display actual readings from `useTelemetry` hook
- Chart should show historical data from the database
- Real-time updates when new readings are received

### Technical Notes
- `useTelemetry` hook already exists and fetches from `/api/devices/:id/telemetry`
- Need to poll or use WebSocket for real-time updates
- Consider using React Query's `refetchInterval` for polling

---

## Issue 2: Implement payload format templates in TestingTab

**Labels:** `enhancement`, `frontend`

**Title:** Add predefined payload format templates for common sensor types

**Description:**
The TestingTab has a Payload Format dropdown but no actual template options.

### Current Behavior
- Shows "Cayenne LPP (Recommended)" as static text
- No dropdown functionality or alternative formats

### Expected Behavior
- Dropdown with common LoRaWAN payload formats:
  - Cayenne LPP
  - Raw Hex
  - JSON
  - Custom binary
- Selecting a format should update the payload preview
- Documentation links for each format

### Technical Notes
- Reference TTN payload formatter documentation
- Consider adding a payload builder UI for Cayenne LPP

---

## Issue 3: Add organization/site context filtering in TestingTab

**Labels:** `enhancement`, `frontend`

**Title:** Connect TestingTab organization/site selectors to real data

**Description:**
The TestingTab has Organization, Site, and Unit selectors but they use hardcoded mock data.

### Current Behavior
- Selectors show hardcoded "FrostGuard Demo Org", "Main Warehouse", etc.
- No connection to actual organization data from Stack Auth

### Expected Behavior
- Pull organization data from authenticated user's Stack Auth metadata
- Filter devices by selected organization context
- Persist selection in session storage

### Technical Notes
- Organization ID available from `useStackAuth()` hook's `user.clientMetadata.organizationId`
- May need new API endpoint to fetch organization hierarchy (sites/units)

---

## Issue 4: Add log persistence and export improvements

**Labels:** `enhancement`, `frontend`

**Title:** Improve LogsTab with persistence, search history, and structured export

**Description:**
The LogsTab provides basic logging but lacks persistence and advanced features.

### Current Behavior
- Logs are stored in memory only (lost on page refresh)
- Export is plain text format
- No search history or saved filters

### Expected Behavior
- Option to persist logs to IndexedDB or localStorage
- Export options: JSON, CSV, plain text
- Save and recall filter presets
- Log retention settings (keep last N entries or time period)

### Technical Notes
- Consider using `idb-keyval` for IndexedDB wrapper
- Add structured log format for JSON export
- Implement log level statistics

---

## Issue 5: Add device simulation parameter bulk editing

**Labels:** `enhancement`, `frontend`

**Title:** Allow bulk editing of simulation parameters across multiple devices

**Description:**
Currently, sensor configuration in SensorsTab applies to all devices at once or requires individual device editing.

### Current Behavior
- SensorsTab has a device selector but no multi-select
- Changing parameters applies to one or all devices

### Expected Behavior
- Multi-select checkbox for devices
- Apply configuration changes to selected subset
- Preview which devices will be affected
- Batch update confirmation dialog

### Technical Notes
- Modify `updateDevice` mutation to handle batch updates
- Add optimistic updates for better UX
- Consider adding a "device groups" feature

---

## Issue 6: Implement gateway signal strength visualization

**Labels:** `enhancement`, `frontend`

**Title:** Add visual signal strength indicators and coverage map to GatewaysTab

**Description:**
The GatewaysTab shows gateway list but lacks signal quality visualization.

### Current Behavior
- Text-based signal strength display (dBm value)
- No visual representation of coverage

### Expected Behavior
- Signal strength bars/indicator (like WiFi icon)
- Color-coded status (green/yellow/red)
- Optional: Simple coverage map visualization
- Signal quality trends over time

### Technical Notes
- Use existing Recharts library for trends
- Consider adding a simple SVG-based signal indicator component

---

## Issue 7: Add webhook delivery retry mechanism

**Labels:** `enhancement`, `backend`

**Title:** Implement automatic webhook retry with exponential backoff

**Description:**
Failed webhook deliveries should be automatically retried.

### Current Behavior
- Webhook failures are logged but not retried
- Manual intervention required

### Expected Behavior
- Automatic retry with exponential backoff (1s, 2s, 4s, 8s...)
- Maximum retry attempts (configurable)
- Dead letter queue for permanently failed webhooks
- Webhook delivery status in UI

### Technical Notes
- Implement in Cloudflare Workers
- Consider using Durable Objects for retry scheduling
- Add webhook_deliveries table for tracking

---

## Issue 8: Add real-time connection status indicator

**Labels:** `enhancement`, `frontend`

**Title:** Show real-time API/database connection status in header

**Description:**
Users should see at-a-glance whether the emulator is connected to backend services.

### Current Behavior
- No visible connection status
- Errors only shown when operations fail

### Expected Behavior
- Connection status indicator in header (connected/disconnected/reconnecting)
- Automatic reconnection attempts
- Visual indication when API is unreachable
- Tooltip with connection details

### Technical Notes
- Implement health check polling to `/health` endpoint
- Use React Query's error state for detection
- Consider WebSocket for real-time status

---

## How to Create These Issues

Once GitHub CLI authentication is refreshed:

```bash
# Authenticate
gh auth login

# Create issues (example)
gh issue create --title "Connect MonitorTab live telemetry feed to real database readings" \
  --body "$(cat <<'EOF'
The MonitorTab currently shows the device list from real data, but the live telemetry feed section uses simulated/mock data generation.

## Current Behavior
- Device Status section: Connected to real devices via useDevices hook
- Live Telemetry Feed: Uses generateMockReading() function with random values

## Expected Behavior
- Live Telemetry Feed should display actual readings from useTelemetry hook
- Chart should show historical data from the database
EOF
)" \
  --label "enhancement" --label "frontend"
```
