import { SupabaseClient } from '@supabase/supabase-js'

/**
 * BN-Aura Unified Effective Role Resolver
 * Single source of truth for determining a user's effective role.
 * Used by: middleware, API routes, and aligned with client-side useAuth hook.
 *
 * Resolution order:
 * 1. If users.role === 'super_admin' → super_admin (global)
 * 2. Else if active clinic_staff record exists → use newest (created_at DESC)
 * 3. Else fall back to users.role
 * 4. Else 'guest'
 */

export interface EffectiveRoleResult {
  userId: string
  role: string
  clinicId: string | null
  isSuperAdmin: boolean
  fullName: string | null
}

export type AppRole =
  | 'super_admin'
  | 'clinic_owner'
  | 'clinic_admin'
  | 'clinic_staff'
  | 'sales_staff'
  | 'beautician'
  | 'customer'
  | 'premium_customer'
  | 'free_customer'
  | 'free_user'
  | 'guest'

export async function resolveEffectiveRole(
  supabase: SupabaseClient,
  userId: string
): Promise<EffectiveRoleResult> {
  // Step 1: Fetch user profile from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, clinic_id, full_name')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    console.error('[effectiveRole] Error fetching user profile:', userError.message)
  }

  // Step 2: If super_admin, return immediately (no clinic context needed)
  if (userData?.role === 'super_admin') {
    return {
      userId,
      role: 'super_admin',
      clinicId: null,
      isSuperAdmin: true,
      fullName: userData.full_name || null,
    }
  }

  // Step 3: Fetch the newest active clinic_staff record
  const { data: staffData, error: staffError } = await supabase
    .from('clinic_staff')
    .select('role, clinic_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (staffError && staffError.code !== 'PGRST116') {
    console.error('[effectiveRole] Error fetching clinic_staff:', staffError.message)
  }

  // Step 4: Determine effective role
  if (staffData) {
    return {
      userId,
      role: staffData.role,
      clinicId: staffData.clinic_id,
      isSuperAdmin: false,
      fullName: userData?.full_name || null,
    }
  }

  // Step 5: Fall back to users table role
  return {
    userId,
    role: userData?.role || 'guest',
    clinicId: userData?.clinic_id || null,
    isSuperAdmin: false,
    fullName: userData?.full_name || null,
  }
}
