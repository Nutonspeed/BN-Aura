/**
 * BN-Aura Canonical Route Permissions
 * Single source of truth for route → role access control.
 * Used by: middleware.ts, lib/supabase/middleware.ts, and layout.tsx (reference).
 *
 * Rules are matched longest-prefix-first so more specific routes override general ones.
 */

import type { AppRole } from './effectiveRole'

type RoutePermissionMap = Record<string, AppRole[]>

export const ROUTE_PERMISSIONS: RoutePermissionMap = {
  // ── Admin (super_admin only) ──────────────────────────────
  '/admin': ['super_admin'],

  // ── Clinic ────────────────────────────────────────────────
  '/clinic': ['clinic_owner', 'clinic_admin', 'clinic_staff'],
  '/clinic/settings': ['clinic_owner'],
  '/clinic/staff': ['clinic_owner', 'clinic_admin', 'clinic_staff'],
  '/clinic/inventory': ['clinic_owner', 'clinic_admin', 'clinic_staff'],
  '/clinic/treatments': ['clinic_owner', 'clinic_admin', 'clinic_staff'],
  // Shared clinic routes (cross-role)
  '/clinic/pos': ['clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff'],
  '/clinic/appointments': ['clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff', 'customer', 'premium_customer', 'free_customer', 'free_user'],
  '/clinic/chat': ['clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff', 'customer', 'premium_customer', 'free_customer', 'free_user'],

  // ── Sales ─────────────────────────────────────────────────
  '/sales': ['clinic_owner', 'sales_staff'],
  '/sales/skin-analysis': ['sales_staff'],
  '/sales/leads': ['clinic_owner', 'sales_staff'],
  '/sales/proposals': ['clinic_owner', 'sales_staff'],

  // ── Beautician ────────────────────────────────────────────
  '/beautician': ['clinic_staff'],

  // ── Customer ──────────────────────────────────────────────
  '/customer': ['customer', 'premium_customer', 'free_customer', 'free_user'],

  // ── Shared ────────────────────────────────────────────────
  '/shared/chat': ['clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff', 'customer', 'premium_customer', 'free_customer', 'free_user'],
}

// Pre-sorted keys: longest first for prefix matching
const sortedRouteKeys = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length)

/**
 * Check if a role has access to a given route path.
 * @param routePath - path WITHOUT locale prefix (e.g. '/clinic/staff')
 * @param role - effective role string
 * @returns true if allowed, true if no rule matches (unprotected route)
 */
export function hasRouteAccess(routePath: string, role: string): boolean {
  for (const route of sortedRouteKeys) {
    if (routePath.startsWith(route)) {
      return ROUTE_PERMISSIONS[route].includes(role as AppRole)
    }
  }
  // No rule found → allow (unprotected route)
  return true
}

/**
 * Get the correct redirect path for a given role when access is denied.
 * @param role - effective role string
 * @param locale - 'th' | 'en'
 */
export function getRedirectForRole(role: string, locale: string = 'th'): string {
  switch (role) {
    case 'super_admin':
      return `/${locale}/admin`
    case 'clinic_owner':
    case 'clinic_admin':
    case 'clinic_staff':
      return `/${locale}/clinic`
    case 'sales_staff':
      return `/${locale}/sales`
    case 'customer':
    case 'premium_customer':
    case 'free_customer':
    case 'free_user':
      return `/${locale}/customer`
    default:
      return `/${locale}/login`
  }
}
