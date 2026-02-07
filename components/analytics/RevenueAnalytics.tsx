'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBar,
  TrendUp,
  CurrencyDollar,
  Sparkle,
  ArrowRight,
  Lightning
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';

interface FunnelStage {
  label: string;
  count: number;
  value: number;
  conversionRate: number;
}

interface TreatmentRevenue {
  name: string;
  revenue: number;
  count: number;
  avgTicket: number;
}

export default function RevenueAnalytics() {
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [treatmentRevenue, setTreatmentRevenue] = useState<TreatmentRevenue[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staffData } = await supabase
        .from('clinic_staff')
        .select('clinic_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!staffData?.clinic_id) return;
      const clinicId = staffData.clinic_id;

      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString();

      // Fetch skin analyses count
      const { count: analysisCount } = await supabase
        .from('skin_analyses')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .gte('created_at', sinceStr);

      // Fetch conversations (consultations)
      const { count: consultCount } = await supabase
        .from('customer_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .gte('created_at', sinceStr);

      // Fetch POS transactions
      const { data: transactions } = await supabase
        .from('pos_transactions')
        .select('id, total_amount, items, payment_status')
        .eq('clinic_id', clinicId)
        .eq('payment_status', 'completed')
        .gte('created_at', sinceStr);

      const txns = transactions || [];
      const revenue = txns.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      setTotalRevenue(revenue);

      // Build funnel
      const funnelData: FunnelStage[] = [
        {
          label: 'Skin Analysis',
          count: analysisCount || 0,
          value: 0,
          conversionRate: 100,
        },
        {
          label: 'Consultation',
          count: consultCount || 0,
          value: 0,
          conversionRate: analysisCount ? Math.round(((consultCount || 0) / analysisCount) * 100) : 0,
        },
        {
          label: 'Treatment Booked',
          count: txns.length,
          value: revenue,
          conversionRate: consultCount ? Math.round((txns.length / (consultCount || 1)) * 100) : 0,
        },
      ];
      setFunnel(funnelData);

      // Aggregate revenue by treatment type
      const revenueMap: Record<string, { revenue: number; count: number }> = {};
      txns.forEach(t => {
        const items = t.items || [];
        items.forEach((item: any) => {
          const name = item.item_name || 'Unknown';
          if (!revenueMap[name]) revenueMap[name] = { revenue: 0, count: 0 };
          revenueMap[name].revenue += item.total || 0;
          revenueMap[name].count += item.quantity || 1;
        });
      });

      const treatmentData = Object.entries(revenueMap)
        .map(([name, data]) => ({
          name,
          revenue: data.revenue,
          count: data.count,
          avgTicket: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);

      setTreatmentRevenue(treatmentData);
    } catch (e) {
      console.error('Revenue analytics error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-muted-foreground">Loading revenue analytics...</p>
      </div>
    );
  }

  const maxFunnelCount = Math.max(...funnel.map(f => f.count), 1);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <ChartBar className="w-4 h-4 text-primary" />
          Treatment Conversion Funnel
        </h3>
        <div className="flex gap-1">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition ${
                period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Total Revenue */}
      <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</p>
            <p className="text-3xl font-black text-emerald-400 tabular-nums">
              ฿{totalRevenue.toLocaleString()}
            </p>
          </div>
          <CurrencyDollar weight="duotone" className="w-10 h-10 text-emerald-400/30" />
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="space-y-3">
        {funnel.map((stage, i) => (
          <div key={stage.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{stage.label}</span>
                {i > 0 && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    stage.conversionRate >= 50 ? 'bg-emerald-500/20 text-emerald-400' :
                    stage.conversionRate >= 25 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {stage.conversionRate}% conversion
                  </span>
                )}
              </div>
              <span className="font-bold text-foreground tabular-nums">{stage.count}</span>
            </div>
            <div className="w-full h-6 bg-muted/20 rounded-lg overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stage.count / maxFunnelCount) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
                className={`h-full rounded-lg ${
                  i === 0 ? 'bg-blue-500/40' :
                  i === 1 ? 'bg-purple-500/40' :
                  'bg-emerald-500/40'
                }`}
              />
            </div>
            {i < funnel.length - 1 && (
              <div className="flex justify-center">
                <ArrowRight className="w-3 h-3 text-muted-foreground rotate-90" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue by Treatment */}
      {treatmentRevenue.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <TrendUp className="w-3.5 h-3.5" />
            Revenue by Treatment
          </h4>
          <div className="space-y-2">
            {treatmentRevenue.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-muted/20 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t.count} sales · Avg ฿{t.avgTicket.toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-black text-emerald-400 tabular-nums ml-3">
                  ฿{t.revenue.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {funnel.every(f => f.count === 0) && treatmentRevenue.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Sparkle className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No revenue data for this period</p>
          <p className="text-xs mt-1">Complete skin analyses and POS transactions to see funnel data</p>
        </div>
      )}
    </div>
  );
}
