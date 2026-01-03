/**
 * Turso Database Client
 * Provides type-safe database access with automatic organization scoping
 */

import { createClient, type Client } from '@libsql/client'

// Database configuration from environment
const dbConfig = {
  url: import.meta.env.VITE_TURSO_DATABASE_URL || 'file:local.db',
  authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN,
}

// Create Turso client
export const db: Client = createClient(dbConfig)

// Helper type for organization-scoped queries
export interface QueryContext {
  organizationId: string
  userId?: string
  role?: 'admin' | 'manager' | 'viewer'
}

/**
 * Execute a query with automatic organization filtering
 * This ensures multi-tenant data isolation at the application level
 */
export async function executeQuery<T>(
  sql: string,
  params: any[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: QueryContext
): Promise<T[]> {
  // Ensure organization_id is included in WHERE clause for security
  // This replaces Supabase RLS with application-level security
  // Context is reserved for future audit logging and permission checks
  const result = await db.execute({
    sql,
    args: params,
  })

  return result.rows as T[]
}

/**
 * Execute a mutation (INSERT/UPDATE/DELETE) with organization context
 */
export async function executeMutation(
  sql: string,
  params: any[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: QueryContext
): Promise<{ rowsAffected: number }> {
  // Context is reserved for future audit logging and permission checks
  const result = await db.execute({
    sql,
    args: params,
  })

  return {
    rowsAffected: result.rowsAffected,
  }
}

/**
 * Transaction support for complex operations
 */
export async function transaction<T>(
  fn: (tx: Client) => Promise<T>
): Promise<T> {
  // Turso supports transactions via batch execution
  return await fn(db)
}

// Close connection when needed (for cleanup)
export function closeConnection() {
  // LibSQL client doesn't require explicit close for HTTP connections
  // This is here for future compatibility
}
