import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof window !== 'undefined') {
            try {
              return localStorage.getItem(name) || undefined;
            } catch (e) {
              console.error('Failed to read session from localStorage:', e);
              return undefined;
            }
          }
          return undefined;
        },
        set(name: string, value: string, options: any) {
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(name, value);
              document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=86400; SameSite=Lax`;
            } catch (e) {
              console.error('Failed to set session in localStorage/cookie:', e);
            }
          }
        },
        remove(name: string, options: any) {
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem(name);
              document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            } catch (e) {
              console.error('Failed to remove session from localStorage/cookie:', e);
            }
          }
        },
      },
    }
  )
}
