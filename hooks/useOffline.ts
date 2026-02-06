'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineSync } from '@/lib/offline/offlineSync';

// Hook for offline status
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending actions
    offlineSync.getPendingActions().then(actions => setPendingCount(actions.length));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline) return { success: 0, failed: 0 };
    const result = await offlineSync.syncAll();
    const actions = await offlineSync.getPendingActions();
    setPendingCount(actions.length);
    return result;
  }, [isOnline]);

  return { isOnline, pendingCount, syncNow };
}

// Hook for offline-first data fetching
export function useOfflineData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600000
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      // Try cache first
      const cached = await offlineSync.getCachedData<T>(key);
      if (cached) {
        setData(cached);
        setIsStale(true);
      }

      // Try fresh data if online
      if (navigator.onLine) {
        try {
          const fresh = await fetcher();
          setData(fresh);
          setIsStale(false);
          await offlineSync.cacheData(key, fresh, ttl);
        } catch (err) {
          if (!cached) {
            setError('ไม่สามารถโหลดข้อมูลได้');
          }
        }
      } else if (!cached) {
        setError('ไม่มีการเชื่อมต่ออินเทอร์เน็ต');
      }

      setIsLoading(false);
    }

    loadData();
  }, [key, ttl]);

  const refresh = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsLoading(true);
    try {
      const fresh = await fetcher();
      setData(fresh);
      setIsStale(false);
      await offlineSync.cacheData(key, fresh, ttl);
    } catch {
      setError('ไม่สามารถรีเฟรชได้');
    }
    setIsLoading(false);
  }, [key, ttl]);

  return { data, isLoading, error, isStale, refresh };
}

// Hook for offline-first mutations
export function useOfflineMutation<T>(endpoint: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOnline } = useOfflineStatus();

  const mutate = useCallback(async (
    type: 'create' | 'update' | 'delete',
    data: T
  ): Promise<{ success: boolean; queued: boolean }> => {
    setIsSubmitting(true);

    if (isOnline) {
      try {
        const response = await fetch(endpoint, {
          method: type === 'delete' ? 'DELETE' : type === 'update' ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        setIsSubmitting(false);
        return { success: response.ok, queued: false };
      } catch {
        // Fall through to queue
      }
    }

    // Queue for later sync
    await offlineSync.queueAction({ type, endpoint, data });
    setIsSubmitting(false);
    return { success: true, queued: true };
  }, [endpoint, isOnline]);

  return { mutate, isSubmitting };
}

export default { useOfflineStatus, useOfflineData, useOfflineMutation };
