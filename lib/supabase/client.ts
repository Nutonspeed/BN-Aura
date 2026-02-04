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
              // Try standard Supabase key first
              let value = localStorage.getItem(`sb-${name}`);
              // If not found, try the actual Supabase key format
              if (!value) {
                value = localStorage.getItem(name);
              }
              return value || undefined;
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
              // Store with both key formats for compatibility
              localStorage.setItem(`sb-${name}`, value);
              localStorage.setItem(name, value);
              
              // Also set cookie for server-side middleware access
              document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=86400; SameSite=Lax`;
            } catch (e) {
              console.error('Failed to set session in localStorage/cookie:', e);
            }
          }
        },
        remove(name: string, options: any) {
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem(`sb-${name}`);
              localStorage.removeItem(name);
              
              // Also remove cookie
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
