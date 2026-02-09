'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Funnel,
  TrendUp,
  TrendDown,
  Users,
  Coins,
  ChartBar,
  ArrowRight,
  CalendarDots,
  Target,
  Pulse,
  SpinnerGap
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface FunnelStage {
  name: string;
  count: number;
  color: string;
}

interface PeriodComparison {
  label: string;
  current: number;
  previous: number;
  format?: 'currency' | 'number' | 'percent';
}

export default function SalesAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [comparisons, setComparisons] = useState<PeriodComparison[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [conversionByMonth, setConversionByMonth] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

      // Fetch all customers for this sales staff
      const { data: allCustomers } = await supabase
        .from('customers')
        .select('id, full_name, status, created_at, updated_at, metadata')
        .eq('assigned_sales_id', user.id)
        .order('created_at', { ascending: false });

      const customers = allCustomers || [];

      // Build conversion funnel
      const totalLeads = customers.length;
      const contacted = customers.filter(c => c.status !== 'new').length;
      const qualified = customers.filter(c => ['qualified', 'converted', 'active'].includes(c.status)).length;
      const converted = customers.filter(c => c.status === 'converted').length;

      setFunnel([
        { name: 'ลูกค้าเป้าหมายทั้งหมด', count: totalLeads, color: 'bg-blue-500' },
        { name: 'ติดต่อแล้ว', count: contacted, color: 'bg-indigo-500' },
        { name: 'คุณภาพดี', count: qualified, color: 'bg-purple-500' },
        { name: 'แปลงสำเร็จ', count: converted, color: 'bg-emerald-500' },
      ]);

      // Period comparison: this month vs last month
      const thisMonthCustomers = customers.filter(c => c.created_at >= thisMonthStart);
      const lastMonthCustomers = customers.filter(c => c.created_at >= lastMonthStart && c.created_at <= lastMonthEnd);

      // Get customer IDs for transaction queries
      const customerIds = customers.map(c => c.id);

      let thisMonthRevenue = 0;
      let lastMonthRevenue = 0;

      if (customerIds.length > 0) {
        const { data: thisMonthTx } = await supabase
          .from('pos_transactions')
          .select('total_amount')
          .in('customer_id', customerIds)
          .gte('created_at', thisMonthStart);

        thisMonthRevenue = (thisMonthTx || []).reduce((s, t) => s + parseFloat(t.total_amount || '0'), 0);

        const { data: lastMonthTx } = await supabase
          .from('pos_transactions')
          .select('total_amount')
          .in('customer_id', customerIds)
          .gte('created_at', lastMonthStart)
          .lte('created_at', lastMonthEnd);

        lastMonthRevenue = (lastMonthTx || []).reduce((s, t) => s + parseFloat(t.total_amount || '0'), 0);
      }

      const thisMonthConversions = thisMonthCustomers.filter(c => c.status === 'converted').length;
      const lastMonthConversions = lastMonthCustomers.filter(c => c.status === 'converted').length;

      setComparisons([
        { label: 'ลูกค้าใหม่', current: thisMonthCustomers.length, previous: lastMonthCustomers.length, format: 'number' },
        { label: 'รายได้', current: thisMonthRevenue, previous: lastMonthRevenue, format: 'currency' },
        { label: 'การแปลง', current: thisMonthConversions, previous: lastMonthConversions, format: 'number' },
        {
          label: 'อัตราแปลง',
          current: thisMonthCustomers.length > 0 ? (thisMonthConversions / thisMonthCustomers.length) * 100 : 0,
          previous: lastMonthCustomers.length > 0 ? (lastMonthConversions / lastMonthCustomers.length) * 100 : 0,
          format: 'percent'
        },
      ]);

      // Top customers by spending
      const customersWithSpend = customers
        .map(c => ({
          id: c.id,
          name: c.full_name || 'ไม่ระบุ',
          spent: (c.metadata as any)?.total_spent || 0,
          status: c.status,
          purchases: (c.metadata as any)?.total_purchases || 0,
        }))
        .filter(c => c.spent > 0)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5);

      setTopCustomers(customersWithSpend);

      // Monthly conversion data (last 6 months)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const monthName = mStart.toLocaleDateString('th-TH', { month: 'short' });

        const monthCustomers = customers.filter(c => {
          const d = new Date(c.created_at);
          return d >= mStart && d <= mEnd;
        });
        const monthConverted = monthCustomers.filter(c => c.status === 'converted').length;

        monthlyData.push({
          month: monthName,
          leads: monthCustomers.length,
          converted: monthConverted,
          rate: monthCustomers.length > 0 ? Math.round((monthConverted / monthCustomers.length) * 100) : 0,
        });
      }
      setConversionByMonth(monthlyData);

    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case 'currency': return `฿${Math.round(value).toLocaleString()}`;
      case 'percent': return `${value.toFixed(1)}%`;
      default: return value.toString();
    }
  };

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerGap className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const maxFunnel = Math.max(...funnel.map(f => f.count), 1);

  return (
    <div className="space-y-6">
      {/* Period Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {comparisons.map((comp, idx) => {
          const change = getChangePercent(comp.current, comp.previous);
          const isPositive = change >= 0;

          return (
            <motion.div
              key={comp.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-5 rounded-2xl border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{comp.label}</p>
                <p className="text-2xl font-black mt-2">{formatValue(comp.current, comp.format)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={cn(
                    'flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full',
                    isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                  )}>
                    {isPositive ? <TrendUp className="w-3 h-3" /> : <TrendDown className="w-3 h-3" />}
                    {Math.abs(change).toFixed(0)}%
                  </div>
                  <span className="text-[10px] text-muted-foreground">vs เดือนก่อน</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  เดือนก่อน: {formatValue(comp.previous, comp.format)}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Conversion Funnel */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Funnel weight="duotone" className="w-5 h-5 text-purple-500" />
            Sales Funnel — กระบวนการขาย
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnel.map((stage, idx) => {
              const widthPercent = maxFunnel > 0 ? (stage.count / maxFunnel) * 100 : 0;
              const convRate = idx > 0 && funnel[idx - 1].count > 0
                ? ((stage.count / funnel[idx - 1].count) * 100).toFixed(0)
                : null;

              return (
                <motion.div
                  key={stage.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{stage.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black">{stage.count}</span>
                      {convRate && (
                        <Badge className="bg-secondary text-muted-foreground text-[10px]">
                          {convRate}% จากขั้นก่อน
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.15 }}
                      className={cn('h-full rounded-full', stage.color)}
                    />
                  </div>
                  {idx < funnel.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowRight className="w-3 h-3 text-muted-foreground/30 rotate-90" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Conversion Trend */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <CalendarDots weight="duotone" className="w-5 h-5 text-indigo-500" />
              แนวโน้มรายเดือน (6 เดือน)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionByMonth.map((m, idx) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-12">{m.month}</span>
                  <div className="flex-1 flex gap-1 items-center">
                    <div className="flex-1 bg-secondary rounded-full h-4 overflow-hidden relative">
                      <div
                        className="h-full bg-blue-500/60 rounded-full absolute left-0"
                        style={{ width: `${Math.min(100, (m.leads / Math.max(...conversionByMonth.map(x => x.leads), 1)) * 100)}%` }}
                      />
                      <div
                        className="h-full bg-emerald-500 rounded-full absolute left-0"
                        style={{ width: `${Math.min(100, (m.converted / Math.max(...conversionByMonth.map(x => x.leads), 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right w-24 flex items-center gap-2">
                    <span className="text-xs text-blue-400">{m.leads}</span>
                    <span className="text-[10px] text-muted-foreground">/</span>
                    <span className="text-xs text-emerald-400">{m.converted}</span>
                    <Badge className="bg-secondary text-[9px] px-1">{m.rate}%</Badge>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-2 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500/60 rounded-full" /> ลูกค้าเข้า</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> แปลงสำเร็จ</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers by Spending */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Target weight="duotone" className="w-5 h-5 text-amber-500" />
              ลูกค้า Top Spenders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Coins className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">ยังไม่มีข้อมูลการใช้จ่าย</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black',
                      idx === 0 ? 'bg-amber-500/20 text-amber-500' :
                      idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                      idx === 2 ? 'bg-orange-600/20 text-orange-600' :
                      'bg-secondary text-muted-foreground'
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.purchases} รายการซื้อ</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-500">฿{c.spent.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
