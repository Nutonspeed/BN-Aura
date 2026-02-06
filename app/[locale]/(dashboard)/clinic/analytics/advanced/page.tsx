'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnalyticsIcon, AIBrainIcon, ImprovementIcon, SuccessIcon } from '@/components/ui/icons';

export default function AdvancedAnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  }, [period]);

  const stats = {
    analyses: period === '7d' ? 156 : period === '30d' ? 623 : 1847,
    customers: period === '7d' ? 89 : period === '30d' ? 312 : 894,
    revenue: period === '7d' ? 245000 : period === '30d' ? 980000 : 2940000,
    conversion: 72.3,
  };

  const treatments = [
    { name: 'Pico Genesis', count: 87, revenue: 696000 },
    { name: 'HydraFacial', count: 124, revenue: 434000 },
    { name: 'Botox', count: 56, revenue: 336000 },
  ];

  const staff = [
    { name: 'คุณสมหญิง', analyses: 89, bookings: 67, rate: 75.3 },
    { name: 'คุณวิภา', analyses: 76, bookings: 54, rate: 71.1 },
    { name: 'คุณอรุณ', analyses: 65, bookings: 48, rate: 73.8 },
  ];

  const insights = [
    'ลูกค้า Score ต่ำกว่า 60 มีโอกาสจอง Treatment สูงกว่า 2.5 เท่า',
    'วันเสาร์มี Conversion Rate สูงสุด (78%)',
    'Time Travel prediction เพิ่มโอกาสจอง 35%',
  ];

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
    </div>
  );
}
