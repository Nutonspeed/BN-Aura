'use client';

import { useRouter } from '@/i18n/routing';
import { useCallback } from 'react';

/**
 * Hook for safe back navigation with a fallback path.
 * If there's history to go back to, it uses router.back().
 * Otherwise, it navigates to the provided fallback path.
 */
export function useBackNavigation() {
  const router = useRouter();

  const goBack = useCallback((fallbackPath: string) => {
    // Basic check for history length. 
    // Usually, if length > 2, there's a previous page in our app.
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      router.push(fallbackPath as any);
    }
  }, [router]);

  return { goBack };
}
