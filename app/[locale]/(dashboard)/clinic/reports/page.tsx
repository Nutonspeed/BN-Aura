'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FileText,
  ArrowLeft,
  ArrowsClockwise,
  CheckCircle,
  Pulse,
  ChartLineUp,
  PresentationChart,
  UserCheck
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import ResponsiveTable from '@/components/ui/ResponsiveTable';
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
  const { goBack } = useBackNavigation();
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

  const columns = [
    {
      header: 'Identity Node',
      accessor: (item: any) => (
        <span className="text-sm font-bold text-foreground uppercase tracking-tight">
          {item.name || item.date}
        </span>
      )
    },
    {
      header: 'Node Metric',
      accessor: (item: any) => (
        <span className="text-sm font-bold text-primary tabular-nums">
          ฿{(item.amount || item.sales || item.revenue || 0).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Efficiency',
      accessor: () => (
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden border border-border">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.random() * 60 + 40}%` }}
              className="h-full bg-primary/40 rounded-full"
            />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">OPTIMAL</span>
        </div>
      )
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <PresentationChart weight="duotone" className="w-4 h-4" />
            Executive Data Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight"
          >
            Clinical <span className="text-primary">Reports</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            High-fidelity operational reporting and multidimensional performance telemetry.
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={fetchData}
            disabled={loading}
            className="gap-2"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Intel
          </Button>
          <Button className="gap-2 shadow-premium px-8">
            <DownloadSimple weight="bold" className="w-4 h-4" />
            Export Archive
          </Button>
        </div>
      </div>

      {/* Stats Summary - Contextual based on report type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportType === 'sales' ? (
          <>
            <StatCard title="Gross Volume" value={data.reduce((acc, i) => acc + (i.amount || 0), 0)} prefix="฿" icon={ChartLineUp} trend="up" change={12.5} />
            <StatCard title="Transaction Density" value={data.length} icon={Pulse} trend="neutral" />
            <StatCard title="Average Node Value" value={data.length ? Math.round(data.reduce((acc, i) => acc + (i.amount || 0), 0) / data.length) : 0} prefix="฿" icon={ChartBar} trend="up" change={2.1} />
          </>
        ) : reportType === 'staff' ? (
          <>
            <StatCard title="Active Practitioners" value={data.length} icon={UserCheck} trend="neutral" />
            <StatCard title="Top Performance" value={data.length ? Math.max(...data.map(i => i.sales || 0)) : 0} prefix="฿" icon={TrendUp} trend="up" change={15.2} />
            <StatCard title="Efficiency Mean" value={data.length ? Math.round(data.reduce((acc, i) => acc + (i.sales || 0), 0) / data.length) : 0} prefix="฿" icon={Pulse} trend="neutral" />
          </>
        ) : (
          <>
            <StatCard title="Protocol Portfolio" value={data.length} icon={FirstAidKit} trend="neutral" />
            <StatCard title="Peak Utilization" value={data.length ? Math.max(...data.map(i => i.revenue || 0)) : 0} prefix="฿" icon={TrendUp} trend="up" change={8.4} />
            <StatCard title="Service Yield" value={data.length ? Math.round(data.reduce((acc, i) => acc + (i.revenue || 0), 0) / data.length) : 0} prefix="฿" icon={ChartBar} trend="up" change={5.7} />
          </>
        )}
      </div>

      {/* Main Analysis Interface */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-72 flex-shrink-0">
          <Card className="sticky top-28 border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Analytics Vectors</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {[
                { id: 'sales', label: 'Sales Velocity', icon: TrendUp },
                { id: 'staff', label: 'Practitioner Intel', icon: Users },
                { id: 'treatments', label: 'Protocol Density', icon: FirstAidKit },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setReportType(tab.id as any)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest border",
                    reportType === tab.id 
                      ? "bg-primary/10 text-primary border-primary/30 shadow-sm" 
                      : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <tab.icon weight={reportType === tab.id ? "fill" : "duotone"} className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 space-y-8">
          {/* Main Visualization Node */}
          <Card className="relative overflow-hidden group border-border/50">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <PresentationChart className="w-64 h-64 text-primary" />
            </div>

            <CardHeader className="border-b border-border/50 pb-6 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                    <FileText weight="duotone" className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      {reportType === 'sales' ? 'Revenue Trajectory' : 
                       reportType === 'staff' ? 'Personnel Efficiency' : 'Protocol Density Matrix'}
                    </CardTitle>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Telemetry visualization</p>
                  </div>
                </div>

                <div className="flex bg-secondary/50 border border-border p-1 rounded-2xl shadow-inner">
                  {(['30d', '90d', '365d'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={cn(
                        "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        period === p ? "bg-card text-primary border-border/50 shadow-sm" : "text-muted-foreground border-transparent hover:text-foreground hover:bg-card/50"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-10 relative z-10">
              {loading ? (
                <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                  <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reconstructing Node Data...</p>
                </div>
              ) : data.length > 0 ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {reportType === 'sales' ? (
                      <BarChart data={data}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={1}/>
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.6}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.05} vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="currentColor" 
                          opacity={0.4}
                          fontSize={10} 
                          fontWeight="bold"
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        />
                        <YAxis stroke="currentColor" opacity={0.4} fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(var(--primary-rgb), 0.05)', radius: 8 }}
                          contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                          itemStyle={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px' }}
                        />
                        <Bar dataKey="amount" fill="url(#barGradient)" radius={[8, 8, 0, 0]} barSize={24} />
                      </BarChart>
                    ) : (
                      <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.05} horizontal={false} />
                        <XAxis type="number" stroke="currentColor" opacity={0.4} fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke="currentColor" opacity={0.4} fontSize={10} fontWeight="bold" width={120} axisLine={false} tickLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(var(--primary-rgb), 0.05)', radius: 8 }}
                          contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px' }}
                          itemStyle={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px' }}
                        />
                        <Bar dataKey={reportType === 'staff' ? 'sales' : 'revenue'} radius={[0, 8, 8, 0]} barSize={24}>
                          {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center opacity-20 gap-4">
                  <ChartBar weight="duotone" className="w-16 h-16" />
                  <p className="text-sm font-black uppercase tracking-[0.3em]">Zero Telemetry Signal</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Data Registry */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Detailed Metric Registry
            </h4>
            <Card className="border-border/50">
              <ResponsiveTable
                columns={columns}
                data={data}
                loading={loading}
                rowKey={(item) => item.id || item.date || Math.random().toString()}
                emptyMessage="No telemetry data recorded for this period."
                mobileCard={(item) => (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Node Identity</p>
                        <p className="text-base font-bold text-foreground uppercase">{item.name || item.date}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Node Value</p>
                        <p className="text-lg font-black text-primary tabular-nums">
                          ฿{(item.amount || item.sales || item.revenue || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden border border-border">
                          <div className="h-full bg-primary/40 rounded-full w-[75%]" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase">OPTIMAL</span>
                      </div>
                    </div>
                  </div>
                )}
              />
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
