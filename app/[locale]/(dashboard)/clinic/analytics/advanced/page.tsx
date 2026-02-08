'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import VoCAnalyticsWidget from '@/components/analytics/VoCAnalyticsWidget';
import CohortAnalysis from '@/components/analytics/CohortAnalysis';
import AIPerformanceMetrics from '@/components/analytics/AIPerformanceMetrics';
import RevenueAnalytics from '@/components/analytics/RevenueAnalytics';
import { AnalyticsIcon, AIBrainIcon, ImprovementIcon, SuccessIcon } from '@/components/ui/icons';

export default function AdvancedAnalyticsPage() {
  const { getClinicId } = useAuth();
  const clinicId = getClinicId();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ analyses: 0, customers: 0, revenue: 0, conversion: 0 });
  const [treatments, setTreatments] = useState<{ name: string; count: number; revenue: number }[]>([]);
  const [staff, setStaff] = useState<{ name: string; analyses: number; bookings: number; rate: number }[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [vocData, setVocData] = useState<any>(null);
  const [cohortData, setCohortData] = useState<any[]>([]);
  const [aiMetrics, setAiMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewRes, aiRes, predictiveRes] = await Promise.all([
          fetch('/api/analytics/advanced?type=overview'),
          fetch('/api/analytics/advanced?type=ai'),
          fetch('/api/analytics/advanced?type=predictive'),
        ]);
        const [overview, ai, predictive] = await Promise.all([
          overviewRes.json(), aiRes.json(), predictiveRes.json(),
        ]);
        if (overview.success && overview.data) {
          const d = overview.data;
          setStats({
            analyses: d.totalBookings || 0,
            customers: d.activeCustomers || 0,
            revenue: d.totalRevenue || 0,
            conversion: d.conversionRate || 0,
          });
          setTreatments((d.topTreatments || []).map((t: any) => ({
            name: t.treatmentName || t.name,
            count: t.bookings || 0,
            revenue: t.revenue || 0,
          })));
        }
        if (ai.success && ai.data) {
          setStaff(ai.data.staffPerformance || []);
        }
        if (predictive.success && predictive.data) {
          setInsights(predictive.data.recommendations || predictive.data.insights || []);
          // VoC Analytics data — will be populated from real feedback data
          setVocData(null);
          // Cohort data — will be populated from real retention analytics
          setCohortData([]);
          // AI metrics — will be populated from real AI usage analytics
          setAiMetrics(null);
        }
      } catch (e) {
        console.error('Failed to fetch advanced analytics:', e);
      }
      setLoading(false);
    };
    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AnalyticsIcon size="lg" /> Advanced Analytics
          </h1>
          <p className="text-sm text-muted-foreground">AI Skin Analysis Performance</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p)}>
              {p === '7d' ? '7 วัน' : p === '30d' ? '30 วัน' : '90 วัน'}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Analyses</p>
            <p className="text-2xl font-bold">{stats.analyses.toLocaleString()}</p>
            <p className="text-xs text-green-500">+12.5%</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Customers</p>
            <p className="text-2xl font-bold">{stats.customers.toLocaleString()}</p>
            <p className="text-xs text-green-500">+8.7%</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold">฿{stats.revenue.toLocaleString()}</p>
            <p className="text-xs text-green-500">+18.2%</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Conversion</p>
            <p className="text-2xl font-bold">{stats.conversion}%</p>
            <p className="text-xs text-muted-foreground">Analysis→Booking</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Treatments */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Top Treatments</h3>
            {treatments.map((t, i) => (
              <div key={i} className="flex justify-between py-2 border-b last:border-0">
                <span>{t.name}</span>
                <span className="text-muted-foreground">{t.count} • ฿{t.revenue.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Staff */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Staff Performance</h3>
            {staff.map((s, i) => (
              <div key={i} className="flex justify-between py-2 border-b last:border-0">
                <span>{s.name}</span>
                <span className={cn('font-bold', s.rate >= 70 ? 'text-green-500' : 'text-amber-500')}>
                  {s.rate}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="bg-purple-500/5">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AIBrainIcon size="md" /> AI Insights
            </h3>
            {insights.map((insight, i) => (
              <div key={i} className="p-2 bg-background rounded mb-2 text-sm">
                💡 {insight}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Voice of Customer Analytics */}
      {vocData && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <SuccessIcon size="md" /> Voice of Customer
            </h3>
            <VoCAnalyticsWidget data={vocData} />
          </CardContent>
        </Card>
      )}

      {/* Cohort Retention Analysis */}
      {cohortData.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <CohortAnalysis data={cohortData} />
          </CardContent>
        </Card>
      )}

      {/* AI Performance Metrics */}
      {aiMetrics && (
        <Card>
          <CardContent className="p-6">
            <AIPerformanceMetrics data={aiMetrics} />
          </CardContent>
        </Card>
      )}

      {/* Revenue Analytics - Treatment Conversion Funnel */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-6">
          <RevenueAnalytics />
        </CardContent>
      </Card>
    </div>
  );
}
