/**
 * Stack Auth Configuration
 * Separate authentication system for the emulator
 * Users are mirrored from FrostGuard via webhook
 */

import { StackClientApp, useUser } from '@stackframe/react'

// Check if Stack Auth is properly configured
const projectId = import.meta.env.VITE_STACK_PROJECT_ID || ''
const publishableKey = import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY || ''

// UUID regex pattern
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isStackAuthConfigured =
  uuidPattern.test(projectId) && publishableKey.length > 0

// Only create the app if properly configured, otherwise create a dummy
export const stackClientApp = isStackAuthConfigured
  ? new StackClientApp({
      projectId,
      publishableClientKey: publishableKey,
      tokenStore: 'cookie',
    })
  : null as any // Will be wrapped in conditional rendering

/**
 * Get current authenticated user
 */
export function useStackAuth() {
  const user = useUser()

  return {
    user,
    isAuthenticated: !!user,
    userId: user?.id,
    email: user?.primaryEmail,
    displayName: user?.displayName,
    // Extract organization from custom user metadata or team
    organizationId: user?.selectedTeam?.id || user?.clientMetadata?.organizationId as string | undefined || user?.id,
    role: user?.clientMetadata?.role as string | undefined || 'viewer',
  }
}

/**
 * Get auth header for API requests
 */
export async function getStackAuthHeader(user: any): Promise<Record<string, string>> {
  if (!user) return {}

  try {
    const authJson = await user.getAuthJson()
    return {
      Authorization: `Bearer ${authJson.accessToken}`,
    }
  } catch (error) {
    console.error('Failed to get auth token:', error)
    return {}
  }
}
