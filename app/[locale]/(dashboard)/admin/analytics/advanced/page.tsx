'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import {
  Building2, Users, Camera, DollarSign, TrendingUp, Activity,
  BarChart3, PieChart, Download, RefreshCw,
} from 'lucide-react';
import { 
  SpinnerGap
} from '@phosphor-icons/react';

export default function AdminAdvancedAnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [period]);

  const stats = data ? {
    totalClinics: data.clinics?.total || 0,
    activeClinics: data.clinics?.active || 0,
    totalUsers: data.users?.total || 0,
    monthlyScans: data.aiUsage?.totalScans || 0,
    totalRevenue: data.revenue?.total || 0,
    growthRate: data.revenue?.growth || 0,
  } : { totalClinics: 0, activeClinics: 0, totalUsers: 0, monthlyScans: 0, totalRevenue: 0, growthRate: 0 };

  const clinicPerformance = data?.aiUsage?.topClinics?.map((c: any) => ({
    label: c.clinic, value: c.scans
  })) || [];

  const revenueByPlan = data?.revenue?.byPlan?.map((p: any, i: number) => ({
    label: p.plan, value: p.count, color: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'][i % 4]
  })) || [];

  const goals = [
    { name: 'Clinics', current: stats.totalClinics, target: Math.max(stats.totalClinics, 30), color: '#8B5CF6' },
    { name: 'Revenue', current: stats.totalRevenue, target: Math.max(stats.totalRevenue, 3500000), color: '#10B981' },
    { name: 'Users', current: stats.totalUsers, target: Math.max(stats.totalUsers, 2500), color: '#3B82F6' },
    { name: 'AI Scans', current: stats.monthlyScans, target: Math.max(stats.monthlyScans, 20000), color: '#F59E0B' },
  ];

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <SpinnerGap weight="bold" className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">System-wide performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p === '7d' ? '7 วัน' : p === '30d' ? '30 วัน' : p === '90d' ? '90 วัน' : '1 ปี'}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw size={16} />
          </Button>
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: 'Total Clinics', value: stats.totalClinics, icon: Building2, color: 'text-purple-500' },
          { title: 'Active Clinics', value: stats.activeClinics, icon: Activity, color: 'text-green-500' },
          { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
          { title: 'Monthly Scans', value: stats.monthlyScans, icon: Camera, color: 'text-amber-500' },
          { title: 'Revenue (THB)', value: stats.totalRevenue, icon: DollarSign, color: 'text-emerald-500', prefix: '฿' },
          { title: 'Growth Rate', value: stats.growthRate, icon: TrendingUp, color: 'text-pink-500', suffix: '%' },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={18} className={s.color} />
                <span className="text-xs text-muted-foreground">{s.title}</span>
              </div>
              <p className="text-xl font-bold">{s.prefix || ''}{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}{s.suffix || ''}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Clinics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={18} />
              Top Performing Clinics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clinicPerformance.length > 0 ? clinicPerformance.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                  <span className="flex-1 text-sm">{item.label}</span>
                  <span className="font-medium text-sm">{item.value?.toLocaleString()} scans</span>
                </div>
              )) : <p className="text-sm text-muted-foreground">No data available</p>}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart size={18} />
              Subscriptions by Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueByPlan.length > 0 ? revenueByPlan.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="flex-1">{item.label}</span>
                  <span className="font-medium">{item.value} clinics</span>
                </div>
              )) : <p className="text-sm text-muted-foreground">No data available</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Quarterly Goals Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {goals.map((goal, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{goal.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${goal.target > 0 ? (goal.current / goal.target) * 100 : 0}%`,
                      backgroundColor: goal.color,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {goal.current.toLocaleString()} / {goal.target.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
