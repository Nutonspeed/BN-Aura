import { useQuery } from '@tanstack/react-query';

export interface SalesStats {
  newLeads: number;
  conversionRate: number;
  proposalsSent: number;
  activePipeline: number;
}

export interface SalesTarget {
  target: { target_amount: number };
  actualSales: number;
  progress: number;
}

export function useSalesStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['sales-stats'],
    queryFn: async () => {
      const response = await fetch('/api/reports?type=sales_overview');
      if (!response.ok) throw new Error('Failed to fetch sales stats');
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch sales stats');
      
      return result.data as SalesStats;
    },
    enabled: options?.enabled !== false,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useSalesTarget(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['sales-target'],
    queryFn: async () => {
      const response = await fetch('/api/sales/targets');
      if (!response.ok) throw new Error('Failed to fetch sales target');
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch sales target');
      
      return result.data as SalesTarget;
    },
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
