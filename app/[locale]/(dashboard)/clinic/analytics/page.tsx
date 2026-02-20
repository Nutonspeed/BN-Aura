'use client';

import { ChartBar, SpinnerGap, TrendUp, Users, CurrencyCircleDollar } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { Link } from '@/i18n/routing';

export default function ClinicAnalytics() {
  const [stats, setStats] = useState({ customers: 0, appointments: 0, staff: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data: staffInfo } = await sb.from('clinic_staff').select('clinic_id').eq('user_id', user.id).maybeSingle();
      if (!staffInfo?.clinic_id) { setLoading(false); return; }
      const cid = staffInfo.clinic_id;
      const [c, a, s] = await Promise.all([
        sb.from('customers').select('id', { count: 'exact', head: true }).eq('clinic_id', cid),
        sb.from('appointments').select('id', { count: 'exact', head: true }).eq('clinic_id', cid),
        sb.from('clinic_staff').select('id', { count: 'exact', head: true }).eq('clinic_id', cid),
      ]);
      setStats({ customers: c.count || 0, appointments: a.count || 0, staff: s.count || 0 });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><SpinnerGap className="w-10 h-10 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <Breadcrumb />
      <div className="flex items-center gap-3 text-primary text-xs font-bold uppercase tracking-widest">
        <ChartBar className="w-4 h-4" />
        วิเคราะห์ข้อมูล
      </div>
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Users className="w-4 h-4" /> ลูกค้าทั้งหมด</div>
          <p className="text-3xl font-bold">{stats.customers}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendUp className="w-4 h-4" /> นัดหมายทั้งหมด</div>
          <p className="text-3xl font-bold">{stats.appointments}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><CurrencyCircleDollar className="w-4 h-4" /> บุคลากร</div>
          <p className="text-3xl font-bold">{stats.staff}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/clinic/analytics/advanced" className="bg-card border border-border rounded-2xl p-6 hover:border-primary transition-colors block">
          <h3 className="font-bold mb-2">Business Intelligence</h3>
          <p className="text-sm text-muted-foreground">วิเคราะห์ข้อมูลเชิงลึกและ KPI ของคลินิก</p>
        </Link>
        <Link href="/clinic/analytics/skin-analysis" className="bg-card border border-border rounded-2xl p-6 hover:border-primary transition-colors block">
          <h3 className="font-bold mb-2">AI Skin Analysis</h3>
          <p className="text-sm text-muted-foreground">สถิติการวิเคราะห์ผิวด้วย AI</p>
        </Link>
      </div>
    </div>
  );
}
