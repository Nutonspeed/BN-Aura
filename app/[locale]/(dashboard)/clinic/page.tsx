'use client';

import { 
  TrendUp, 
  Users, 
  Sparkle, 
  CalendarDots, 
  ArrowUpRight, 
  ArrowDownRight,
  Pulse,
  SpinnerGap,
  ShoppingCart,
  ChartBar,
  ArrowRight,
  Package,
  CheckCircle,
  CaretRight,
  Strategy,
  Eye,
  ArrowLeft,
  Monitor,
  IdentificationBadge,
  Graph,
  Receipt,
  Icon,
  ShieldCheck,
  Clock,
  Briefcase
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import RevenueChart from '@/components/analytics/RevenueChart';
import StaffIntelligence from '@/components/analytics/StaffIntelligence';
import StrategicForecast from '@/components/analytics/StrategicForecast';
import { useEffect, useState, useMemo } from 'react';
import AnimatedNumber from '@/components/ui/premium/AnimatedNumber';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClinicDashboard() {
  const router = useRouter();
  const { goBack } = useBackNavigation();
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    label: string;
    value: number;
    change: number;
    trend: 'up' | 'down';
    icon: any;
    prefix?: string;
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
            .select('clinic_id, role')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
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
                { label: 'Monthly Revenue', value: Number(d.monthlyRevenue), change: 12.5, trend: 'up', icon: TrendUp, prefix: '฿' },
                { label: 'Total AI Scans', value: Number(d.totalScans), change: 18.2, trend: 'up', icon: Sparkle },
                { label: 'Active Customers', value: Number(d.activeCustomers), change: 5.4, trend: 'up', icon: Users },
                { label: 'Today Appointments', value: Number(d.todayAppointments), change: 2.1, trend: 'down', icon: CalendarDots },
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
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-xs uppercase tracking-widest text-center">
          Synchronizing Executive Node...
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-xs text-primary text-label"
          >
            <Pulse weight="duotone" className="w-4 h-4" />
            Executive Oversight Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-display text-foreground"
          >
            Clinic <span className="text-primary">Intelligence</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating multi-tenant operational reporting, clinical performance, and strategic growth matrices.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3"
        >
          <Button 
            onClick={() => router.push('/clinic/pos')}
            className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium group"
          >
            <ShoppingCart weight="bold" className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Launch Terminal
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/clinic/reports')}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary"
          >
            <ChartBar weight="duotone" className="w-4 h-4 text-primary" />
            Analytics Matrix
          </Button>
        </motion.div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            title={stat.label}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            icon={stat.icon as Icon}
            prefix={stat.prefix}
            className="p-4"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-2">
        {/* Revenue Projection & Forecasting */}
        <div className="lg:col-span-2 space-y-10">
          <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
            <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                  <TrendUp weight="duotone" className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Revenue Trajectory</CardTitle>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mt-0.5">Global yield synchronization</p>
                </div>
              </div>
              <div className="flex bg-secondary border border-border/50 p-1 rounded-xl shadow-inner">
                {['30d', '90d', 'All'].map((p) => (
                  <button
                    key={p}
                    className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:text-primary text-muted-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-8 min-h-[400px]">
              {clinicId && <RevenueChart clinicId={clinicId} />}
            </CardContent>
          </Card>

          {clinicId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <StrategicForecast clinicId={clinicId} />
            </motion.div>
          )}
        </div>

        {/* Sidebar Intelligence Nodes */}
        <div className="space-y-10">
          <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Package className="w-64 h-64 text-primary" />
            </div>

            <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                  <Package weight="duotone" className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm font-black uppercase tracking-tight text-foreground/80">Asset Alerts</CardTitle>
              </div>
              {stockAlerts.length > 0 && (
                <Badge variant="destructive" pulse className="font-black text-[8px] tracking-widest px-3 py-1">CRITICAL_NODE</Badge>
              )}
            </CardHeader>

            <CardContent className="p-8 space-y-4">
              {stockAlerts.length === 0 ? (
                <div className="py-16 text-center opacity-20 flex flex-col items-center gap-4">
                  <CheckCircle weight="duotone" className="w-12 h-12 text-emerald-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Inventory Nominal</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stockAlerts.map((item, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="p-5 bg-secondary/30 rounded-3xl border border-border/50 flex justify-between items-center group/alert hover:bg-secondary/50 transition-all cursor-pointer"
                      onClick={() => router.push('/clinic/inventory')}
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground group-hover/alert:text-primary transition-colors uppercase tracking-tight">{item.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="ghost" size="sm" className="bg-rose-500/10 text-rose-500 border-none font-black text-[8px] px-2">DEPLETION</Badge>
                          <span className="text-[9px] text-muted-foreground font-bold tabular-nums">STOCK: {item.stock_quantity}</span>
                        </div>
                      </div>
                      <div className="p-2 bg-rose-500/5 text-rose-500 rounded-xl border border-rose-500/10 group-hover/alert:bg-rose-500/10 transition-all">
                        <CaretRight weight="bold" className="w-3.5 h-3.5" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              
              <Button 
                variant="ghost"
                onClick={() => router.push('/clinic/inventory')}
                className="w-full mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary border border-dashed border-border/50 py-4 rounded-2xl"
              >
                Access Inventory Vault
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[40px] border-primary/10 bg-primary/[0.02] overflow-hidden group">
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/5 blur-[60px] rounded-full group-hover:bg-primary/10 transition-all duration-700" />
            
            <CardHeader className="p-8 border-b border-primary/10">
              <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3 text-primary">
                <Sparkle weight="duotone" className="w-5 h-5" />
                Strategic Intelligence
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-8 space-y-4 relative z-10">
              {[
                { title: "Optimal Node Window", desc: "14:00 - 17:00 Workdays", icon: Clock, color: "text-primary", bg: "bg-primary/5" },
                { title: "Peak Conversion Path", desc: "AI Scan → Premium Protocol", icon: Strategy, color: "text-emerald-500", bg: "bg-emerald-500/5" },
                { title: "Tenant Retention Rate", desc: "85% Month-over-Month", icon: Pulse, color: "text-blue-500", bg: "bg-blue-500/5" }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="p-5 bg-card border border-border/50 rounded-3xl hover:border-primary/20 transition-all group/intel"
                >
                  <div className="flex items-center gap-5">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-border/50 group-hover/intel:scale-110 transition-transform shadow-inner", item.bg, item.color)}>
                      <item.icon weight="duotone" className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.title}</p>
                      <p className="text-sm font-bold text-foreground tracking-tight uppercase">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <Button 
                variant="ghost"
                onClick={() => router.push('/clinic/reports')}
                className="w-full mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary"
              >
                Extract Full Intelligence Node
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}


