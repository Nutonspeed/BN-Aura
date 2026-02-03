import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Read session from localStorage for persistence
          if (typeof window !== 'undefined') {
            try {
              return localStorage.getItem(`sb-${name}`) || undefined;
            } catch (e) {
              console.error('Failed to read session from localStorage:', e);
              return undefined;
            }
          }
          return undefined;
        },
        set(name: string, value: string, options: any) {
          // Use localStorage as fallback for session persistence
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`sb-${name}`, value);
            } catch (e) {
              console.error('Failed to set session in localStorage:', e);
            }
          }
        },
        remove(name: string, options: any) {
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem(`sb-${name}`);
            } catch (e) {
              console.error('Failed to remove session from localStorage:', e);
            }
          }
        },
      },
    }
  )
}
