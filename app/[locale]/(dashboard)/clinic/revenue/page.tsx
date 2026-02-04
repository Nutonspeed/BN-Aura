'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendUp, 
  CurrencyDollar, 
  CreditCard, 
  CalendarDots,
  ArrowUpRight,
  ArrowDownRight,
  SpinnerGap,
  SquaresFour,
  ChartBar,
  Users
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface RevenueStats {
  chartData: Array<{ date: string; amount: number }>;
  totalRevenue: number;
  transactionCount: number;
}

export default function RevenueDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [topTreatments, setTopTreatments] = useState<any[]>([]);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      if (period === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
      else if (period === '90d') startDate.setDate(startDate.getDate() - 90);

      const [revenueRes, treatmentsRes] = await Promise.all([
        fetch(`/api/reports?type=revenue_summary&startDate=${startDate.toISOString()}`),
        fetch(`/api/reports?type=top_treatments&startDate=${startDate.toISOString()}`)
      ]);

      const [revenueData, treatmentsData] = await Promise.all([
        revenueRes.json(),
        treatmentsRes.json()
      ]);

      if (revenueData.success) setStats(revenueData.data);
      if (treatmentsData.success) setTopTreatments(treatmentsData.data);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !stats) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Accessing Financial Nodes...</p>
      </div>
    );
  }

  const COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#4A90E2', '#50E3C2'];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            <TrendUp className="w-4 h-4" />
            Financial Intelligence
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Revenue <span className="text-primary text-glow">Intelligence</span></h1>
          <p className="text-muted-foreground font-light text-sm italic">Real-time terminal performance and fiscal growth metrics.</p>
        </div>

        <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                period === p ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Consolidated Revenue', value: `฿${stats?.totalRevenue.toLocaleString()}`, icon: CurrencyDollar, trend: '+12.5%', color: 'text-primary' },
          { label: 'Transaction Cycles', value: stats?.transactionCount.toLocaleString(), icon: CreditCard, trend: '+8.2%', color: 'text-blue-400' },
          { label: 'Average Ticket Node', value: `฿${stats?.transactionCount ? Math.round(stats.totalRevenue / stats.transactionCount).toLocaleString() : '0'}`, icon: ChartBar, trend: '-2.1%', color: 'text-emerald-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-premium p-8 rounded-[40px] border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-20 h-20 text-white" />
            </div>
            <div className="flex justify-between items-start mb-6">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:scale-110 transition-transform", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg bg-white/5 border border-white/10",
                stat.trend.startsWith('+') ? "text-emerald-400" : "text-rose-400"
              )}>
                {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-white tracking-tighter tabular-nums">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Revenue Area Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="xl:col-span-2 glass-premium p-10 rounded-[48px] border border-white/5"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Revenue Trajectory</h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1">Temporal Fiscal performance</p>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff20" 
                  fontSize={10} 
                  fontWeight="bold" 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                />
                <YAxis 
                  stroke="#ffffff20" 
                  fontSize={10} 
                  fontWeight="bold" 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `฿${val >= 1000 ? (val/1000) + 'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#ffffff10', borderRadius: '16px', color: '#fff' }}
                  itemStyle={{ color: '#FFD700', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#FFD700" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Treatments Bar Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-premium p-10 rounded-[48px] border border-white/5"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Top protocols</h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1">High-value clinical nodes</p>
            </div>
          </div>

          <div className="space-y-6">
            {topTreatments.slice(0, 5).map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-white group-hover:text-primary transition-colors truncate max-w-[150px]">{item.name}</span>
                  <span className="text-muted-foreground">฿{item.revenue.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.revenue / (topTreatments[0]?.revenue || 1)) * 100}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.4)]"
                  />
                </div>
              </div>
            ))}
            
            {topTreatments.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                <ChartBar className="w-12 h-12 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">No Protocol Data</p>
              </div>
            )}
          </div>

          <div className="mt-10 pt-8 border-t border-white/5">
            <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all">
              Full Protocol Analysis
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
