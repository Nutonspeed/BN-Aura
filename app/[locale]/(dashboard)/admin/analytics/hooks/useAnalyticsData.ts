'use client';

import { useState, useEffect, useCallback } from 'react';

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    byPlan: { plan: string; amount: number; count: number }[];
  };
  clinics: {
    total: number;
    active: number;
    growth: number;
    newThisMonth: number;
    churnRate: number;
  };
  users: {
    total: number;
    active: number;
    growth: number;
    byRole: { role: string; count: number }[];
  };
  aiUsage: {
    totalScans: number;
    monthlyScans: number;
    growth: number;
    avgPerClinic: number;
    topClinics: { clinic: string; scans: number; clinicId: string }[];
  };
}

export const useAnalyticsData = (selectedPeriod: string) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const refreshData = useCallback(() => {
    setLoading(true);
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refreshData
  };
};
