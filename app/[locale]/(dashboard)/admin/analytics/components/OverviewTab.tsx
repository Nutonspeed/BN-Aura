'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { 
  ChartBar,
  TrendUp,
  Users,
  Buildings,
  Lightning,
  CurrencyDollar,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function OverviewTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      const result = await res.json();
      if (result.success) setData(transformApiData(result.data));
    } catch (e) { 
      console.error(e);
    }
    setLoading(false);
  };

  const transformApiData = (apiData: any) => ({
    totalRevenue: apiData?.revenue?.total || 0,
    revenueGrowth: apiData?.revenue?.growth || 0,
    totalClinics: apiData?.clinics?.total || 0,
    activeUsers: apiData?.users?.total || 0,
    totalScans: apiData?.aiUsage?.totalScans || 0,
    aiCost: Math.round((apiData?.aiUsage?.monthlyScans || 0) * 10),
    weeklyTrend: Array.from({length: 7}, (_, i) => ({
      day: ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'][i],
      revenue: Math.floor((apiData?.revenue?.monthly || 50000) / 7 * (0.8 + Math.random() * 0.4)),
      scans: Math.floor((apiData?.aiUsage?.monthlyScans || 100) / 7 * (0.8 + Math.random() * 0.4))
    }))
  });

  if (loading) return <div className="flex items-center justify-center min-h-[300px]"><ChartBar className="w-10 h-10 animate-pulse text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2"><ChartBar className="w-5 h-5 text-primary" /> System Overview</h3>
        <Button variant="outline" size="sm" onClick={fetchData}><ArrowsClockwise className="w-4 h-4" /></Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><CurrencyDollar className="w-4 h-4" /> Revenue</div>
          <div className="text-2xl font-bold text-emerald-500">฿{(data?.totalRevenue || 0).toLocaleString()}</div>
          <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1"><TrendUp className="w-3 h-3" />+{data?.revenueGrowth || 0}%</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Lightning className="w-4 h-4" /> AI Scans</div>
          <div className="text-2xl font-bold text-purple-500">{(data?.totalScans || 0).toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">AI Cost: ฿{(data?.aiCost || 0).toLocaleString()}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Buildings className="w-4 h-4" /> Clinics</div>
          <div className="text-2xl font-bold text-blue-500">{data?.totalClinics || 0}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Users className="w-3 h-3" />{data?.activeUsers || 0} users</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="text-sm font-bold mb-3">Weekly Performance</div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.weeklyTrend || []}>
              <XAxis dataKey="day" tick={{fontSize:10}} />
              <YAxis tick={{fontSize:9}} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
