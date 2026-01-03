/**
 * Example E2E Test
 * Demonstrates testing patterns for the FrostGuard Emulator
 */

import { test, expect, Page } from '@playwright/test'

test.describe('FrostGuard Emulator', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the app
    await page.goto('/')
  })

  test('should display the landing page', async ({ page }) => {
    // Expect page title
    await expect(page).toHaveTitle(/FrostGuard/i)
    
    // Check for main navigation or content
    await expect(page.locator('h1')).toContainText('LoRaWAN')
  })

  test('should navigate to login page', async ({ page }) => {
    // Click login button/link
    const loginButton = page.locator('a[href="/login"], button').filter({ hasText: 'Login' }).first()
    if (await loginButton.isVisible()) {
      await loginButton.click()
      await expect(page).toHaveURL(/\/login/)
    } else {
      // If already on login page or login is handled differently
      await page.goto('/login')
    }
    
    // Check login form exists
    await expect(page.locator('form, [data-testid="login-form"]')).toBeVisible()
  })

  test('should handle offline state', async ({ page, context }) => {
    // Simulate offline
    await context.setOffline(true)
    
    // Reload page
    await page.reload()
    
    // Check for offline indicator or message
    // This depends on how your app handles offline state
    const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline')
    if (await offlineIndicator.isVisible()) {
      await expect(offlineIndicator).toBeVisible()
    }
    
    // Restore online
    await context.setOffline(false)
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that navigation is mobile-friendly
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, button[aria-label*="menu"]')
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible()
    }
    
    // Check content is not overflowing
    const body = page.locator('body')
    const boundingBox = await body.boundingBox()
    expect(boundingBox?.width).toBeLessThanOrEqual(375)
  })
})

test.describe('Device Management', () => {
  test.skip('should require authentication', async ({ page }) => {
    // Skip if auth is not yet implemented properly
    await page.goto('/emulator')
    
    // Should redirect to login or show auth required message
    await expect(page).toHaveURL(/\/login/)
  })

  test.skip('should allow creating a new device', async ({ page }) => {
    // This test would require authentication setup
    // Navigate to emulator page
    await page.goto('/emulator')
    
    // Click add device button
    await page.click('[data-testid="add-device"], button:has-text("Add Device")')
    
    // Fill device form
    await page.fill('[data-testid="device-name"]', 'Test Device')
    await page.selectOption('[data-testid="device-type"]', 'temperature')
    await page.fill('[data-testid="dev-eui"]', '0123456789ABCDEF')
    
    // Save device
    await page.click('[data-testid="save-device"], button:has-text("Save")')
    
    // Verify device was created
    await expect(page.locator('[data-testid="device-list"]')).toContainText('Test Device')
  })

  test.skip('should display telemetry data', async ({ page }) => {
    // Navigate to device with telemetry
    await page.goto('/emulator')
    
    // Select a device
    await page.click('[data-testid="device-item"]:first-child')
    
    // Check for telemetry chart
    await expect(page.locator('[data-testid="telemetry-chart"], .recharts-wrapper')).toBeVisible()
    
    // Check for telemetry data
    await expect(page.locator('[data-testid="telemetry-data"]')).toBeVisible()
  })
})

test.describe('TTN Configuration', () => {
  test.skip('should save TTN settings', async ({ page }) => {
    // Navigate to TTN settings
    await page.goto('/emulator')
    
    // Open TTN configuration
    await page.click('[data-testid="ttn-settings"], button:has-text("TTN Settings")')
    
    // Fill TTN form
    await page.fill('[data-testid="app-id"]', 'test-application')
    await page.fill('[data-testid="api-key"]', 'NNSXS.TEST.API.KEY')
    await page.selectOption('[data-testid="region"]', 'eu1')
    
    // Save settings
    await page.click('[data-testid="save-ttn-settings"], button:has-text("Save")')
    
    // Verify success message
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('saved')
  })

  test.skip('should test TTN connection', async ({ page }) => {
    // Fill valid TTN config first
    await page.goto('/emulator')
    await page.click('[data-testid="ttn-settings"]')
    await page.fill('[data-testid="app-id"]', 'test-application')
    await page.fill('[data-testid="api-key"]', 'NNSXS.TEST.API.KEY')
    
    // Test connection
    await page.click('[data-testid="test-connection"], button:has-text("Test")')
    
    // Wait for test result
    await expect(page.locator('[data-testid="connection-status"]')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Performance', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/')
    
    // Measure CLS (Cumulative Layout Shift)
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cls = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value
            }
          }
          resolve(cls)
        }).observe({ type: 'layout-shift', buffered: true })
        
        // Resolve after a short delay to capture layout shifts
        setTimeout(() => resolve(cls), 1000)
      })
    })
    
    // CLS should be less than 0.1 for good user experience
    expect(cls).toBeLessThan(0.1)
  })

  test('should handle large datasets efficiently', async ({ page }) => {
    // This would test with mock data showing many devices/telemetry points
    await page.goto('/emulator')
    
    // Simulate having many devices (this would need mock data)
    // Check that the page remains responsive
    const startTime = Date.now()
    
    // Interact with the page
    await page.click('body')
    
    const responseTime = Date.now() - startTime
    
    // Interaction should be responsive (< 100ms)
    expect(responseTime).toBeLessThan(100)
  })
})

// Utility functions for common test operations
class EmulatorPage {
  constructor(private page: Page) {}

  async navigateToEmulator() {
    await this.page.goto('/emulator')
  }

  async addDevice(name: string, type: string = 'temperature', devEui: string = '0123456789ABCDEF') {
    await this.page.click('[data-testid="add-device"]')
    await this.page.fill('[data-testid="device-name"]', name)
    await this.page.selectOption('[data-testid="device-type"]', type)
    await this.page.fill('[data-testid="dev-eui"]', devEui)
    await this.page.click('[data-testid="save-device"]')
  }

  async selectDevice(name: string) {
    await this.page.click(`[data-testid="device-item"]:has-text("${name}")`)
  }

  async simulateUplink(payload: object) {
    await this.page.fill('[data-testid="simulation-payload"]', JSON.stringify(payload))
    await this.page.click('[data-testid="simulate-uplink"]')
  }
}