import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveEffectiveRole, type EffectiveRoleResult, type AppRole } from './effectiveRole'

/**
 * BN-Aura API Auth Helpers
 * Standardized auth + role enforcement for all API routes.
 * Uses the unified effective role resolver.
 */

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'AuthError'
  }
}

/**
 * Authenticate the request and resolve the user's effective role.
 * Throws AuthError(401) if no valid session.
 */
export async function requireAuth(): Promise<EffectiveRoleResult & { supabase: Awaited<ReturnType<typeof createClient>> }> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError('Unauthorized', 401)
  }

  const roleResult = await resolveEffectiveRole(supabase, user.id)
  return { ...roleResult, supabase }
}

/**
 * Authenticate and enforce that the user has one of the allowed roles.
 * Throws AuthError(401) if not authenticated.
 * Throws AuthError(403) if role not in allowedRoles.
 */
export async function requireRole(
  allowedRoles: AppRole[]
): Promise<EffectiveRoleResult & { supabase: Awaited<ReturnType<typeof createClient>> }> {
  const result = await requireAuth()

  if (!allowedRoles.includes(result.role as AppRole)) {
    throw new AuthError('Forbidden: insufficient role', 403)
  }

  return result
}

/**
 * Shortcut: require super_admin role.
 */
export async function requireSuperAdmin(): Promise<EffectiveRoleResult & { supabase: Awaited<ReturnType<typeof createClient>> }> {
  return requireRole(['super_admin'])
}

/**
 * Guard: reject requests in production for dev-only endpoints.
 * Returns a 404 response if NODE_ENV is 'production'.
 */
export function devOnly(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return null
}

/**
 * Convert AuthError to a proper NextResponse.
 * Use in catch blocks of API routes.
 */
export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error('[withAuth] Unexpected error:', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
