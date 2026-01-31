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
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { createClient } from '@/lib/supabase/client';
import RevenueChart from '@/components/analytics/RevenueChart';
import StaffIntelligence from '@/components/analytics/StaffIntelligence';
import StrategicForecast from '@/components/analytics/StrategicForecast';
import { useEffect, useState, useMemo } from 'react';

export default function ClinicDashboard() {
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    icon: React.ComponentType<{ className?: string }>;
  }[]>([]);

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
            .eq('id', user.id)
            .single();
          
          if (staff) {
            setClinicId(staff.clinic_id);
            // Fetch real stats here in the future
            setStats([
              { label: 'Monthly Revenue', value: '฿425,000', change: '+12.5%', trend: 'up', icon: TrendingUp },
              { label: 'Total Scans', value: '1,284', change: '+18.2%', trend: 'up', icon: Sparkles },
              { label: 'Active Customers', value: '856', change: '+5.4%', trend: 'up', icon: Users },
              { label: 'Appointments', value: '42', change: '-2.1%', trend: 'down', icon: Calendar },
            ]);
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
      <div className="min-h-[400px] flex items-center justify-center">
        <Activity className="w-8 h-8 text-primary animate-spin" />
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
          <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2">
            Export Intelligence
          </button>
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-premium hover:brightness-110 transition-all active:scale-95 flex items-center gap-2">
            + Quick Action
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
                <span className="text-3xl font-black text-white tracking-tighter">{stat.value}</span>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Staff Intelligence */}
            {clinicId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <StaffIntelligence clinicId={clinicId} />
              </motion.div>
            )}

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

              <button className="w-full mt-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95 relative z-10">
                Full Strategic Analysis
              </button>
            </motion.div>
          </div>
        </div>

        {/* AI Usage & Performance Column */}
        <div className="space-y-8">
          {/* AI Quota Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-8 rounded-[40px] border border-white/10 space-y-6 relative overflow-hidden group"
          >
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-all duration-700" />
            
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                <Zap className="w-6 h-6 text-primary animate-pulse" />
                AI Infrastructure
              </h3>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-muted-foreground">Quota Utilization</span>
                  <span className="text-white">78.4%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '78.4%' }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-right italic font-light">784 of 1,000 scans remaining</p>
              </div>

              <div className="p-5 bg-black/20 rounded-3xl border border-white/5 space-y-3 text-center backdrop-blur-md">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">Secure Pipeline Architecture</p>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono bg-primary/10 text-primary px-3 py-2 rounded-xl border border-primary/20 uppercase tracking-tighter shadow-sm">Vercel AI Gateway 2.0</span>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-3 py-2 rounded-xl border border-emerald-500/20 uppercase tracking-tighter shadow-sm">Gemini 2.5 Pro Cognitive</span>
                </div>
              </div>

              <button className="w-full py-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-premium hover:brightness-110 active:scale-95 transition-all">
                Scale AI Capacity
              </button>
            </div>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-8 rounded-[40px] border border-white/10 space-y-6"
          >
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Node Status
            </h3>
            <div className="space-y-4">
              {[
                { name: "Core Database", status: "Operational" },
                { name: "Vision Pipeline", status: "Operational" },
                { name: "Messaging Node", status: "Operational" }
              ].map((node, i) => (
                <div key={i} className="flex justify-between items-center group p-3 bg-white/5 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/[0.08] transition-all">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter">{node.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{node.status}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
