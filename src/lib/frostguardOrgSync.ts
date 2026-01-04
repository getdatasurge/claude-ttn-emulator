/**
 * FrostGuard Organization Sync
 * Integration with FrostGuard API for canonical organization data
 *
 * Status: Pending FrostGuard API implementation
 *
 * Core functionality:
 * - Pull canonical data from FrostGuard API
 * - Sync sites, units, sensors
 * - Handle data conflicts and updates
 * - Maintain sync state and timestamps
 *
 * Features to implement:
 * 1. fetchOrgState(): Get organization state from FrostGuard
 * 2. syncSites(): Sync sites data
 * 3. syncUnits(): Sync units data
 * 4. syncSensors(): Sync sensors data
 * 5. getSyncStatus(): Get last sync timestamp and status
 *
 * Integration points (via Cloudflare Workers):
 * - POST /api/sync/organization - Webhook receiver for org updates
 * - POST /api/sync/user - Webhook receiver for user updates
 * - POST /api/frostguard-sync - Unified webhook handler
 *
 * Database tables: organizations, sites, units, sensors
 *
 * Reference: CLAUDE.md "Multi-Tenant Design"
 */

import { apiClient } from './api'

export interface SyncStatus {
  lastSyncAt: Date | null
  status: 'idle' | 'syncing' | 'error'
  error?: string
}

export interface FrostGuardOrg {
  id: string
  name: string
  sites?: FrostGuardSite[]
}

export interface FrostGuardSite {
  id: string
  name: string
  address?: string
  units?: FrostGuardUnit[]
}

export interface FrostGuardUnit {
  id: string
  name: string
  unitType?: string
  sensors?: FrostGuardSensor[]
}

export interface FrostGuardSensor {
  id: string
  name: string
  sensorType?: string
  deviceId?: string
}

/**
 * FrostGuard Organization Sync Service
 * Handles bidirectional sync between FrostGuard and the emulator
 */
export const frostguardOrgSync = {
  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    const lastSyncStr = localStorage.getItem('frostguard_last_sync')
    return {
      lastSyncAt: lastSyncStr ? new Date(lastSyncStr) : null,
      status: 'idle',
    }
  },

  /**
   * Trigger a manual sync from FrostGuard
   * Note: This requires FrostGuard API to be configured
   */
  async triggerSync(): Promise<{ success: boolean; message: string }> {
    // This will be implemented when FrostGuard provides the API
    // For now, sync is triggered via webhooks from FrostGuard
    return {
      success: false,
      message: 'Manual sync not yet implemented - sync is triggered via FrostGuard webhooks',
    }
  },

  /**
   * Verify webhook connectivity with FrostGuard
   */
  async verifyWebhookConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      // Check if our webhook endpoints are accessible
      const health = await apiClient.get<{ status: string }>('/health')
      return {
        connected: health.status === 'ok',
        message: health.status === 'ok'
          ? 'Webhook endpoints are accessible'
          : 'Health check returned unexpected status',
      }
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Failed to verify webhook connection',
      }
    }
  },
}

export default frostguardOrgSync
