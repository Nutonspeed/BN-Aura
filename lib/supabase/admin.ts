import { createClient } from '@supabase/supabase-js'

/**
 * BN-Aura Admin Supabase Client
 * USES SERVICE ROLE KEY - BYPASSES RLS
 * Use only in server-side contexts where RLS is not appropriate (e.g. background processing)
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
