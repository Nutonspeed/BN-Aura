'use client';

import { 
  SpinnerGap,
  WarningCircle,
  ChartBar,
  CurrencyDollar,
  Lightning,
  Buildings,
  TrendUp,
  ArrowRight,
  DownloadSimple,
  ArrowLeft,
  Graph,
  Pulse,
  Monitor,
  IdentificationBadge,
  ArrowsClockwise,
  Sparkle,
  Target,
  Clock,
  ChartPieSlice,
  CheckCircle,
  Icon
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIUsageTab from './components/AIUsageTab';
import RevenueTab from './components/RevenueTab';
import ClinicsTab from './components/ClinicsTab';
import OverviewTab from './components/OverviewTab';
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
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function AnalyticsPage() {
  const { goBack } = useBackNavigation();
  const t = useTranslations('admin.analytics');
  const tCommon = useTranslations('common');
  
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'ai' | 'clinics'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    { id: 'overview', label: t('overview'), icon: ChartBar },
    { id: 'revenue', label: t('revenue'), icon: CurrencyDollar },
    { id: 'ai', label: t('ai_usage'), icon: Lightning },
    { id: 'clinics', label: t('clinics'), icon: Buildings }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simple refresh simulation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleExport = () => {
    // Simple export simulation
    console.log('Export functionality not implemented yet');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
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
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Graph weight="duotone" className="w-4 h-4" />
            วิเคราะห์ข้อมูล
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            System <span className="text-primary">Analytics</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            วิเคราะห์ประสิทธิภาพ รายได้ และข้อมูลการใช้งานคลินิก
          </motion.p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-secondary/50 border border-border/50 p-1.5 rounded-[24px] shadow-inner">
            {['7d', '30d', '90d', 'All'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
                  selectedPeriod === p
                    ? "bg-primary text-primary-foreground border-primary shadow-premium"
                    : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                )}
              >
                {p} Cycle
              </button>
            ))}
          </div>
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Sync Intel
          </Button>
          <Button className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium">
            <DownloadSimple weight="bold" className="w-4 h-4" />
            Export Matrix
          </Button>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="Consolidated Revenue"
          value={1250000}
          prefix="฿"
          icon={CurrencyDollar as Icon}
          trend="up"
          change={12.5}
          className="p-4"
        />
        <StatCard
          title="Active Nodes"
          value={20}
          icon={Buildings as Icon}
          trend="up"
          change={2}
          changeLabel="new clusters"
          className="p-4"
        />
        <StatCard
          title="Global AI Cycles"
          value={8432}
          icon={Sparkle as Icon}
          trend="up"
          change={8.2}
          className="p-4"
        />
        <StatCard
          title="Avg. Protocol Value"
          value={4500}
          prefix="฿"
          icon={Target as Icon}
          className="p-4"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-2">
        {/* Main Content Node */}
        <div className="lg:col-span-2 space-y-10">
          <div className="flex bg-secondary/50 border border-border/50 p-1.5 rounded-[24px] w-fit shadow-inner">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-3 px-8 py-3 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground border-primary shadow-premium"
                    : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                )}
              >
                <tab.icon weight={activeTab === tab.id ? "fill" : "bold"} className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
            <CardHeader className="p-8 border-b border-border/50 bg-secondary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                    {activeTab === 'overview' && <ChartBar weight="duotone" className="w-6 h-6" />}
                    {activeTab === 'revenue' && <CurrencyDollar weight="duotone" className="w-6 h-6" />}
                    {activeTab === 'ai' && <Lightning weight="duotone" className="w-6 h-6" />}
                    {activeTab === 'clinics' && <Buildings weight="duotone" className="w-6 h-6" />}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight">
                      {activeTab === 'overview' && 'System Overview Trajectory'}
                      {activeTab === 'revenue' && 'Financial Yield Analytics'}
                      {activeTab === 'ai' && 'Neural Processing Load'}
                      {activeTab === 'clinics' && 'Tenant Cluster Distribution'}
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mt-0.5">Global biometric performance sync</p>
                  </div>
                </div>
                <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[10px] tracking-widest uppercase px-4 py-1.5">Alpha Sync Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8 min-h-[450px] relative overflow-hidden">
              {activeTab === 'ai' ? (
                <AIUsageTab />
              ) : activeTab === 'revenue' ? (
                <RevenueTab />
              ) : activeTab === 'clinics' ? (
                <ClinicsTab />
              ) : activeTab === 'overview' ? (
                <OverviewTab />
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-8 h-full">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <ChartBar className="w-64 h-64 text-primary" />
                  </div>
                  
                  <div className="w-24 h-24 bg-primary/5 rounded-[40px] flex items-center justify-center text-primary/20 animate-pulse border-2 border-dashed border-primary/10 relative z-10">
                    <ChartBar weight="duotone" className="w-12 h-12" />
                  </div>
                  <div className="space-y-3 relative z-10">
                    <h4 className="text-2xl font-black text-foreground/40 uppercase tracking-widest">Protocol Hub Initializing</h4>
                    <p className="text-sm text-muted-foreground italic font-medium max-w-md mx-auto leading-relaxed">
                      High-fidelity visualization nodes for {activeTab} analytics are currently being synthesized.
                    </p>
                  </div>
                  <Button variant="outline" className="relative z-10 px-10 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border-border/50 hover:bg-secondary">
                    Access Legacy Reports
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Intelligence & Logs */}
        <div className="space-y-10">
          <Card className="rounded-[40px] border-border/50 overflow-hidden shadow-premium">
            <CardHeader className="p-8 border-b border-border/50 bg-secondary/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                  <Pulse weight="duotone" className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm font-black uppercase tracking-tight">Real-time Telemetry</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {[
                { label: 'System Uptime', val: '99.9%', icon: CheckCircle, color: 'text-emerald-500' },
                { label: 'Sync Velocity', val: '12ms', icon: Lightning, color: 'text-amber-500' },
                { label: 'Active Clusters', val: '24 Nodes', icon: Buildings, color: 'text-primary' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/50 hover:bg-secondary/50 transition-all group/node">
                  <div className="flex items-center gap-3">
                    <item.icon weight="duotone" className={cn("w-4 h-4", item.color)} />
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{item.val}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="p-8 rounded-[40px] border-primary/10 bg-primary/[0.02] space-y-6 group overflow-hidden relative">
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-all duration-700" />
            <div className="flex items-center gap-3 relative z-10">
              <Sparkle weight="duotone" className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Predictive Intel</h4>
            </div>
            <div className="space-y-2 relative z-10">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-foreground tabular-nums tracking-tighter">+18.4%</span>
                <Badge variant="ghost" className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[8px] uppercase px-2 py-0.5">Target</Badge>
              </div>
              <p className="text-xs text-muted-foreground italic font-medium leading-relaxed">
                Projected regional cluster expansion vector suggests a secondary yield peak in sector gamma by next fiscal quarter.
              </p>
            </div>
          </Card>

          <Card className="p-8 rounded-[40px] border-border shadow-card overflow-hidden group">
            <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] flex items-center gap-3 mb-6">
              <ChartPieSlice weight="duotone" className="w-5 h-5 text-primary" />
              Resource Allocation
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Compute Core Load</span>
                <span className="text-[9px] font-black text-primary uppercase">42% Utilization</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden p-0.5 border border-border/50 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '42%' }}
                  className="h-full bg-primary rounded-full shadow-glow-sm"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
