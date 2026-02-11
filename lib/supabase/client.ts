import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Bypass navigator.locks which causes getSession() to hang indefinitely
        // when the lock is acquired but never released by the internal auth process
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
          return await fn()
        },
      },
    }
  )
}
