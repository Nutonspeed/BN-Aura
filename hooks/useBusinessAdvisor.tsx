'use client';

import { useState, useCallback, useEffect } from 'react';
import { BusinessInsight } from '@/lib/ai/businessAdvisor';

interface UseBusinessAdvisorReturn {
  insight: BusinessInsight | null;
  loading: boolean;
  error: string | null;
  askQuestion: (question: string, timeframe?: string) => Promise<void>;
  getQuickInsights: () => Promise<any>;
  getAlerts: () => Promise<any>;
  getDashboardSummary: () => Promise<any>;
  clearError: () => void;
}

export function useBusinessAdvisor(): UseBusinessAdvisorReturn {
  const [insight, setInsight] = useState<BusinessInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askQuestion = useCallback(async (question: string, timeframe: string = 'month') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/business-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'query',
          query: question,
          timeframe
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setInsight(result.insight);
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI advisor response';
      setError(errorMessage);
      console.error('Business Advisor Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getQuickInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/business-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quick_insights'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.insights;
      } else {
        throw new Error(result.error || 'Failed to get quick insights');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get quick insights';
      setError(errorMessage);
      console.error('Quick Insights Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAlerts = useCallback(async () => {
    // ป้องกันการเรียก API ระหว่าง SSG/SSR
    if (typeof window === 'undefined') {
      return { alerts: [] };
    }

    try {
      const response = await fetch('/api/ai/business-advisor?type=alerts', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.alerts;
      } else {
        throw new Error(result.error || 'Failed to get alerts');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get alerts';
      setError(errorMessage);
      console.error('Alerts Error:', err);
      return null;
    }
  }, []);

  const getDashboardSummary = useCallback(async () => {
    // ป้องกันการเรียก API ระหว่าง SSG/SSR
    if (typeof window === 'undefined') {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/business-advisor?type=dashboard_summary', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.summary;
      } else {
        throw new Error(result.error || 'Failed to get dashboard summary');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get dashboard summary';
      setError(errorMessage);
      console.error('Dashboard Summary Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    insight,
    loading,
    error,
    askQuestion,
    getQuickInsights,
    getAlerts,
    getDashboardSummary,
    clearError
  };
}

/**
 * Hook for getting business metrics with caching
 */
export function useBusinessMetrics(refreshInterval: number = 5 * 60 * 1000) {
  const [metrics, setMetrics] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getDashboardSummary } = useBusinessAdvisor();

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const summary = await getDashboardSummary();
      if (summary) {
        setMetrics(summary);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, [getDashboardSummary]);

  const shouldRefresh = useCallback(() => {
    if (!lastUpdated) return true;
    return Date.now() - lastUpdated.getTime() > refreshInterval;
  }, [lastUpdated, refreshInterval]);

  const refreshIfNeeded = useCallback(() => {
    if (shouldRefresh()) {
      fetchMetrics();
    }
  }, [shouldRefresh, fetchMetrics]);

  useEffect(() => {
    fetchMetrics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    metrics,
    lastUpdated,
    loading,
    error,
    refresh: fetchMetrics,
    refreshIfNeeded
  };
}

/**
 * Hook for managing business alerts with auto-refresh
 */
export function useBusinessAlerts(refreshInterval: number = 3 * 60 * 1000) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getAlerts } = useBusinessAdvisor();

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const alertsData = await getAlerts();
      if (alertsData && alertsData.alerts) {
        setAlerts(alertsData.alerts);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [getAlerts]);

  // Auto-refresh alerts
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, refreshInterval);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    alerts,
    loading,
    error,
    refresh: fetchAlerts,
    criticalCount: alerts.filter(a => a.severity === 'critical').length,
    highCount: alerts.filter(a => a.severity === 'high').length
  };
}
