'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Sparkles, 
  Calendar,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck, 
  Activity,
  Loader2,
  ShoppingCart,
  BarChart3,
  ArrowRight,
  Package,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';
import RevenueChart from '@/components/analytics/RevenueChart';
import StaffIntelligence from '@/components/analytics/StaffIntelligence';
import StrategicForecast from '@/components/analytics/StrategicForecast';
import { useEffect, useState, useMemo } from 'react';

export default function ClinicDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    icon: React.ComponentType<{ className?: string }>;
  }[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchClinicData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: staff } = await supabase
            .from('clinic_staff')
            .select('clinic_id')
            .eq('user_id', user.id)
            .single();
          
          if (staff) {
            setClinicId(staff.clinic_id);
            
            // Fetch real overview stats and stock alerts
            const [reportRes, alertsRes] = await Promise.all([
              fetch('/api/reports?type=clinic_overview'),
              fetch('/api/reports?type=stock_alerts')
            ]);
            
            const result = await reportRes.json();
            const alertsResult = await alertsRes.json();
            
            if (result.success) {
              const d = result.data;
              setStats([
                { label: 'Monthly Revenue', value: `฿${Number(d.monthlyRevenue).toLocaleString()}`, change: '+12.5%', trend: 'up', icon: TrendingUp },
                { label: 'Total Scans', value: d.totalScans.toLocaleString(), change: '+18.2%', trend: 'up', icon: Sparkles },
                { label: 'Active Customers', value: d.activeCustomers.toLocaleString(), change: '+5.4%', trend: 'up', icon: Users },
                { label: 'Today Appointments', value: d.todayAppointments.toString(), change: '-2.1%', trend: 'down', icon: Calendar },
              ]);
            }

            if (alertsResult.success) {
              setStockAlerts(alertsResult.data);
            }
          }
        }
      } catch (err) {
        console.error('Clinic Dashboard Error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchClinicData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Synchronizing Executive Node...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20"
    >
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
          >
            <Activity className="w-4 h-4" />
            Executive Oversight
          </motion.div>
          <h1 className="text-4xl font-heading font-bold text-white uppercase tracking-tight">Executive <span className="text-primary text-glow">Intelligence</span></h1>
          <p className="text-muted-foreground font-light text-sm italic">Comprehensive clinic oversight & growth analytics.</p>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3"
        >
          <button 
            onClick={() => router.push('/clinic/pos')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-premium hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Open Terminal (POS)
          </button>
          <button 
            onClick={() => router.push('/clinic/reports')}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4 text-primary" />
            Reports
          </button>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="glass-card p-6 rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-500">
              <stat.icon className="w-16 h-16 text-primary" />
            </div>
            
            <div className="space-y-2 relative z-10">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter tabular-nums">{stat.value}</span>
                <span className={cn(
                  "text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-full bg-white/5",
                  stat.trend === 'up' ? "text-emerald-400" : "text-rose-400"
                )}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart Section */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            {clinicId && <RevenueChart clinicId={clinicId} />}
          </motion.div>

          {/* Strategic Forecast Section */}
          {clinicId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <StrategicForecast clinicId={clinicId} />
            </motion.div>
          )}
        </div>

        {/* Operational Alerts & Insights Column */}
        <div className="space-y-8">
          {/* Stock Alerts Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-8 rounded-[40px] border border-white/10 space-y-6 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                <Package className="w-6 h-6 text-primary" />
                Asset Alerts
              </h3>
              {stockAlerts.length > 0 && (
                <span className="px-2 py-1 rounded-md bg-rose-500 text-white text-[8px] font-black animate-pulse">CRITICAL</span>
              )}
            </div>

            <div className="space-y-4 relative z-10">
              {stockAlerts.map((item, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-rose-500/20 flex justify-between items-center group/item hover:bg-white/[0.08] transition-all">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-white group-hover/item:text-primary transition-colors">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Stock: {item.stock_quantity} / {item.min_stock_level}</p>
                  </div>
                  <button 
                    onClick={() => router.push('/clinic/inventory')}
                    className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition-all"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {stockAlerts.length === 0 && (
                <div className="py-10 text-center opacity-30">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 stroke-[1px]" />
                  <p className="text-xs font-black uppercase tracking-widest">Stock Nodes Nominal</p>
                </div>
              )}
              <button 
                onClick={() => router.push('/clinic/inventory')}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95"
              >
                Manage Inventory
              </button>
            </div>
          </motion.div>

          {/* Strategic Insights Brief */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-8 rounded-[40px] border border-white/10 space-y-6 relative overflow-hidden group"
          >
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-all duration-700" />
            
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-primary" />
                Strategic Insights
              </h3>
            </div>
            
            <div className="space-y-4 relative z-10">
              {[
                { title: "Peak Sales Window", desc: "14:00 - 17:00 weekdays", color: "text-primary" },
                { title: "Top Conversion Path", desc: "AI Scan -> HydraFacial Plus", color: "text-emerald-400" },
                { title: "Customer Retention", desc: "85% month-over-month", color: "text-amber-400" }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.08]"
                >
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.title}</p>
                  <p className={cn("text-sm font-bold", item.color)}>{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <button 
              onClick={() => router.push('/clinic/reports')}
              className="w-full mt-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95 relative z-10"
            >
              Full Strategic Analysis
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}


