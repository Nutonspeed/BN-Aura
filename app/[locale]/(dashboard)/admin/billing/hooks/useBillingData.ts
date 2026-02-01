import { useState, useEffect, useCallback } from 'react';

export interface Subscription {
  id: string;
  clinic_id: string;
  clinic_name: string;
  plan: 'starter' | 'professional' | 'premium' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  amount: number;
  currency: string;
  payment_method: string;
  next_billing_date: string;
  auto_renew: boolean;
}

export interface BillingStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  pastDueCount: number;
  churnRate: number;
  mrr: number;
}

export function useBillingData() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<BillingStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    pastDueCount: 0,
    churnRate: 0,
    mrr: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/billing');
      const data = await response.json();
      
      if (data.success) {
        setSubscriptions(data.data.subscriptions);
        setStats(data.data.stats);
      } else {
        setError(data.error || 'Failed to fetch billing data');
      }
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const refreshData = useCallback(() => {
    setLoading(true);
    fetchBillingData();
  }, [fetchBillingData]);

  return {
    subscriptions,
    stats,
    loading,
    error,
    refreshData
  };
}
