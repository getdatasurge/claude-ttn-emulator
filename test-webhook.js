/**
 * Test FrostGuard Webhook Sync
 * Generates HMAC signature and sends test webhook to emulator
 */

import crypto from 'crypto';

const WEBHOOK_URL = 'http://localhost:8787/api/frostguard-sync';
const WEBHOOK_SECRET = 'frostguard-dev-webhook-secret-2026';

// Test webhook payloads
const testEvents = [
  {
    name: 'Organization Created',
    payload: {
      event_type: 'organization.created',
      event_id: 'evt_test_org_001',
      timestamp: new Date().toISOString(),
      data: {
        id: 'fg-org-uuid-test-001',
        name: 'Test Organization',
        slug: 'test-org',
        ttn_application_id: 'test-org-app',
        ttn_cluster: 'nam1',
      },
    },
  },
  {
    name: 'User Added to Org',
    payload: {
      event_type: 'user.added_to_org',
      event_id: 'evt_test_user_001',
      timestamp: new Date().toISOString(),
      data: {
        user_id: 'f057bad9-f54b-4114-a386-8ce4a28932d6',
        frostguard_user_id: 'fg-user-uuid-test-001',
        org_id: 'fg-org-uuid-test-001',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'admin',
      },
    },
  },
  {
    name: 'Application Created',
    payload: {
      event_type: 'application.created',
      event_id: 'evt_test_app_001',
      timestamp: new Date().toISOString(),
      data: {
        org_id: 'fg-org-uuid-test-001',
        app_id: 'test-warehouse-app',
        name: 'Test Warehouse Application',
        description: 'Test TTN application for webhook sync',
      },
    },
  },
];

/**
 * Generate HMAC-SHA256 signature
 */
function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return 'sha256=' + hmac.digest('hex');
}

/**
 * Send webhook with signature
 */
async function sendWebhook(eventName, payload) {
  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString, WEBHOOK_SECRET);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${eventName}`);
  console.log(`${'='.repeat(60)}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('Payload String (first 100):', payloadString.substring(0, 100));
  console.log('Secret:', WEBHOOK_SECRET);
  console.log('Signature:', signature);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-FrostGuard-Signature': signature,
      },
      body: payloadString,
    });

    const result = await response.json();

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ SUCCESS');
    } else {
      console.log('❌ FAILED');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('FrostGuard Webhook Sync Test');
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('Secret:', WEBHOOK_SECRET.substring(0, 20) + '...');

  for (const event of testEvents) {
    await sendWebhook(event.name, event.payload);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms between tests
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('All tests completed!');
  console.log(`${'='.repeat(60)}\n`);
}

// Run tests
runTests().catch(console.error);
