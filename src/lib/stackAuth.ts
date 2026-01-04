/**
 * Stack Auth Configuration
 * Separate authentication system for the emulator
 * Users are mirrored from FrostGuard via webhook
 */

// Check if Stack Auth is properly configured BEFORE importing
const projectId = import.meta.env.VITE_STACK_PROJECT_ID || ''
const publishableKey = import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY || ''

// UUID regex pattern
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isStackAuthConfigured =
  uuidPattern.test(projectId) && publishableKey.length > 0

// Placeholder types when Stack Auth is not available
export type StackUser = {
  id: string
  primaryEmail?: string
  displayName?: string
  selectedTeam?: { id: string }
  clientMetadata?: Record<string, unknown>
  getAuthJson?: () => Promise<{ accessToken: string }>
  getAuthHeaders?: () => Promise<Record<string, string>>
  signOut?: () => Promise<void>
}

// Only export stackClientApp and useUser when configured
export let stackClientApp: any = null
export let useUser: () => StackUser | null = () => null

// Dynamically import Stack Auth only if configured
if (isStackAuthConfigured) {
  import('@stackframe/react').then(({ StackClientApp, useUser: stackUseUser }) => {
    stackClientApp = new StackClientApp({
      projectId,
      publishableClientKey: publishableKey,
      tokenStore: 'cookie',
    })
    useUser = stackUseUser
  }).catch((err) => {
    console.warn('Failed to load Stack Auth:', err)
  })
}

/**
 * Get current authenticated user
 * Returns dummy values when Stack Auth is not configured
 */
export function useStackAuth() {
  // If not configured, return empty auth state
  if (!isStackAuthConfigured) {
    return {
      user: null,
      isAuthenticated: false,
      userId: undefined,
      email: undefined,
      displayName: undefined,
      organizationId: 'default',
      role: 'viewer',
    }
  }

  const user = useUser()

  return {
    user,
    isAuthenticated: !!user,
    userId: user?.id,
    email: user?.primaryEmail,
    displayName: user?.displayName,
    // Extract organization from custom user metadata or team
    organizationId: user?.selectedTeam?.id || (user?.clientMetadata?.organizationId as string | undefined) || user?.id,
    role: (user?.clientMetadata?.role as string | undefined) || 'viewer',
  }
}

/**
 * Get auth header for API requests
 */
export async function getStackAuthHeader(user: StackUser | null): Promise<Record<string, string>> {
  if (!user || !user.getAuthJson) return {}

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
