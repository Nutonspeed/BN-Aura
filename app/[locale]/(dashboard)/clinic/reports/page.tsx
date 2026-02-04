'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBar, 
  Users, 
  FirstAidKit, 
  CalendarDots,
  DownloadSimple,
  Funnel,
  SpinnerGap,
  CaretRight,
  TrendUp,
  FileText
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'sales' | 'staff' | 'treatments'>('sales');
  const [data, setData] = useState<any[]>([]);
  const [period, setPeriod] = useState<'30d' | '90d' | '365d'>('30d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const typeMap = {
        sales: 'revenue_summary',
        staff: 'staff_performance',
        treatments: 'top_treatments'
      };
      
      const res = await fetch(`/api/reports?type=${typeMap[reportType]}`);
      const result = await res.json();
      
      if (result.success) {
        if (reportType === 'sales') setData(result.data.chartData);
        else setData(result.data);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  }, [reportType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const COLORS = ['#FFD700', '#4A90E2', '#50E3C2', '#FF6B6B', '#B8E986'];

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
            <ChartBar className="w-4 h-4" />
            Executive Intelligence
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Clinical <span className="text-primary text-glow">Analytics</span></h1>
          <p className="text-muted-foreground font-light text-sm italic">High-fidelity operational reporting and data-driven insights.</p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
            <DownloadSimple className="w-4 h-4" />
            Export Nodes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-64 space-y-2">
          {[
            { id: 'sales', label: 'Sales Velocity', icon: <TrendUp /> },
            { id: 'staff', label: 'Personnel Performance', icon: <Users /> },
            { id: 'treatments', label: 'Protocol Utilization', icon: <FirstAidKit /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border backdrop-blur-md",
                reportType === tab.id 
                  ? "bg-primary/10 text-primary border-primary/30 shadow-glow-sm" 
                  : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10 hover:text-white"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-8">
          {/* Main Chart Card */}
          <div className="glass-premium p-10 rounded-[48px] border border-white/5 relative overflow-hidden min-h-[500px]">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {reportType === 'sales' ? 'Revenue Trajectory' : 
                     reportType === 'staff' ? 'Personnel Efficiency' : 'Protocol Density'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1">Data visualization node</p>
                </div>
              </div>

              <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl">
                {(['30d', '90d', '365d'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      period === p ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="h-[350px] flex flex-col items-center justify-center space-y-4">
                <SpinnerGap className="w-8 h-8 text-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reconstructing Data...</p>
              </div>
            ) : data.length > 0 ? (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {reportType === 'sales' ? (
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        fontWeight="bold"
                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      />
                      <YAxis stroke="#ffffff20" fontSize={10} fontWeight="bold" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '16px' }}
                        itemStyle={{ color: '#FFD700' }}
                      />
                      <Bar dataKey="amount" fill="#FFD700" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={data} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                      <XAxis type="number" stroke="#ffffff20" fontSize={10} fontWeight="bold" />
                      <YAxis dataKey="name" type="category" stroke="#ffffff20" fontSize={10} fontWeight="bold" width={100} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '16px' }}
                        itemStyle={{ color: '#FFD700' }}
                      />
                      <Bar dataKey={reportType === 'staff' ? 'sales' : 'revenue'} radius={[0, 10, 10, 0]}>
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center opacity-20">
                <ChartBar className="w-16 h-16 mb-4" />
                <p className="text-sm font-black uppercase tracking-[0.2em]">Zero Telemetry Detected</p>
              </div>
            )}
          </div>

          {/* Data Table Area */}
          <div className="glass-premium rounded-[40px] border border-white/5 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Identity Node</th>
                  <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Node Metric</th>
                  <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((item, i) => (
                  <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5 text-sm font-bold text-white uppercase tracking-tight">
                      {item.name || item.date}
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-primary tabular-nums">
                      ฿{(item.amount || item.sales || item.revenue || 0).toLocaleString()}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.random() * 60 + 40}%` }}
                            className="h-full bg-primary/40 rounded-full"
                          />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground">OPTIMAL</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
