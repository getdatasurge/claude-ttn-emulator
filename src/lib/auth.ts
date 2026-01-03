/**
 * FusionAuth Integration
 * Authentication and authorization helpers
 *
 * Note: FusionAuth will be self-hosted and configured separately
 * This file provides the client-side integration points
 */

export interface User {
  id: string
  email: string
  fullName?: string
  organizationId: string
  role: 'admin' | 'manager' | 'viewer'
}

export interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * FusionAuth configuration
 * These will be set once FusionAuth is deployed
 */
const FUSIONAUTH_URL = import.meta.env.VITE_FUSIONAUTH_URL || ''
// Reserved for future use when FusionAuth is configured
// const FUSIONAUTH_CLIENT_ID = import.meta.env.VITE_FUSIONAUTH_CLIENT_ID || ''
// const FUSIONAUTH_TENANT_ID = import.meta.env.VITE_FUSIONAUTH_TENANT_ID || ''

/**
 * Get current authenticated user from session storage
 */
export function getCurrentUser(): User | null {
  const userJson = sessionStorage.getItem('user')
  if (!userJson) return null

  try {
    return JSON.parse(userJson) as User
  } catch {
    return null
  }
}

/**
 * Save user to session storage
 */
export function setCurrentUser(user: User) {
  sessionStorage.setItem('user', JSON.stringify(user))
}

/**
 * Get auth token from session storage
 */
export function getAuthToken(): string | null {
  return sessionStorage.getItem('accessToken')
}

/**
 * Save auth token to session storage
 */
export function setAuthToken(token: AuthToken) {
  sessionStorage.setItem('accessToken', token.accessToken)
  sessionStorage.setItem('refreshToken', token.refreshToken)
}

/**
 * Clear authentication data (logout)
 */
export function clearAuth() {
  sessionStorage.removeItem('user')
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('refreshToken')
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken() && !!getCurrentUser()
}

/**
 * Check if user has required role
 */
export function hasRole(requiredRole: 'admin' | 'manager' | 'viewer'): boolean {
  const user = getCurrentUser()
  if (!user) return false

  const roleHierarchy = { admin: 3, manager: 2, viewer: 1 }
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

/**
 * Login with FusionAuth
 * TODO: Implement once FusionAuth is deployed
 */
export async function login(email: string, password: string): Promise<User> {
  // Placeholder for FusionAuth integration
  // Will be implemented once FusionAuth is self-hosted

  if (!FUSIONAUTH_URL) {
    throw new Error('FusionAuth not configured yet')
  }

  // This will call FusionAuth OAuth2 endpoints
  // Example flow:
  // 1. POST to /oauth2/token with email and password
  // 2. Get user info from /oauth2/userinfo
  // 3. Map to our User type
  // 4. Store in session

  console.log('Login attempted for:', email, password ? '***' : 'no password')
  throw new Error('Not implemented - FusionAuth setup required')
}

/**
 * Logout from FusionAuth
 * TODO: Implement once FusionAuth is deployed
 */
export async function logout(): Promise<void> {
  clearAuth()

  if (!FUSIONAUTH_URL) {
    return
  }

  // Will call FusionAuth logout endpoint
  // Example: POST to /oauth2/logout
}

/**
 * Refresh access token
 * TODO: Implement once FusionAuth is deployed
 */
export async function refreshAccessToken(): Promise<AuthToken> {
  const refreshToken = sessionStorage.getItem('refreshToken')

  if (!refreshToken || !FUSIONAUTH_URL) {
    throw new Error('No refresh token or FusionAuth not configured')
  }

  // Will call FusionAuth token refresh endpoint
  // Example: POST to /oauth2/token with grant_type=refresh_token

  throw new Error('Not implemented - FusionAuth setup required')
}

/**
 * Get authorization header for API requests
 */
export function getAuthHeader(): { Authorization: string } | Record<string, never> {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
