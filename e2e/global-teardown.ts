/**
 * Playwright Global Teardown
 * Runs after all test suites complete
 */

import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...')

  try {
    // Clean up test data, stop mock servers, etc.
    console.log('⚙️ Performing cleanup tasks...')
    
    // Example cleanup tasks:
    // - Clear test database
    // - Stop mock servers
    // - Clean up uploaded files
    // - Reset API state
    
    console.log('✅ Global teardown completed')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error here to avoid masking test failures
  }
}

export default globalTeardown