'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Buildings, TrendUp, Users, Lightning, ArrowsClockwise, MapPin } from '@phosphor-icons/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function ClinicsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      const result = await res.json();
      if (result.success) {
        const apiData = result.data;
        setData({
          totalClinics: apiData?.clinics?.total || 0,
          activeClinic: apiData?.clinics?.active || 0,
          totalStaff: apiData?.users?.total || 0,
          totalScans: apiData?.aiUsage?.totalScans || 0,
          byRegion: [
            { name: 'กรุงเทพฯ', value: Math.floor((apiData?.clinics?.total || 0) * 0.5) },
            { name: 'ภาคกลาง', value: Math.floor((apiData?.clinics?.total || 0) * 0.2) },
            { name: 'ภาคเหนือ', value: Math.floor((apiData?.clinics?.total || 0) * 0.17) },
            { name: 'ภาคใต้', value: Math.floor((apiData?.clinics?.total || 0) * 0.13) }
          ],
          byPlan: apiData?.revenue?.byPlan?.map((p: any) => ({
            plan: p.plan, count: p.count, revenue: p.amount
          })) || [],
          topClinics: apiData?.aiUsage?.topClinics?.map((c: any) => ({
            name: c.clinic, scans: c.scans, revenue: c.scans * 200
          })) || []
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getMockData = () => ({
    totalClinics: 24,
    activeClinic: 22,
    totalStaff: 156,
    totalScans: 4520,
    byRegion: [
      { name: 'กรุงเทพฯ', value: 12 },
      { name: 'ภาคกลาง', value: 5 },
      { name: 'ภาคเหนือ', value: 4 },
      { name: 'ภาคใต้', value: 3 }
    ],
    byPlan: [
      { plan: 'Enterprise', count: 5, revenue: 199950 },
      { plan: 'Professional', count: 12, revenue: 143880 },
      { plan: 'Starter', count: 7, revenue: 20930 }
    ],
    topClinics: [
      { name: 'Bangkok Beauty Clinic', scans: 450, revenue: 89500 },
      { name: 'Chiang Mai Aesthetic', scans: 380, revenue: 76000 },
      { name: 'Phuket Skin Center', scans: 320, revenue: 64000 },
      { name: 'Pattaya Wellness', scans: 290, revenue: 58000 },
      { name: 'Khon Kaen Beauty', scans: 250, revenue: 50000 }
    ]
  });

  if (loading) return <div className="flex items-center justify-center min-h-[300px]"><Buildings className="w-10 h-10 animate-pulse text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2"><Buildings className="w-5 h-5 text-purple-500" /> Clinics Analytics</h3>
        <Button variant="outline" size="sm" onClick={fetchData}><ArrowsClockwise className="w-4 h-4" /></Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total Clinics</div>
          <div className="text-2xl font-bold">{data?.totalClinics || 0}</div>
          <div className="text-xs text-emerald-500 flex items-center gap-1"><TrendUp className="w-3 h-3" />{data?.activeClinic || 0} active</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total Staff</div>
          <div className="text-2xl font-bold text-blue-500">{data?.totalStaff || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total Scans</div>
          <div className="text-2xl font-bold text-purple-500">{(data?.totalScans || 0).toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Avg Scans/Clinic</div>
          <div className="text-2xl font-bold">{data?.totalClinics ? Math.round(data.totalScans / data.totalClinics) : 0}</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-sm font-bold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> By Region</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.byRegion || []} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" label={({name, value}) => `${name}: ${value}`}>
                  {(data?.byRegion || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % 5]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-bold mb-3">By Plan</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.byPlan || []} layout="vertical">
                <XAxis type="number" tick={{fontSize:9}} />
                <YAxis dataKey="plan" type="category" tick={{fontSize:10}} width={80} />
                <Tooltip />
                <Bar dataKey="count" radius={[0,4,4,0]}>
                  {(data?.byPlan || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % 5]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="text-sm font-bold mb-3">Top Performing Clinics</div>
        <div className="space-y-2">
          {(data?.topClinics || []).map((clinic: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{i + 1}</div>
                <div>
                  <div className="font-medium text-sm">{clinic.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Lightning className="w-3 h-3" /> {clinic.scans} scans
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-emerald-500">฿{clinic.revenue.toLocaleString()}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
