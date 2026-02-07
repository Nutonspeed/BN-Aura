'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { 
  ChartBar,
  TrendUp,
  Package,
  Clock,
  SpinnerGap
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface QuotaData {
  monthlyQuota: number;
  currentUsage: number;
  plan: string;
  resetDate: string;
  overage: number;
  overageRate: number;
}

interface UsageStats {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  utilizationRate: number;
}

export default function QuotaManagement() {
  const { getClinicId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotaData();
  }, []);

  const fetchQuotaData = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = getClinicId();
      if (!clinicId) { setLoading(false); return; }

      const [quotaResponse, statsResponse] = await Promise.all([
        fetch(`/api/quota/billing-test?action=quota-config&clinicId=${clinicId}`),
        fetch(`/api/quota/billing-test?action=usage-stats&clinicId=${clinicId}`)
      ]);

      if (!quotaResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch quota data');
      }

      const quotaResult = await quotaResponse.json();
      const statsResult = await statsResponse.json();

      if (quotaResult.success && quotaResult.data) {
        setQuotaData(quotaResult.data);
      }

      if (statsResult.success && statsResult.data) {
        setUsageStats(statsResult.data);
      }

    } catch (err) {
      console.error('Error fetching quota data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const calculateUsagePercentage = () => {
    if (!quotaData) return 0;
    return Math.round((quotaData.currentUsage / quotaData.monthlyQuota) * 100);
  };

  const getRemainingDays = () => {
    if (!quotaData) return 0;
    const resetDate = new Date(quotaData.resetDate);
    const now = new Date();
    const diffTime = resetDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <ChartBar weight="duotone" className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Quota Management</h1>
          <p className="text-sm text-muted-foreground">Resource Allocation Center</p>
        </div>
      </div>

      {error && (
        <div className="text-center py-8 text-red-500">
          <p>Error loading quota data: {error}</p>
          <button 
            onClick={fetchQuotaData}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: 'Used Quota', 
            value: `${calculateUsagePercentage()}%`, 
            icon: ChartBar, 
            color: calculateUsagePercentage() > 80 ? 'text-red-500' : 'text-blue-500',
            subtitle: quotaData ? `${quotaData.currentUsage}/${quotaData.monthlyQuota} scans` : ''
          },
          { 
            title: 'Remaining', 
            value: `${100 - calculateUsagePercentage()}%`, 
            icon: Package, 
            color: 'text-emerald-500',
            subtitle: quotaData ? `${quotaData.monthlyQuota - quotaData.currentUsage} scans left` : ''
          },
          { 
            title: 'Utilization', 
            value: usageStats ? `${usageStats.utilizationRate.toFixed(1)}%` : '0%', 
            icon: TrendUp, 
            color: 'text-primary',
            subtitle: quotaData?.plan ? `${quotaData.plan} plan` : ''
          },
          { 
            title: 'Reset In', 
            value: `${getRemainingDays()} days`, 
            icon: Clock, 
            color: 'text-amber-500',
            subtitle: quotaData?.resetDate ? new Date(quotaData.resetDate).toLocaleDateString() : ''
          },
        ].map((stat, idx) => (
          <Card key={idx} className="p-6 rounded-2xl border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                <p className="text-2xl font-black mt-1">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                )}
              </div>
              <stat.icon weight="duotone" className={`w-8 h-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Quota Management & Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 rounded-2xl border-border/50">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-black uppercase flex items-center gap-3">
              <Package weight="duotone" className="w-6 h-6 text-emerald-500" />
              Resource Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Improved tracking capabilities active</p>
                <p className="text-sm mt-2">Real-time quota monitoring and alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-8 rounded-2xl border-border/50">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-black uppercase flex items-center gap-3">
              <TrendUp weight="duotone" className="w-6 h-6 text-primary" />
              Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Advanced quota analytics</p>
                <p className="text-sm mt-2">Usage patterns and optimization insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
