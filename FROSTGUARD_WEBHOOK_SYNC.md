# FrostGuard Webhook Sync Documentation

## Overview

The TTN Emulator receives webhook events from FrostGuard to automatically synchronize:
- **Organizations** - Org name, slug, TTN settings
- **Users** - User profiles, roles, organization membership
- **Applications** - TTN application configurations
- **Devices** (future) - Sensor/device metadata

This is a **webhook-driven, push-based** sync architecture (not JWT/API polling).

---

## Architecture

### Security Model

**HMAC-SHA256 Signature Verification**
- Every webhook from FrostGuard includes an `X-FrostGuard-Signature` header
- Format: `sha256=<hex_digest>`
- The emulator verifies the signature before processing any events
- Shared secret stored in `FROSTGUARD_WEBHOOK_SECRET` environment variable

**No User Authentication Required**
- Webhooks bypass JWT/Stack Auth verification
- Authentication is done via HMAC signature only
- User sessions (Stack Auth) are for interactive browser access only

### Data Flow

```
FrostGuard                                TTN Emulator
-----------                               --------------
Organization                              POST /api/frostguard-sync
  created/updated  ───────────────────►   ├─ Verify HMAC signature
                                          ├─ Log to webhook_events table
User added to org ───────────────────►   ├─ Process event (upsert to DB)
                                          ├─ Mark processed in webhook_events
Application                               └─ Return 200 OK
  created  ────────────────────────────►
```

---

## Database Schema

### Webhook Tables

#### `webhook_events`
Tracks all incoming webhooks for debugging and replay:

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `event_type` | TEXT | e.g., `organization.created`, `user.added_to_org` |
| `event_id` | TEXT | Unique event ID from FrostGuard (for idempotency) |
| `payload` | TEXT | Full JSON payload |
| `signature` | TEXT | HMAC-SHA256 signature |
| `processed` | INTEGER | 0 = pending, 1 = processed |
| `processed_at` | TEXT | ISO 8601 timestamp |
| `error_message` | TEXT | Error if processing failed |
| `source_ip` | TEXT | IP address of webhook sender |
| `user_agent` | TEXT | HTTP User-Agent header |
| `received_at` | TEXT | Timestamp when received |

#### `webhook_secrets`
Stores HMAC secrets per organization (future multi-tenant support):

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `organization_id` | TEXT | Foreign key to organizations |
| `secret_key` | TEXT | HMAC secret shared with FrostGuard |
| `active` | INTEGER | 1 = active, 0 = inactive |
| `created_at` | TEXT | ISO 8601 timestamp |
| `expires_at` | TEXT | Optional expiration date |

### Extended Columns

#### `organizations`
- `frostguard_org_id` TEXT UNIQUE - FrostGuard's org UUID
- `synced_at` TEXT - Last sync timestamp
- `sync_source` TEXT - 'webhook' | 'manual' | 'api'

#### `profiles`
- `frostguard_user_id` TEXT - FrostGuard's user UUID
- `synced_at` TEXT - Last sync timestamp

---

## Webhook Events

### 1. Organization Created/Updated

```json
{
  "event_type": "organization.created",
  "event_id": "evt_abc123xyz",
  "timestamp": "2026-01-02T20:00:00Z",
  "data": {
    "id": "uuid-from-frostguard",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "ttn_application_id": "acme-warehouse-app",
    "ttn_cluster": "nam1"
  }
}
```

**Headers:**
```
X-FrostGuard-Signature: sha256=a1b2c3d4e5f6...
Content-Type: application/json
```

**Emulator Action:**
- Upserts to `organizations` table
- Sets `frostguard_org_id`, `synced_at`, `sync_source = 'webhook'`
- Updates existing org if `frostguard_org_id` matches

---

### 2. User Added to Organization

```json
{
  "event_type": "user.added_to_org",
  "event_id": "evt_def456",
  "timestamp": "2026-01-02T20:05:00Z",
  "data": {
    "user_id": "stack-auth-user-id",
    "frostguard_user_id": "uuid-from-frostguard",
    "org_id": "uuid-from-frostguard",
    "email": "john@acme.com",
    "full_name": "John Doe",
    "role": "admin"
  }
}
```

**Emulator Action:**
- Looks up local `organization_id` from `frostguard_org_id`
- Upserts to `profiles` table
- Sets `frostguard_user_id`, `organization_id`, `email`, `full_name`, `role`

---

### 3. User Removed from Organization

```json
{
  "event_type": "user.removed_from_org",
  "event_id": "evt_ghi789",
  "timestamp": "2026-01-02T20:10:00Z",
  "data": {
    "user_id": "stack-auth-user-id",
    "org_id": "uuid-from-frostguard"
  }
}
```

**Emulator Action:**
- Sets `profiles.organization_id = NULL` (soft delete)
- User can no longer access emulator resources for that org

---

### 4. Application Created/Updated

```json
{
  "event_type": "application.created",
  "event_id": "evt_jkl012",
  "timestamp": "2026-01-02T20:15:00Z",
  "data": {
    "org_id": "uuid-from-frostguard",
    "app_id": "acme-warehouse-app",
    "name": "Warehouse Monitoring",
    "description": "Cold storage sensors"
  }
}
```

**Emulator Action:**
- Looks up local `organization_id` from `frostguard_org_id`
- Upserts to `applications` table
- Creates or updates TTN application record

---

## Setup Instructions

### 1. Environment Configuration

Create `workers/.dev.vars` (for local development):

```bash
TURSO_AUTH_TOKEN=your-turso-token
STACK_PROJECT_ID=your-stack-project-id
STACK_SECRET_SERVER_KEY=your-stack-secret
FROSTGUARD_WEBHOOK_SECRET=your-shared-secret
```

For production, set these as Cloudflare Workers secrets:

```bash
cd workers
wrangler secret put FROSTGUARD_WEBHOOK_SECRET
# Enter: your-production-secret
```

### 2. Run Database Migration

```bash
# POST to migration endpoint with webhook secret
curl -X POST http://localhost:8787/api/migrate \
  -H "x-webhook-secret: your-shared-secret" \
  -H "Content-Type: application/json"
```

This creates:
- `webhook_events` table
- `webhook_secrets` table
- Adds FrostGuard reference columns to `organizations` and `profiles`
- Creates indexes for performance

### 3. Configure FrostGuard

In FrostGuard's admin panel:

1. Set webhook URL: `https://your-emulator.workers.dev/api/frostguard-sync`
2. Set webhook secret: (same as `FROSTGUARD_WEBHOOK_SECRET`)
3. Enable events:
   - `organization.created`
   - `organization.updated`
   - `user.added_to_org`
   - `user.removed_from_org`
   - `application.created`
   - `application.updated`

---

## Testing Webhooks

### Manual Test (using curl)

```bash
# 1. Generate HMAC signature
PAYLOAD='{"event_type":"organization.created","event_id":"test-123","timestamp":"2026-01-02T20:00:00Z","data":{"id":"org-uuid-123","name":"Test Org","slug":"test-org","ttn_application_id":"test-app","ttn_cluster":"nam1"}}'

SECRET="your-shared-secret"

# Compute HMAC (on Linux/Mac)
SIGNATURE="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)"

# 2. Send webhook
curl -X POST http://localhost:8787/api/frostguard-sync \
  -H "X-FrostGuard-Signature: $SIGNATURE" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
```

**Expected Response:**

```json
{
  "success": true,
  "event_id": "abc123...",
  "event_type": "organization.created",
  "timestamp": "2026-01-02T20:00:00Z"
}
```

### Check Webhook Logs

Query the `webhook_events` table:

```sql
SELECT event_type, processed, error_message, received_at
FROM webhook_events
ORDER BY received_at DESC
LIMIT 10;
```

---

## Troubleshooting

### Webhook Returns 401 Unauthorized

**Cause:** HMAC signature verification failed

**Solutions:**
1. Verify `FROSTGUARD_WEBHOOK_SECRET` matches in both systems
2. Check that signature header is `X-FrostGuard-Signature: sha256=...`
3. Ensure payload is exact (no whitespace differences)
4. Verify HMAC is computed on the raw request body (not JSON-parsed)

### Webhook Returns 400 Unknown Event Type

**Cause:** Event type not recognized

**Solution:** Check that `event_type` is one of:
- `organization.created`
- `organization.updated`
- `user.added_to_org`
- `user.removed_from_org`
- `application.created`
- `application.updated`

### Webhook Returns 500 Processing Error

**Cause:** Database error during event processing

**Solutions:**
1. Check `webhook_events.error_message` for details
2. Verify the organization exists (for user/application events)
3. Check database constraints (unique indexes, foreign keys)
4. Review Workers logs for stack traces

---

## Idempotency

Webhooks are designed to be **idempotent** (safe to replay):

1. **Event ID tracking** - The `webhook_events.event_id` field stores FrostGuard's unique event ID
2. **Upsert operations** - All handlers use `INSERT ... ON CONFLICT DO UPDATE`
3. **Duplicate detection** - If the same `event_id` is received twice, it's logged but not re-processed

**Replay a webhook:**

```sql
-- Get a previous event
SELECT payload FROM webhook_events WHERE event_id = 'evt_abc123';

-- Resend it (generate new signature)
```

---

## Security Best Practices

1. **Use HTTPS in production** - Never send webhooks over HTTP
2. **Rotate secrets periodically** - Update `FROSTGUARD_WEBHOOK_SECRET` every 90 days
3. **Validate payload structure** - Check for required fields before processing
4. **Rate limiting** - Add rate limits to prevent webhook flooding (future enhancement)
5. **IP allowlisting** - Restrict webhook endpoint to FrostGuard's IP range (future enhancement)

---

## Future Enhancements

- [ ] **Webhook retries** - Automatic retry with exponential backoff
- [ ] **Webhook verification UI** - Admin panel to test webhook connectivity
- [ ] **Multi-secret support** - Different secrets per organization
- [ ] **Event filtering** - Subscribe to specific event types only
- [ ] **Webhook audit dashboard** - UI to view/search webhook history
- [ ] **Batch event support** - Process multiple events in one request

---

## API Reference

### `POST /api/frostguard-sync`

**Headers:**
- `X-FrostGuard-Signature` (required) - HMAC-SHA256 signature
- `Content-Type: application/json` (required)

**Request Body:**
```typescript
interface WebhookPayload {
  event_type: string  // Event type (e.g., "organization.created")
  event_id: string    // Unique event ID for idempotency
  timestamp: string   // ISO 8601 timestamp
  data: object        // Event-specific data
}
```

**Response (Success):**
```json
{
  "success": true,
  "event_id": "webhook-db-id",
  "event_type": "organization.created",
  "timestamp": "2026-01-02T20:00:00Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message",
  "event_id": "webhook-db-id"
}
```

**Status Codes:**
- `200 OK` - Event processed successfully
- `401 Unauthorized` - Invalid HMAC signature
- `400 Bad Request` - Unknown event type or malformed payload
- `500 Internal Server Error` - Processing error (check `webhook_events.error_message`)

---

## Support

For issues or questions:
- Check `webhook_events` table for error details
- Review Workers logs in Wrangler dashboard
- Contact: support@frostguard.io
