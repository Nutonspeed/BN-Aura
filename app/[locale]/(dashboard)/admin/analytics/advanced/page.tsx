'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { StatCard, GoalProgress } from '@/components/widgets';
import { SkinMetricsRadar, ComparisonBar, Sparkline } from '@/components/charts';
import { CountUp } from '@/components/ui/Animations';
import {
  Building2, Users, Camera, DollarSign, TrendingUp, Activity,
  Calendar, BarChart3, PieChart, Download, RefreshCw,
} from 'lucide-react';

export default function AdminAdvancedAnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  const stats = {
    totalClinics: 24,
    activeClinics: 22,
    totalUsers: 1847,
    monthlyScans: 15420,
    totalRevenue: 2845000,
    growthRate: 23.5,
  };

  const clinicPerformance = [
    { label: 'Bangkok Premium', value: 4520 },
    { label: 'Chiang Mai Beauty', value: 3280 },
    { label: 'Phuket Aesthetics', value: 2890 },
    { label: 'Pattaya Clinic', value: 2150 },
    { label: 'Hua Hin Skin', value: 1890 },
  ];

  const revenueByPlan = [
    { label: 'Enterprise', value: 45, color: '#8B5CF6' },
    { label: 'Premium', value: 30, color: '#3B82F6' },
    { label: 'Professional', value: 18, color: '#10B981' },
    { label: 'Starter', value: 7, color: '#F59E0B' },
  ];

  const monthlyTrend = [45, 52, 48, 61, 55, 67, 72, 68, 85, 79, 92, 98];

  const goals = [
    { name: 'New Clinics', current: 22, target: 30, color: '#8B5CF6' },
    { name: 'Monthly Revenue', current: 2845000, target: 3500000, color: '#10B981' },
    { name: 'Active Users', current: 1847, target: 2500, color: '#3B82F6' },
    { name: 'AI Scans', current: 15420, target: 20000, color: '#F59E0B' },
  ];

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
          <Button variant="outline" size="icon">
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
        <StatCard
          title="Total Clinics"
          value={stats.totalClinics}
          change={8.2}
          icon={<Building2 size={18} className="text-purple-500" />}
          color="#8B5CF6"
        />
        <StatCard
          title="Active Clinics"
          value={stats.activeClinics}
          change={4.5}
          icon={<Activity size={18} className="text-green-500" />}
          color="#10B981"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          change={12.3}
          icon={<Users size={18} className="text-blue-500" />}
          color="#3B82F6"
        />
        <StatCard
          title="Monthly Scans"
          value={stats.monthlyScans}
          change={18.7}
          icon={<Camera size={18} className="text-amber-500" />}
          color="#F59E0B"
        />
        <StatCard
          title="Revenue (THB)"
          value={stats.totalRevenue}
          prefix="฿"
          change={23.5}
          icon={<DollarSign size={18} className="text-emerald-500" />}
          color="#059669"
        />
        <StatCard
          title="Growth Rate"
          value={stats.growthRate}
          suffix="%"
          change={5.2}
          icon={<TrendingUp size={18} className="text-pink-500" />}
          color="#EC4899"
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Clinics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={18} />
              Top Performing Clinics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonBar data={clinicPerformance} horizontal showValues />
          </CardContent>
        </Card>

        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart size={18} />
              Revenue by Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueByPlan.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="flex-1">{item.label}</span>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={18} />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-end">
              <Sparkline data={monthlyTrend} width={280} height={120} showArea />
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
                    {Math.round((goal.current / goal.target) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${(goal.current / goal.target) * 100}%`,
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
