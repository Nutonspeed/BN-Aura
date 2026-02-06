'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CurrencyDollar, TrendUp, ChartBar, Wallet, Receipt, ShoppingCart } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function RevenueAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, thisMonth: 0, lastMonth: 0, avgTransaction: 0, totalTransactions: 0 });
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const { getClinicMetadata } = useAuth();

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
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

      if (!staffData) return;
      const clinicId = staffData.clinic_id;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

      const [allTxRes, thisMonthRes, lastMonthRes, recentRes] = await Promise.all([
        supabase.from('pos_transactions').select('total_amount').eq('clinic_id', clinicId).eq('payment_status', 'completed'),
        supabase.from('pos_transactions').select('total_amount').eq('clinic_id', clinicId).eq('payment_status', 'completed').gte('created_at', startOfMonth),
        supabase.from('pos_transactions').select('total_amount').eq('clinic_id', clinicId).eq('payment_status', 'completed').gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth),
        supabase.from('pos_transactions').select('*').eq('clinic_id', clinicId).order('created_at', { ascending: false }).limit(10),
      ]);

      const allTx = allTxRes.data || [];
      const thisMonthTx = thisMonthRes.data || [];
      const lastMonthTx = lastMonthRes.data || [];

      const totalRevenue = allTx.reduce((s: number, t: any) => s + (t.total_amount || 0), 0);
      const thisMonthRevenue = thisMonthTx.reduce((s: number, t: any) => s + (t.total_amount || 0), 0);
      const lastMonthRevenue = lastMonthTx.reduce((s: number, t: any) => s + (t.total_amount || 0), 0);
      const avgTransaction = allTx.length > 0 ? totalRevenue / allTx.length : 0;

      setStats({
        totalRevenue,
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        avgTransaction: Math.round(avgTransaction),
        totalTransactions: allTx.length
      });
      setRecentTx(recentRes.data || []);
    } catch (error) {
      console.error('Revenue fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const growthRate = stats.lastMonth > 0 ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1) : '0';

  if (loading) {
    return <div className="min-h-[400px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <CurrencyDollar weight="duotone" className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Revenue Analytics</h1>
          <p className="text-sm text-muted-foreground">Financial Intelligence Center</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Revenue', value: `฿${stats.totalRevenue.toLocaleString()}`, icon: CurrencyDollar, color: 'text-emerald-500' },
          { title: 'This Month', value: `฿${stats.thisMonth.toLocaleString()}`, sub: `${Number(growthRate) >= 0 ? '+' : ''}${growthRate}%`, icon: TrendUp, color: 'text-blue-500' },
          { title: 'Avg Transaction', value: `฿${stats.avgTransaction.toLocaleString()}`, icon: ChartBar, color: 'text-primary' },
          { title: 'Transactions', value: stats.totalTransactions.toString(), icon: Wallet, color: 'text-amber-500' },
        ].map((stat: any, idx) => (
          <Card key={idx} className="p-6 rounded-2xl border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                <p className="text-2xl font-black mt-1">{stat.value}</p>
                {stat.sub && <p className={`text-xs mt-1 ${Number(growthRate) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{stat.sub} vs last month</p>}
              </div>
              <stat.icon weight="duotone" className={`w-8 h-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Transactions & Monthly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 rounded-2xl border-border/50">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-black uppercase flex items-center gap-3">
              <Receipt weight="duotone" className="w-6 h-6 text-primary" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-3">
              {recentTx.length > 0 ? recentTx.map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">#{tx.id?.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-500">฿{(tx.total_amount || 0).toLocaleString()}</p>
                    <p className={`text-xs ${tx.payment_status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {tx.payment_status === 'completed' ? 'Completed' : tx.payment_status}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No transactions yet</p>
                  <p className="text-sm mt-2">Revenue data will appear after POS transactions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="p-8 rounded-2xl border-border/50">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-black uppercase flex items-center gap-3">
              <TrendUp weight="duotone" className="w-6 h-6 text-emerald-500" />
              Monthly Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-6">
              <div className="p-4 bg-secondary/20 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold">This Month</p>
                  <p className="text-lg font-black text-emerald-500">฿{stats.thisMonth.toLocaleString()}</p>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, stats.lastMonth > 0 ? (stats.thisMonth / stats.lastMonth * 100) : (stats.thisMonth > 0 ? 100 : 0))}%` }} />
                </div>
              </div>
              <div className="p-4 bg-secondary/20 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold">Last Month</p>
                  <p className="text-lg font-black text-muted-foreground">฿{stats.lastMonth.toLocaleString()}</p>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-muted-foreground/50 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Growth Rate</p>
                <p className={`text-3xl font-black mt-1 ${Number(growthRate) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {Number(growthRate) >= 0 ? '+' : ''}{growthRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
