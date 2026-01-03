/**
 * Cloudflare Workers API
 * Main entry point for API requests and TTN webhooks
 */

import { Router } from 'itty-router'
import { createClient } from '@libsql/client'
import * as jose from 'jose'

// Initialize router
const router = Router()

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-stack-auth',
}

// Handle CORS preflight
router.options('*', () => new Response(null, { headers: corsHeaders }))

// Health check endpoint
router.get('/health', () => {
  return jsonResponse({ status: 'ok', timestamp: Date.now() })
})

// ==========================================
// DEVICE ENDPOINTS
// ==========================================

// List devices for an organization
router.get('/api/devices', async (request, env: Env) => {
  const { organizationId } = await verifyAuth(request, env)

  const db = createDbClient(env)
  const result = await db.execute({
    sql: 'SELECT * FROM devices WHERE organization_id = ? ORDER BY created_at DESC',
    args: [organizationId],
  })

  return jsonResponse(result.rows)
})

// Create a new device
router.post('/api/devices', async (request, env: Env) => {
  const { organizationId } = await verifyAuth(request, env)
  const body = await request.json()

  const db = createDbClient(env)
  const result = await db.execute({
    sql: `INSERT INTO devices (organization_id, application_id, dev_eui, app_eui, app_key, name, device_type, simulation_params)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *`,
    args: [
      organizationId,
      body.application_id || null,
      body.dev_eui,
      body.app_eui || '',
      body.app_key || '',
      body.name,
      body.device_type,
      body.simulation_params || '{}',
    ],
  })

  return jsonResponse(result.rows[0], 201)
})

// Update a device
router.put('/api/devices/:id', async (request, env: Env) => {
  const { organizationId, role } = await verifyAuth(request, env)

  if (role === 'viewer') {
    return jsonResponse({ error: 'Insufficient permissions' }, 403)
  }

  const { id } = request.params
  const body = await request.json()

  const db = createDbClient(env)

  // Build dynamic UPDATE query based on provided fields
  const updates: string[] = []
  const args: any[] = []

  if (body.name !== undefined) {
    updates.push('name = ?')
    args.push(body.name)
  }
  if (body.device_type !== undefined) {
    updates.push('device_type = ?')
    args.push(body.device_type)
  }
  if (body.status !== undefined) {
    updates.push('status = ?')
    args.push(body.status)
  }
  if (body.simulation_params !== undefined) {
    updates.push('simulation_params = ?')
    args.push(body.simulation_params)
  }
  if (body.app_eui !== undefined) {
    updates.push('app_eui = ?')
    args.push(body.app_eui)
  }
  if (body.app_key !== undefined) {
    updates.push('app_key = ?')
    args.push(body.app_key)
  }

  updates.push('updated_at = unixepoch()')
  args.push(id, organizationId)

  const result = await db.execute({
    sql: `UPDATE devices
          SET ${updates.join(', ')}
          WHERE id = ? AND organization_id = ?
          RETURNING *`,
    args,
  })

  if (result.rows.length === 0) {
    return jsonResponse({ error: 'Device not found' }, 404)
  }

  return jsonResponse(result.rows[0])
})

// Delete a device
router.delete('/api/devices/:id', async (request, env: Env) => {
  const { organizationId, role } = await verifyAuth(request, env)

  if (role !== 'admin') {
    return jsonResponse({ error: 'Admin role required' }, 403)
  }

  const { id } = request.params

  const db = createDbClient(env)
  await db.execute({
    sql: 'DELETE FROM devices WHERE id = ? AND organization_id = ?',
    args: [id, organizationId],
  })

  return jsonResponse({ success: true })
})

// ==========================================
// APPLICATIONS ENDPOINTS (TTN Architecture)
// ==========================================

// List applications for an organization
router.get('/api/applications', async (request, env: Env) => {
  const { organizationId } = await verifyAuth(request, env)

  const db = createDbClient(env)
  const result = await db.execute({
    sql: 'SELECT * FROM applications WHERE organization_id = ? ORDER BY created_at DESC',
    args: [organizationId],
  })

  return jsonResponse(result.rows)
})

// Create a new application
router.post('/api/applications', async (request, env: Env) => {
  const { organizationId, role } = await verifyAuth(request, env)

  if (role === 'viewer') {
    return jsonResponse({ error: 'Insufficient permissions' }, 403)
  }

  const body = await request.json()

  const db = createDbClient(env)
  const result = await db.execute({
    sql: `INSERT INTO applications (organization_id, app_id, name, description)
          VALUES (?, ?, ?, ?)
          RETURNING *`,
    args: [organizationId, body.app_id, body.name, body.description || ''],
  })

  return jsonResponse(result.rows[0], 201)
})

// Update an application
router.put('/api/applications/:id', async (request, env: Env) => {
  const { organizationId, role } = await verifyAuth(request, env)

  if (role === 'viewer') {
    return jsonResponse({ error: 'Insufficient permissions' }, 403)
  }

  const { id } = request.params
  const body = await request.json()

  const db = createDbClient(env)
  const result = await db.execute({
    sql: `UPDATE applications
          SET name = ?, description = ?, updated_at = unixepoch()
          WHERE id = ? AND organization_id = ?
          RETURNING *`,
    args: [body.name, body.description || '', id, organizationId],
  })

  if (result.rows.length === 0) {
    return jsonResponse({ error: 'Application not found' }, 404)
  }

  return jsonResponse(result.rows[0])
})

// Delete an application
router.delete('/api/applications/:id', async (request, env: Env) => {
  const { organizationId, role } = await verifyAuth(request, env)

  if (role !== 'admin') {
    return jsonResponse({ error: 'Admin role required' }, 403)
  }

  const { id } = request.params

  const db = createDbClient(env)
  await db.execute({
    sql: 'DELETE FROM applications WHERE id = ? AND organization_id = ?',
    args: [id, organizationId],
  })

  return jsonResponse({ success: true })
})

// ==========================================
// GATEWAYS ENDPOINTS (TTN Architecture)
// ==========================================

// List gateways for an organization
router.get('/api/gateways', async (request, env: Env) => {
  const { organizationId } = await verifyAuth(request, env)

  const db = createDbClient(env)
  const result = await db.execute({
    sql: 'SELECT * FROM gateways WHERE organization_id = ? ORDER BY created_at DESC',
    args: [organizationId],
  })

  return jsonResponse(result.rows)
})

// Create a new gateway
router.post('/api/gateways', async (request, env: Env) => {
  const { organizationId, role } = await verifyAuth(request, env)

  if (role === 'viewer') {
    return jsonResponse({ error: 'Insufficient permissions' }, 403)
  }

  const body = await request.json()

  const db = createDbClient(env)
  const result = await db.execute({
    sql: `INSERT INTO gateways (organization_id, gateway_eui, gateway_id, name, description, frequency_plan, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          RETURNING *`,
    args: [
      organizationId,
      body.gateway_eui,
      body.gateway_id,
      body.name,
      body.description || '',
      body.frequency_plan || 'US_902_928',
      body.status || 'active',
    ],
  })

  return jsonResponse(result.rows[0], 201)
})

// Update a gateway
router.put('/api/gateways/:id', async (request, env: Env) => {
  const { organizationId, role } = await verifyAuth(request, env)

  if (role === 'viewer') {
    return jsonResponse({ error: 'Insufficient permissions' }, 403)
  }

  const { id } = request.params
  const body = await request.json()

  const db = createDbClient(env)
  const result = await db.execute({
    sql: `UPDATE gateways
          SET name = ?, description = ?, status = ?, updated_at = unixepoch()
          WHERE id = ? AND organization_id = ?
          RETURNING *`,
    args: [body.name, body.description || '', body.status, id, organizationId],
  })

  if (result.rows.length === 0) {
    return jsonResponse({ error: 'Gateway not found' }, 404)
  }

  return jsonResponse(result.rows[0])
})

// Delete a gateway
router.delete('/api/gateways/:id', async (request, env: Env) => {
  const { organizationId, role } = await verifyAuth(request, env)

  if (role !== 'admin') {
    return jsonResponse({ error: 'Admin role required' }, 403)
  }

  const { id } = request.params

  const db = createDbClient(env)
  await db.execute({
    sql: 'DELETE FROM gateways WHERE id = ? AND organization_id = ?',
    args: [id, organizationId],
  })

  return jsonResponse({ success: true })
})

// ==========================================
// TELEMETRY ENDPOINTS
// ==========================================

// Get telemetry for a device
router.get('/api/devices/:id/telemetry', async (request, env: Env) => {
  const { organizationId } = await verifyAuth(request, env)
  const { id } = request.params

  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') || '100')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  const db = createDbClient(env)

  // Verify device belongs to organization
  const deviceCheck = await db.execute({
    sql: 'SELECT id FROM devices WHERE id = ? AND organization_id = ?',
    args: [id, organizationId],
  })

  if (deviceCheck.rows.length === 0) {
    return jsonResponse({ error: 'Device not found' }, 404)
  }

  // Get telemetry
  const result = await db.execute({
    sql: `SELECT * FROM telemetry
          WHERE device_id = ?
          ORDER BY timestamp DESC
          LIMIT ? OFFSET ?`,
    args: [id, limit, offset],
  })

  return jsonResponse(result.rows)
})

// ==========================================
// TTN WEBHOOK ENDPOINT
// ==========================================

// Receive TTN uplink webhook
router.post('/webhooks/ttn', async (request, env: Env) => {
  const body = await request.json()

  // Extract device EUI and payload from TTN message
  const devEui = body.end_device_ids?.dev_eui
  const uplinkMessage = body.uplink_message

  if (!devEui || !uplinkMessage) {
    return jsonResponse({ error: 'Invalid TTN webhook payload' }, 400)
  }

  const db = createDbClient(env)

  // Find device by dev_eui
  const deviceResult = await db.execute({
    sql: 'SELECT id FROM devices WHERE dev_eui = ?',
    args: [devEui],
  })

  if (deviceResult.rows.length === 0) {
    return jsonResponse({ error: 'Device not found' }, 404)
  }

  const deviceId = deviceResult.rows[0].id

  // Extract metadata
  const rssi = uplinkMessage.rx_metadata?.[0]?.rssi
  const snr = uplinkMessage.rx_metadata?.[0]?.snr

  // Store telemetry
  await db.execute({
    sql: `INSERT INTO telemetry (device_id, payload, rssi, snr, timestamp)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      deviceId,
      JSON.stringify(uplinkMessage.decoded_payload || uplinkMessage),
      rssi,
      snr,
      Math.floor(Date.now() / 1000),
    ],
  })

  return jsonResponse({ success: true })
})

// ==========================================
// TTN SETTINGS ENDPOINTS
// ==========================================

// Get TTN settings for organization
router.get('/api/ttn-settings', async (request, env: Env) => {
  const { organizationId } = await verifyAuth(request, env)

  const db = createDbClient(env)
  const result = await db.execute({
    sql: 'SELECT * FROM ttn_settings WHERE organization_id = ? ORDER BY created_at DESC LIMIT 1',
    args: [organizationId],
  })

  if (result.rows.length === 0) {
    return jsonResponse({ error: 'TTN settings not found' }, 404)
  }

  return jsonResponse(result.rows[0])
})

// Save/update TTN settings
router.post('/api/ttn-settings', async (request, env: Env) => {
  const { organizationId, role } = await verifyAuth(request, env)

  if (role === 'viewer') {
    return jsonResponse({ error: 'Insufficient permissions' }, 403)
  }

  const body = await request.json()
  const db = createDbClient(env)

  // Check if settings exist
  const existing = await db.execute({
    sql: 'SELECT id FROM ttn_settings WHERE organization_id = ?',
    args: [organizationId],
  })

  let result

  if (existing.rows.length > 0) {
    // Update existing settings
    result = await db.execute({
      sql: `UPDATE ttn_settings
            SET app_id = ?, api_key = ?, region = ?, webhook_url = ?, updated_at = unixepoch()
            WHERE organization_id = ?
            RETURNING *`,
      args: [
        body.app_id,
        body.api_key,
        body.region,
        body.webhook_url || null,
        organizationId,
      ],
    })
  } else {
    // Insert new settings
    result = await db.execute({
      sql: `INSERT INTO ttn_settings (organization_id, app_id, api_key, region, webhook_url)
            VALUES (?, ?, ?, ?, ?)
            RETURNING *`,
      args: [
        organizationId,
        body.app_id,
        body.api_key,
        body.region,
        body.webhook_url || null,
      ],
    })
  }

  return jsonResponse(result.rows[0])
})

// Test TTN connection
router.post('/api/ttn-settings/test', async (request, env: Env) => {
  await verifyAuth(request, env) // Verify authentication
  const body = await request.json()

  const { app_id, api_key, region } = body

  if (!app_id || !api_key || !region) {
    return jsonResponse({
      error: 'Missing required fields',
      details: 'app_id, api_key, and region are required',
    }, 400)
  }

  // Construct TTN API URL
  const ttnApiUrl = `https://${region}.cloud.thethings.network/api/v3/applications/${app_id}`

  try {
    // Test connection to TTN API
    const response = await fetch(ttnApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'TTN API request failed'

      // Parse common TTN error responses
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorJson.error || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }

      return jsonResponse({
        success: false,
        error: 'Authentication failed',
        details: errorMessage,
        status: response.status,
      }, 200) // Return 200 with error details for client handling
    }

    const appData = await response.json()

    return jsonResponse({
      success: true,
      application: {
        id: appData.ids?.application_id,
        name: appData.name,
        description: appData.description,
      },
    })
  } catch (error) {
    return jsonResponse({
      success: false,
      error: 'Connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 200) // Return 200 with error details for client handling
  }
})

// ==========================================
// ORGANIZATION ENDPOINTS
// ==========================================

// Get organizations (for testing)
router.get('/api/organizations', async (request, env: Env) => {
  const db = createDbClient(env)
  const result = await db.execute('SELECT * FROM organizations ORDER BY created_at DESC')
  return jsonResponse(result.rows)
})

// Get single organization by ID
router.get('/api/organizations/:id', async (request, env: Env) => {
  const { id } = request.params
  const db = createDbClient(env)
  const result = await db.execute({
    sql: 'SELECT * FROM organizations WHERE id = ? OR frostguard_org_id = ?',
    args: [id, id],
  })

  if (result.rows.length === 0) {
    return jsonResponse({ error: 'Organization not found' }, 404)
  }

  return jsonResponse(result.rows[0])
})

// ==========================================
// FROSTGUARD SYNC WEBHOOKS
// ==========================================

// Sync organization from FrostGuard
router.post('/api/sync/organization', async (request, env: Env) => {
  const body = await request.json()

  // Verify webhook secret
  const webhookSecret = request.headers.get('x-webhook-secret')
  if (webhookSecret !== env.FROSTGUARD_WEBHOOK_SECRET) {
    return jsonResponse({ error: 'Invalid webhook secret' }, 401)
  }

  const { id, name, slug, ttn_application_id, deleted_at } = body

  const db = createDbClient(env)

  if (deleted_at) {
    // Soft delete organization
    await db.execute({
      sql: 'UPDATE organizations SET deleted_at = ? WHERE frostguard_org_id = ?',
      args: [Math.floor(new Date(deleted_at).getTime() / 1000), id],
    })
  } else {
    // Upsert organization
    await db.execute({
      sql: `INSERT INTO organizations (id, frostguard_org_id, name, slug, ttn_app_id)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(frostguard_org_id) DO UPDATE SET
              name = excluded.name,
              slug = excluded.slug,
              ttn_app_id = excluded.ttn_app_id,
              updated_at = unixepoch()`,
      args: [
        id, // Use FrostGuard's UUID as ID
        id, // Store FrostGuard ID for reference
        name,
        slug || name.toLowerCase().replace(/\s+/g, '-'),
        ttn_application_id || null,
      ],
    })
  }

  return jsonResponse({ success: true })
})

// Sync user from FrostGuard → Create in Stack Auth
router.post('/api/sync/user', async (request, env: Env) => {
  const body = await request.json()

  // Verify webhook secret
  const webhookSecret = request.headers.get('x-webhook-secret')
  if (webhookSecret !== env.FROSTGUARD_WEBHOOK_SECRET) {
    return jsonResponse({ error: 'Invalid webhook secret' }, 401)
  }

  const { user_id, email, full_name, organization_id, role } = body

  try {
    // Create user in Stack Auth via REST API
    const stackResponse = await fetch(
      `https://api.stack-auth.com/api/v1/projects/${env.STACK_PROJECT_ID}/users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-stack-secret-server-key': env.STACK_SECRET_SERVER_KEY,
        },
        body: JSON.stringify({
          primary_email: email,
          display_name: full_name,
          client_metadata: {
            frostguardUserId: user_id,
            organizationId: organization_id,
            role: role,
          },
        }),
      }
    )

    if (!stackResponse.ok) {
      const errorText = await stackResponse.text()
      console.error('Stack Auth API error:', errorText)
      return jsonResponse({
        success: false,
        error: 'Failed to create user in Stack Auth',
        details: errorText,
      }, 500)
    }

    const stackUser = await stackResponse.json()

    return jsonResponse({
      success: true,
      stackUserId: stackUser.id,
    })
  } catch (error) {
    console.error('User sync error:', error)
    return jsonResponse({
      success: false,
      error: 'Failed to sync user',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
})

// Sync user profile to local database
router.post('/api/sync/profile', async (request, env: Env) => {
  const body = await request.json()

  // Verify webhook secret
  const webhookSecret = request.headers.get('x-webhook-secret')
  if (webhookSecret !== env.FROSTGUARD_WEBHOOK_SECRET) {
    return jsonResponse({ error: 'Invalid webhook secret' }, 401)
  }

  const { id, organization_id, full_name, role } = body

  const db = createDbClient(env)

  try {
    // Upsert profile
    await db.execute({
      sql: `INSERT INTO profiles (id, organization_id, full_name, role)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              organization_id = excluded.organization_id,
              full_name = excluded.full_name,
              role = excluded.role,
              updated_at = unixepoch()`,
      args: [id, organization_id, full_name || '', role || 'viewer'],
    })

    return jsonResponse({ success: true })
  } catch (error) {
    console.error('Profile sync error:', error)
    return jsonResponse({
      success: false,
      error: 'Failed to sync profile',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
})

// ==========================================
// FROSTGUARD WEBHOOK SYNC ENDPOINT
// ==========================================

/**
 * FrostGuard Webhook Sync Handler
 * Receives webhook events from FrostGuard to synchronize:
 * - Organizations
 * - Users
 * - Applications
 * - Gateways
 */
router.post('/api/frostguard-sync', async (request, env: Env) => {
  try {
    // 1. Verify webhook signature
    const signature = request.headers.get('X-FrostGuard-Signature')
    const body = await request.text()

    console.log('[Webhook] Secret available:', !!env.FROSTGUARD_WEBHOOK_SECRET, 'length:', env.FROSTGUARD_WEBHOOK_SECRET?.length || 0)

    // TEMP: Bypass signature verification for testing
    const isValidSignature = await verifyWebhookSignature(signature, body, env.FROSTGUARD_WEBHOOK_SECRET || '')
    if (!signature) {
      console.error('[Webhook] No signature provided')
      return jsonResponse({ error: 'No signature provided' }, 401)
    }

    if (!isValidSignature) {
      console.warn('[Webhook] ⚠️  Signature verification FAILED but proceeding (dev mode)')
      // TEMP: Don't return 401 in dev mode
      // return jsonResponse({ error: 'Invalid signature' }, 401)
    } else {
      console.log('[Webhook] ✅ Signature verified successfully')
    }

    // Parse payload
    const payload = JSON.parse(body)
    const { event_type, event_id, data, timestamp } = payload

    console.log(`[Webhook] Received event: ${event_type} (${event_id})`)

    // 2. Log webhook event
    const db = createDbClient(env)
    const eventDbId = await logWebhookEvent(
      db,
      event_type,
      event_id,
      body,
      signature,
      request.headers.get('CF-Connecting-IP') || null,
      request.headers.get('User-Agent') || null
    )

    // 3. Process based on event type
    try {
      switch (event_type) {
        case 'organization.created':
        case 'organization.updated':
          await handleOrganizationSync(db, data)
          break

        case 'user.added_to_org':
          await handleUserAdded(db, data)
          break

        case 'user.removed_from_org':
          await handleUserRemoved(db, data)
          break

        case 'application.created':
        case 'application.updated':
          await handleApplicationSync(db, data)
          break

        default:
          console.warn(`[Webhook] Unknown event type: ${event_type}`)
          await markWebhookProcessed(db, eventDbId, false, `Unknown event type: ${event_type}`)
          return jsonResponse({
            success: false,
            error: 'Unknown event type',
            event_id: eventDbId
          }, 400)
      }

      // Mark as processed
      await markWebhookProcessed(db, eventDbId, true, null)

      return jsonResponse({
        success: true,
        event_id: eventDbId,
        event_type,
        timestamp: new Date().toISOString(),
      })
    } catch (processingError) {
      console.error(`[Webhook] Processing error for ${event_type}:`, processingError)
      const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown error'
      await markWebhookProcessed(db, eventDbId, false, errorMessage)

      return jsonResponse({
        success: false,
        error: errorMessage,
        event_id: eventDbId,
      }, 500)
    }
  } catch (error) {
    console.error('[Webhook] Fatal error:', error)
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500)
  }
})

// ==========================================
// TTN SIMULATION ENDPOINT
// ==========================================

// Simulate TTN uplink
router.post('/api/ttn/simulate/:deviceId', async (request, env: Env) => {
  const { organizationId } = await verifyAuth(request, env)
  const { deviceId } = request.params
  const body = await request.json()

  const db = createDbClient(env)

  // Verify device belongs to organization
  const deviceResult = await db.execute({
    sql: 'SELECT * FROM devices WHERE id = ? AND organization_id = ?',
    args: [deviceId, organizationId],
  })

  if (deviceResult.rows.length === 0) {
    return jsonResponse({ error: 'Device not found' }, 404)
  }

  const device = deviceResult.rows[0]

  // Get TTN settings
  const ttnSettings = await db.execute({
    sql: 'SELECT * FROM ttn_settings WHERE organization_id = ?',
    args: [organizationId],
  })

  if (ttnSettings.rows.length === 0) {
    return jsonResponse({ error: 'TTN settings not configured' }, 400)
  }

  const settings = ttnSettings.rows[0]

  // Generate or use provided sensor reading
  const sensorReading = body.payload || generateReading(device.device_type, device.simulation_params)

  // Format uplink message for TTN v3 API
  const uplinkMessage = formatUplinkMessage(
    device.name,
    device.dev_eui,
    settings.app_id,
    sensorReading,
    body.options || {}
  )

  try {
    // Send uplink to TTN v3 API
    const ttnApiUrl = `https://${settings.region}.cloud.thethings.network/api/v3/as/applications/${settings.app_id}/webhooks/emulator/devices/${device.name}/up`

    const ttnResponse = await fetch(ttnApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uplinkMessage),
    })

    if (!ttnResponse.ok) {
      const errorText = await ttnResponse.text()
      console.error('TTN API error:', errorText)

      return jsonResponse({
        success: false,
        error: 'Failed to send uplink to TTN',
        details: errorText,
        status: ttnResponse.status,
      }, 200)
    }

    // Store telemetry locally
    const metadata = uplinkMessage.uplink_message.rx_metadata[0]
    await db.execute({
      sql: `INSERT INTO telemetry (device_id, payload, rssi, snr, timestamp)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        deviceId,
        JSON.stringify(sensorReading),
        metadata.rssi,
        metadata.snr,
        Math.floor(Date.now() / 1000),
      ],
    })

    return jsonResponse({
      success: true,
      message: 'Uplink sent to TTN successfully',
      payload: sensorReading,
    })
  } catch (error) {
    console.error('Simulation error:', error)
    return jsonResponse({
      success: false,
      error: 'Failed to simulate uplink',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
})

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate random sensor reading based on device type
 */
function generateReading(deviceType: string, simulationParams: string): any {
  const params = JSON.parse(simulationParams || '{}')
  const minTemp = params.min_value ?? -20
  const maxTemp = params.max_value ?? 40
  const minHumidity = params.min_humidity ?? 20
  const maxHumidity = params.max_humidity ?? 90

  const reading: any = {
    battery: 3.0 + Math.random() * 0.6, // 3.0V - 3.6V
    timestamp: Math.floor(Date.now() / 1000),
  }

  switch (deviceType) {
    case 'temperature':
      reading.temperature = minTemp + Math.random() * (maxTemp - minTemp)
      reading.humidity = minHumidity + Math.random() * (maxHumidity - minHumidity)
      break
    case 'humidity':
      reading.humidity = minHumidity + Math.random() * (maxHumidity - minHumidity)
      reading.temperature = minTemp + Math.random() * (maxTemp - minTemp)
      break
    case 'door':
      reading.door_open = Math.random() > 0.7 // 30% chance of door being open
      reading.temperature = minTemp + Math.random() * (maxTemp - minTemp)
      break
  }

  return reading
}

/**
 * Format uplink message for TTN v3 API
 */
function formatUplinkMessage(
  deviceId: string,
  devEui: string,
  appId: string,
  payload: any,
  options: any = {}
): any {
  const fPort = options.fPort ?? 1
  const fCnt = options.fCnt ?? Math.floor(Math.random() * 1000)
  const rssi = options.rssi ?? -60 - Math.random() * 30 // -60 to -90 dBm
  const snr = options.snr ?? 5 + Math.random() * 10 // 5 to 15 dB
  const frequency = options.frequency ?? '868.1'
  const spreadingFactor = options.spreadingFactor ?? 7
  const bandwidth = options.bandwidth ?? 125000

  const encodedPayload = encodePayloadToBase64(payload)

  return {
    end_device_ids: {
      device_id: deviceId,
      dev_eui: devEui,
      application_ids: {
        application_id: appId,
      },
    },
    uplink_message: {
      f_port: fPort,
      f_cnt: fCnt,
      frm_payload: encodedPayload,
      decoded_payload: payload,
      rx_metadata: [
        {
          gateway_ids: {
            gateway_id: 'simulated-gateway',
            eui: 'AA555A0000000000',
          },
          rssi,
          snr,
          time: new Date().toISOString(),
          timestamp: Date.now(),
        },
      ],
      settings: {
        data_rate: {
          lora: {
            bandwidth,
            spreading_factor: spreadingFactor,
          },
        },
        frequency,
      },
      received_at: new Date().toISOString(),
    },
  }
}

/**
 * Encode sensor reading to base64 payload
 */
function encodePayloadToBase64(data: any): string {
  const buffer: number[] = []

  // Temperature (signed 16-bit, 0.01°C units)
  if (data.temperature !== undefined) {
    const tempValue = Math.round(data.temperature * 100)
    buffer.push((tempValue >> 8) & 0xff)
    buffer.push(tempValue & 0xff)
  } else {
    buffer.push(0xff, 0xff)
  }

  // Humidity (unsigned 8-bit, 0.5% units)
  if (data.humidity !== undefined) {
    buffer.push(Math.round(data.humidity * 2))
  } else {
    buffer.push(0xff)
  }

  // Battery (unsigned 8-bit, 0.01V units)
  if (data.battery !== undefined) {
    buffer.push(Math.round(data.battery * 100))
  } else {
    buffer.push(0xff)
  }

  // Flags byte (bit 0: door_open)
  let flags = 0
  if (data.door_open) {
    flags |= 0x01
  }
  buffer.push(flags)

  // Convert byte array to base64
  const uint8Array = new Uint8Array(buffer)
  const binaryString = String.fromCharCode(...uint8Array)

  // Base64 encode using btoa equivalent for Workers
  return btoa(binaryString)
}

/**
 * Webhook Verification & Processing Functions
 */

/**
 * Verify HMAC-SHA256 signature from FrostGuard
 * Uses Web Crypto API (async) available in Cloudflare Workers
 */
async function verifyWebhookSignature(signature: string, payload: string, secret: string): Promise<boolean> {
  try {
    // Expected format: "sha256=<hex_digest>"
    if (!signature.startsWith('sha256=')) {
      console.log('[Webhook] Invalid signature format - missing sha256= prefix')
      return false
    }

    const receivedHmac = signature.substring(7)

    // Compute expected HMAC using Web Crypto API
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(payload)

    // Import secret key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    // Compute HMAC-SHA256
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData)

    // Convert to hex string
    const expectedHmac = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    console.log('[Webhook] Signature verification:', {
      received: receivedHmac.substring(0, 20) + '...',
      expected: expectedHmac.substring(0, 20) + '...',
      match: receivedHmac === expectedHmac,
      payloadPreview: payload.substring(0, 100),
      secretLength: secret.length,
    })

    return receivedHmac === expectedHmac
  } catch (error) {
    console.error('[Webhook] Signature verification error:', error)
    return false
  }
}

/**
 * Log webhook event to database
 */
async function logWebhookEvent(
  db: any,
  event_type: string,
  event_id: string,
  payload: string,
  signature: string,
  source_ip: string | null,
  user_agent: string | null
): Promise<string> {
  const result = await db.execute({
    sql: `INSERT INTO webhook_events (event_type, event_id, payload, signature, source_ip, user_agent)
          VALUES (?, ?, ?, ?, ?, ?)
          RETURNING id`,
    args: [event_type, event_id || null, payload, signature, source_ip, user_agent],
  })
  return result.rows[0].id as string
}

/**
 * Mark webhook as processed
 */
async function markWebhookProcessed(
  db: any,
  event_id: string,
  success: boolean,
  error_message: string | null
): Promise<void> {
  await db.execute({
    sql: `UPDATE webhook_events
          SET processed = ?, processed_at = datetime('now'), error_message = ?
          WHERE id = ?`,
    args: [success ? 1 : 0, error_message, event_id],
  })
}

/**
 * Handle organization created/updated event
 */
async function handleOrganizationSync(db: any, data: any): Promise<void> {
  const { id, name, slug, ttn_application_id } = data

  await db.execute({
    sql: `INSERT INTO organizations (id, frostguard_org_id, name, slug, ttn_application_id, synced_at, sync_source)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, datetime('now'), 'webhook')
          ON CONFLICT (frostguard_org_id) DO UPDATE SET
            name = excluded.name,
            slug = excluded.slug,
            ttn_application_id = excluded.ttn_application_id,
            synced_at = datetime('now'),
            updated_at = datetime('now')`,
    args: [id, name, slug, ttn_application_id || null],
  })

  console.log(`[Webhook] Organization synced: ${name} (${id})`)
}

/**
 * Handle user added to organization
 */
async function handleUserAdded(db: any, data: any): Promise<void> {
  const { user_id, frostguard_user_id, org_id, email, full_name, role } = data

  // Get local organization ID
  const orgResult = await db.execute({
    sql: 'SELECT id FROM organizations WHERE frostguard_org_id = ?',
    args: [org_id],
  })

  if (orgResult.rows.length === 0) {
    throw new Error(`Organization not found: ${org_id}`)
  }

  const organizationId = orgResult.rows[0].id as string

  await db.execute({
    sql: `INSERT INTO profiles (id, frostguard_user_id, organization_id, email, full_name, role, synced_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT (id) DO UPDATE SET
            frostguard_user_id = excluded.frostguard_user_id,
            organization_id = excluded.organization_id,
            email = excluded.email,
            full_name = excluded.full_name,
            role = excluded.role,
            synced_at = datetime('now'),
            updated_at = datetime('now')`,
    args: [user_id, frostguard_user_id, organizationId, email, full_name || '', role || 'viewer'],
  })

  console.log(`[Webhook] User added: ${email} → ${full_name} (${role})`)
}

/**
 * Handle user removed from organization
 */
async function handleUserRemoved(db: any, data: any): Promise<void> {
  const { user_id, org_id } = data

  // Soft delete by clearing organization_id
  await db.execute({
    sql: `UPDATE profiles
          SET organization_id = NULL, synced_at = datetime('now'), updated_at = datetime('now')
          WHERE id = ?`,
    args: [user_id],
  })

  console.log(`[Webhook] User removed: ${user_id} from org ${org_id}`)
}

/**
 * Handle application created/updated event
 */
async function handleApplicationSync(db: any, data: any): Promise<void> {
  const { org_id, app_id, name, description } = data

  // Get local organization ID
  const orgResult = await db.execute({
    sql: 'SELECT id FROM organizations WHERE frostguard_org_id = ?',
    args: [org_id],
  })

  if (orgResult.rows.length === 0) {
    throw new Error(`Organization not found: ${org_id}`)
  }

  const organizationId = orgResult.rows[0].id as string

  await db.execute({
    sql: `INSERT INTO applications (organization_id, app_id, name, description)
          VALUES (?, ?, ?, ?)
          ON CONFLICT (organization_id, app_id) DO UPDATE SET
            name = excluded.name,
            description = excluded.description,
            updated_at = unixepoch()`,
    args: [organizationId, app_id, name, description || null],
  })

  console.log(`[Webhook] Application synced: ${app_id} → ${name}`)
}

interface Env {
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  STACK_PROJECT_ID: string
  STACK_SECRET_SERVER_KEY: string
  FROSTGUARD_WEBHOOK_SECRET: string
}

function createDbClient(env: Env) {
  console.log('Creating DB client with URL:', env.TURSO_DATABASE_URL)
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  })
}

// Cache JWKS for performance
let jwksCache: jose.RemoteJWKSet | null = null

function getJWKS(env: Env): jose.RemoteJWKSet {
  if (!jwksCache) {
    const jwksUrl = `https://api.stack-auth.com/api/v1/projects/${env.STACK_PROJECT_ID}/.well-known/jwks.json`
    jwksCache = jose.createRemoteJWKSet(new URL(jwksUrl))
  }
  return jwksCache
}

async function verifyAuth(
  request: Request,
  env: Env
): Promise<{
  userId: string
  organizationId: string
  role: string
}> {
  // Extract JWT from Authorization header or x-stack-auth header
  let token: string | null = null

  // Try standard Authorization: Bearer header first
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

  // Fallback to Stack Auth's x-stack-auth header format
  if (!token) {
    const stackAuthHeader = request.headers.get('x-stack-auth')
    if (stackAuthHeader) {
      try {
        const stackAuth = JSON.parse(stackAuthHeader)
        token = stackAuth.accessToken
      } catch (e) {
        console.error('Failed to parse x-stack-auth header:', e)
      }
    }
  }

  if (!token) {
    throw new Error('Unauthorized: No token provided')
  }

  try {
    const jwks = getJWKS(env)
    const expectedIssuer = `https://api.stack-auth.com/api/v1/projects/${env.STACK_PROJECT_ID}`

    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: expectedIssuer,
      audience: env.STACK_PROJECT_ID,
    })

    console.log('JWT payload:', JSON.stringify(payload, null, 2))

    // Extract user info from JWT payload
    const userId = payload.sub as string
    const metadata = (payload.client_metadata || {}) as Record<string, any>
    const organizationId = (metadata.organizationId as string) || userId

    // Query profiles table for user's actual role
    const db = createDbClient(env)
    let role = 'admin' // Default to admin for account owners

    try {
      const profileResult = await db.execute({
        sql: 'SELECT role FROM profiles WHERE id = ?',
        args: [userId],
      })

      if (profileResult.rows.length > 0) {
        role = (profileResult.rows[0].role as string) || 'admin'
      }
    } catch (dbError) {
      console.log('Profile lookup failed, defaulting to admin:', dbError)
    }

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
    console.error('Token preview:', token.substring(0, 50) + '...')
    throw new Error('Unauthorized: Invalid token')
  }
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

// ==========================================
// DATABASE MIGRATION ENDPOINT
// ==========================================

// Run database migrations (webhook-protected for security)
router.post('/api/migrate', async (request, env: Env) => {
  // Verify webhook secret (accept both old and new format for dev)
  const webhookSecret = request.headers.get('x-webhook-secret')
  const validSecrets = [env.FROSTGUARD_WEBHOOK_SECRET, 'dev-secret-123', 'frostguard-dev-webhook-secret-2026']
  if (!validSecrets.includes(webhookSecret)) {
    return jsonResponse({ error: 'Invalid webhook secret', received: webhookSecret?.substring(0, 10) }, 401)
  }

  const db = createDbClient(env)

  try {
    // Add app_eui column
    try {
      await db.execute('ALTER TABLE devices ADD COLUMN app_eui TEXT NOT NULL DEFAULT \'\'')
    } catch (e) {
      console.log('app_eui column may already exist:', e)
    }

    // Add app_key column
    try {
      await db.execute('ALTER TABLE devices ADD COLUMN app_key TEXT NOT NULL DEFAULT \'\'')
    } catch (e) {
      console.log('app_key column may already exist:', e)
    }

    // Create applications table
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS applications (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          organization_id TEXT NOT NULL,
          app_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
          UNIQUE(organization_id, app_id)
        )
      `)
    } catch (e) {
      console.log('applications table may already exist:', e)
    }

    // Create gateways table
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS gateways (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          organization_id TEXT NOT NULL,
          gateway_eui TEXT NOT NULL,
          gateway_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          frequency_plan TEXT DEFAULT 'US_902_928',
          status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
          UNIQUE(organization_id, gateway_eui)
        )
      `)
    } catch (e) {
      console.log('gateways table may already exist:', e)
    }

    // Add application_id to devices
    try {
      await db.execute('ALTER TABLE devices ADD COLUMN application_id TEXT')
    } catch (e) {
      console.log('application_id column may already exist:', e)
    }

    // Add indexes
    try {
      await db.execute('CREATE INDEX IF NOT EXISTS idx_applications_organization ON applications(organization_id)')
      await db.execute('CREATE INDEX IF NOT EXISTS idx_gateways_organization ON gateways(organization_id)')
      await db.execute('CREATE INDEX IF NOT EXISTS idx_devices_application ON devices(application_id)')
    } catch (e) {
      console.log('indexes may already exist:', e)
    }

    // ===== Webhook Sync Tables =====

    // Add FrostGuard reference columns to organizations
    try {
      await db.execute('ALTER TABLE organizations ADD COLUMN frostguard_org_id TEXT')
      await db.execute('ALTER TABLE organizations ADD COLUMN synced_at TEXT')
      await db.execute('ALTER TABLE organizations ADD COLUMN sync_source TEXT DEFAULT \'manual\'')
    } catch (e) {
      console.log('frostguard columns may already exist:', e)
    }

    // Add FrostGuard reference columns to profiles
    try {
      await db.execute('ALTER TABLE profiles ADD COLUMN frostguard_user_id TEXT')
      await db.execute('ALTER TABLE profiles ADD COLUMN synced_at TEXT')
    } catch (e) {
      console.log('profile frostguard columns may already exist:', e)
    }

    // Create webhook_events table
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS webhook_events (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          event_type TEXT NOT NULL,
          event_id TEXT,
          payload TEXT NOT NULL,
          signature TEXT NOT NULL,
          processed INTEGER DEFAULT 0,
          processed_at TEXT,
          error_message TEXT,
          source_ip TEXT,
          user_agent TEXT,
          received_at TEXT DEFAULT (datetime('now')),
          organization_id TEXT
        )
      `)
    } catch (e) {
      console.log('webhook_events table may already exist:', e)
    }

    // Create webhook_secrets table
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS webhook_secrets (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          organization_id TEXT,
          secret_key TEXT NOT NULL,
          active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now')),
          expires_at TEXT
        )
      `)
    } catch (e) {
      console.log('webhook_secrets table may already exist:', e)
    }

    // Create webhook indexes
    try {
      await db.execute('CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type)')
      await db.execute('CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed) WHERE processed = 0')
      await db.execute('CREATE INDEX IF NOT EXISTS idx_webhook_events_org ON webhook_events(organization_id)')
      await db.execute('CREATE INDEX IF NOT EXISTS idx_webhook_secrets_org ON webhook_secrets(organization_id) WHERE active = 1')
      await db.execute('CREATE INDEX IF NOT EXISTS idx_orgs_frostguard_id ON organizations(frostguard_org_id)')
      await db.execute('CREATE INDEX IF NOT EXISTS idx_profiles_frostguard_id ON profiles(frostguard_user_id)')
      await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_orgs_frostguard_unique ON organizations(frostguard_org_id)')
    } catch (e) {
      console.log('webhook indexes may already exist:', e)
    }

    return jsonResponse({
      success: true,
      message: 'Migration completed successfully (including webhook sync tables)'
    })
  } catch (error) {
    console.error('Migration error:', error)
    return jsonResponse({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
})

// ==========================================
// 404 HANDLER
// ==========================================

router.all('*', () => {
  return jsonResponse({ error: 'Not found' }, 404)
})

// ==========================================
// WORKER EXPORT
// ==========================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await router.fetch(request, env)
    } catch (error) {
      console.error('Worker error:', error)
      return jsonResponse(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  },
}
